#!/usr/bin/env node

const { Pool } = require('pg');
const axios = require('axios');
const readline = require('readline');
const DATABASE = require('../db.config');

const HTTP_TIMEOUT_MS = 5000;
const REQUEST_CONCURRENCY = 8;

function isReachableStatus(status) {
	return (status >= 200 && status < 400) || (status >= 500 && status < 600);
}

function isPrivateStatus(status) {
	return status === 401 || status === 403;
}

function isUnavailableStatus(status) {
	return status >= 400 && status < 500 && !isPrivateStatus(status);
}

function normalizeUrl(url) {
	try {
		const parsed = new URL(url);
		let normalizedPath = parsed.pathname;
		if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
			normalizedPath = normalizedPath.slice(0, -1);
		}
		return `${parsed.protocol}//${parsed.host}${normalizedPath}${parsed.search}${parsed.hash}`;
	} catch (error) {
		return url;
	}
}

function isAbsoluteUrl(url) {
	try {
		new URL(url);
		return true;
	} catch (error) {
		return false;
	}
}

function asBoolean(value) {
	return value === true;
}

class DbMaintenanceCli {

	constructor() {
		this.pool = new Pool(DATABASE);
		this.issues = [];
		this.issueCounter = 0;
		this.progress = {
			total: 0,
			done: 0,
			start: null
		};
		this.rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
	}

	async run() {
		console.log('STAC Index DB check');
		console.log('');

		await this.initProgress();

		await this.checkTableUrls('ecosystem');
		await this.checkTableUrls('tutorials');
		await this.checkCatalogs();
		this.finishProgress();

		this.printIssues();

		const fixableIssues = this.issues.filter(issue => issue.fixes.length > 0);
		if (fixableIssues.length === 0) {
			console.log('No fixable issues found.');
			return;
		}

		const doFixes = await this.askYesNo('Do you want to review and apply fixes now? [y/N] ', false);
		if (!doFixes) {
			console.log('No changes applied.');
			return;
		}

		let applied = 0;
		for (const issue of fixableIssues) {
			const fixed = await this.promptAndApplyFix(issue);
			if (fixed) {
				applied += 1;
			}
		}

		console.log('');
		console.log(`Applied fixes: ${applied}`);
		console.log('Done.');
	}

	async close() {
		this.rl.close();
		await this.pool.end();
	}

	async checkTableUrls(table) {
		const rows = await this.fetchRows(table);
		await this.runInParallel(rows, REQUEST_CONCURRENCY, async row => {
			const response = await this.requestUrl(row.url);
			if (response.error) {
				this.addIssue({
					table,
					row,
					type: 'url_unreachable',
					message: `URL request failed (${response.error})`,
					fixes: [
						{
							label: 'Remove this entry from the table',
							action: async () => this.removeRow(table, row.id)
						}
					]
				});
				this.tickProgress(table, row.id);
				return;
			}

			if (!isReachableStatus(response.status)) {
				const fixes = [];
				if (isUnavailableStatus(response.status)) {
					fixes.push({
						label: 'Remove this entry from the table',
						action: async () => this.removeRow(table, row.id)
					});
				}

				this.addIssue({
					table,
					row,
					type: 'url_unreachable',
					message: `URL returned HTTP ${response.status} (expected 2xx, 3xx or 5xx)`,
					fixes
				});
			}

			this.tickProgress(table, row.id);
		});
	}

	async checkCatalogs() {
		const table = 'catalogs';
		const rows = await this.fetchRows(table);

		await this.runInParallel(rows, REQUEST_CONCURRENCY, async row => {
			const response = await this.requestUrl(row.url);

			if (response.error) {
				this.addIssue({
					table,
					row,
					type: 'url_unreachable',
					message: `URL request failed (${response.error})`,
					fixes: [
						{
							label: 'Remove this catalog entry',
							action: async () => this.removeRow(table, row.id)
						}
					]
				});
				this.tickProgress(table, row.id);
				return;
			}

			if (isPrivateStatus(response.status) && row.access !== 'private') {
				this.addIssue({
					table,
					row,
					type: 'access_should_be_private',
					message: `URL returned HTTP ${response.status}; catalog should be marked as private`,
					fixes: [
						{
							label: 'Set access to private',
							action: async () => this.updateCatalogAccess(row.id, 'private')
						}
					]
				});
			}

			if (isUnavailableStatus(response.status)) {
				this.addIssue({
					table,
					row,
					type: 'catalog_unavailable',
					message: `URL returned HTTP ${response.status}; catalog appears unavailable`,
					fixes: [
						{
							label: 'Remove this catalog entry',
							action: async () => this.removeRow(table, row.id)
						}
					]
				});
				this.tickProgress(table, row.id);
				return;
			}

			if (!isReachableStatus(response.status)) {
				this.addIssue({
					table,
					row,
					type: 'url_unreachable',
					message: `URL returned HTTP ${response.status} (expected 2xx, 3xx or 5xx)`,
					fixes: []
				});
				this.tickProgress(table, row.id);
				return;
			}

			if (!response.isJsonObject) {
				this.addIssue({
					table,
					row,
					type: 'catalog_response_not_stac_json',
					message: 'Catalog URL is reachable but response is not a JSON object; STAC checks skipped',
					fixes: []
				});
				this.tickProgress(table, row.id);
				return;
			}

			this.checkCatalogLinks(row, response.data);
			this.checkCatalogApiFlag(row, response.data);
			this.tickProgress(table, row.id);
		});
	}

	async initProgress() {
		const [ecosystemRows, tutorialRows, catalogRows] = await Promise.all([
			this.fetchRows('ecosystem'),
			this.fetchRows('tutorials'),
			this.fetchRows('catalogs')
		]);
		this.progress.total = ecosystemRows.length + tutorialRows.length + catalogRows.length;
		this.progress.done = 0;
		this.progress.start = Date.now();
		if (this.progress.total > 0) {
			process.stdout.write(`Progress: 0/${this.progress.total} (0%)`);
			process.stdout.write('\r');
		}
	}

	tickProgress(table, id) {
		if (this.progress.total <= 0) {
			return;
		}
		this.progress.done += 1;
		const percent = Math.floor((this.progress.done / this.progress.total) * 100);
		process.stdout.write(`Progress: ${this.progress.done}/${this.progress.total} (${percent}%) - ${table}#${id}   `);
		process.stdout.write('\r');
	}

	finishProgress() {
		if (this.progress.total <= 0) {
			console.log('No rows to check.');
			return;
		}
		const elapsedMs = Date.now() - this.progress.start;
		const elapsedSec = (elapsedMs / 1000).toFixed(1);
		process.stdout.write(`Progress: ${this.progress.done}/${this.progress.total} (100%)`);
		process.stdout.write('\n');
		console.log(`Completed in ${elapsedSec}s with concurrency ${REQUEST_CONCURRENCY}.`);
		console.log('');
	}

	async runInParallel(items, concurrency, worker) {
		if (!Array.isArray(items) || items.length === 0) {
			return;
		}

		let index = 0;
		const runner = async () => {
			while (index < items.length) {
				const currentIndex = index;
				index += 1;
				await worker(items[currentIndex]);
			}
		};

		const workerCount = Math.max(1, Math.min(concurrency, items.length));
		const runners = Array.from({ length: workerCount }, () => runner());
		await Promise.all(runners);
	}

	checkCatalogLinks(row, data) {
		const links = Array.isArray(data.links) ? data.links : [];
		const rootOrSelfLinks = links
			.filter(link => link && typeof link.rel === 'string' && typeof link.href === 'string')
			.filter(link => link.rel === 'root' || link.rel === 'self');
		const absoluteSelfLinks = rootOrSelfLinks.filter(link => link.rel === 'self' && isAbsoluteUrl(link.href));
		const absoluteRootLinks = rootOrSelfLinks.filter(link => link.rel === 'root' && isAbsoluteUrl(link.href));

		if (rootOrSelfLinks.length === 0) {
			this.addIssue({
				table: 'catalogs',
				row,
				type: 'missing_root_or_self_link',
				message: 'Catalog response has no root/self link with href',
				fixes: []
			});
			return;
		}

		const sourceUrl = normalizeUrl(row.url);
		const normalizedHrefs = rootOrSelfLinks.map(link => normalizeUrl(link.href));
		const hasMatch = normalizedHrefs.includes(sourceUrl);

		if (!hasMatch) {
			const preferredHref = absoluteSelfLinks.length > 0
				? absoluteSelfLinks[0].href
				: (absoluteRootLinks.length > 0 ? absoluteRootLinks[0].href : null);
			const fixes = preferredHref
				? [
					{
						label: `Update catalog URL to ${preferredHref}`,
						action: async () => this.updateCatalogUrl(row.id, preferredHref)
					}
				]
				: [];
			const message = preferredHref
				? `Catalog URL does not match root/self href in STAC response (suggested: ${preferredHref})`
				: 'Catalog URL does not match root/self href in STAC response (no absolute root/self href available for auto-fix)';
			this.addIssue({
				table: 'catalogs',
				row,
				type: 'catalog_url_mismatch',
				message,
				fixes
			});
		}
	}

	checkCatalogApiFlag(row, data) {
		const hasConformsTo = Boolean(data.conformsTo || data.api_version);
		const currentIsApi = asBoolean(row.is_api);
		if (hasConformsTo !== currentIsApi) {
			this.addIssue({
				table: 'catalogs',
				row,
				type: 'is_api_mismatch',
				message: `is_api is ${currentIsApi} but response ${hasConformsTo ? 'contains' : 'does not contain'} conformsTo`,
				fixes: [
					{
						label: `Set is_api to ${hasConformsTo}`,
						action: async () => this.updateCatalogIsApi(row.id, hasConformsTo)
					}
				]
			});
		}
	}

	async fetchRows(table) {
		const result = await this.pool.query(`SELECT * FROM ${table} ORDER BY id ASC`);
		return result.rows;
	}

	async requestUrl(url) {
		try {
			const response = await axios.get(url, {
				timeout: HTTP_TIMEOUT_MS,
				maxRedirects: 5,
				validateStatus: () => true,
				headers: {
					accept: 'application/json, application/geo+json;q=0.9, */*;q=0.8',
					'user-agent': 'stac-index-db-check/1.0'
				}
			});

			const data = response.data;
			const isJsonObject = data !== null && typeof data === 'object' && !Array.isArray(data);
			return {
				status: response.status,
				data,
				isJsonObject
			};
		} catch (error) {
			const errorMessage = error && error.message ? error.message : 'Unknown error';
			return { error: errorMessage };
		}
	}

	addIssue({ table, row, type, message, fixes }) {
		this.issueCounter += 1;
		this.issues.push({
			id: this.issueCounter,
			table,
			row,
			type,
			message,
			fixes: Array.isArray(fixes) ? fixes : []
		});
	}

	printIssues() {
		console.log('Issue report');
		console.log('============');

		if (this.issues.length === 0) {
			console.log('No issues found.');
			console.log('');
			return;
		}

		for (const issue of this.issues) {
			this.printIssueDetails(issue);
		}
	}

	printIssueDetails(issue) {
		const title = issue.row && issue.row.title ? issue.row.title : '(no title)';
		console.log(`[${issue.id}] ${issue.table}#${issue.row.id} - ${title}`);
		console.log(`    URL: ${issue.row.url}`);
		console.log(`    Type: ${issue.type}`);
		console.log(`    Details: ${issue.message}`);
		if (issue.fixes.length > 0) {
			for (let i = 0; i < issue.fixes.length; i += 1) {
				console.log(`    Fix ${i + 1}: ${issue.fixes[i].label}`);
			}
		} else {
			console.log('    Fix: none (report only)');
		}
		console.log('');
	}

	async promptAndApplyFix(issue) {
		if (issue.fixes.length === 0) {
			return false;
		}

		this.printIssueDetails(issue);

		let selected = -1;
		if (issue.fixes.length === 1) {
			const apply = await this.askYesNo(`Apply fix: ${issue.fixes[0].label}? [y/N] `, false);
			selected = apply ? 0 : -1;
		} else {
			console.log('Available fixes:');
			for (let i = 0; i < issue.fixes.length; i += 1) {
				console.log(`  ${i + 1}) ${issue.fixes[i].label}`);
			}
			console.log('  0) Skip this issue');

			const input = await this.ask('Select fix number: ');
			const parsed = Number.parseInt(input, 10);
			if (Number.isInteger(parsed) && parsed >= 1 && parsed <= issue.fixes.length) {
				selected = parsed - 1;
			}
		}

		if (selected < 0) {
			console.log('Skipped.');
			console.log('');
			return false;
		}

		await issue.fixes[selected].action();
		console.log('Fix applied.');
		console.log('');
		return true;
	}

	async updateCatalogAccess(id, access) {
		await this.pool.query(
			'UPDATE catalogs SET access = $1, updated = NOW() WHERE id = $2',
			[access, id]
		);
	}

	async updateCatalogUrl(id, url) {
		await this.pool.query(
			'UPDATE catalogs SET url = $1, updated = NOW() WHERE id = $2',
			[url, id]
		);
	}

	async updateCatalogIsApi(id, isApi) {
		await this.pool.query(
			'UPDATE catalogs SET is_api = $1, updated = NOW() WHERE id = $2',
			[isApi, id]
		);
	}

	async removeRow(table, id) {
		await this.pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
	}

	ask(question) {
		return new Promise(resolve => {
			this.rl.question(question, answer => resolve(answer.trim()));
		});
	}

	async askYesNo(question, defaultValue = false) {
		const answer = (await this.ask(question)).toLowerCase();
		if (answer === '') {
			return defaultValue;
		}
		if (answer === 'y' || answer === 'yes') {
			return true;
		}
		if (answer === 'n' || answer === 'no') {
			return false;
		}
		return defaultValue;
	}

}

async function main() {
	const cli = new DbMaintenanceCli();
	try {
		await cli.run();
	} catch (error) {
		console.error('The database check failed.');
		console.error(error);
		process.exitCode = 1;
	} finally {
		await cli.close();
	}
}

main();