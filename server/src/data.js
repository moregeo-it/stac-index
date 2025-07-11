const { Pool } = require('pg');
const axios = require('axios');
const Utils = require('lodash');
const { CATEGORIES, DEV, LINK_REGEXP } = require('../../commons');

const emailRegExp = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
const validAccess = ['public', 'protected', 'private'];

module.exports = class Data {

	constructor(db) {
		this.db = new Pool(db);
		this.loadLanguages();
		this.initSpokenLanguages();
	}

	loadLanguages() {
		const P_LANGUAGES = require('list-of-programming-languages');
		this.languages = P_LANGUAGES.itemListElement.map(item => item.item.name);
		this.languages.push('Web');
		this.languages.push('Other');
		this.languages.push('PureScript'); // See https://github.com/stac-utils/stac-index/issues/16
		this.languages.sort();
	}

	initSpokenLanguages() {
		const S_LANGUAGES = require('language-name-map/map');
		this.spokenLanguages = [];
		for(let code in S_LANGUAGES) {
			let name = S_LANGUAGES[code].name;
			this.spokenLanguages.push({code, name});
		}
		this.spokenLanguages.sort((a,b) => a.name.localeCompare(b.name));
	}

	getLanguages() {
		return this.languages;
	}

	getSpokenLanguages() {
		return this.spokenLanguages;
	}

	async getEcosystem() {
		return this.upgradeEcosystems(await this.getAllSorted("ecosystem"));
	}

	async getNewestEcosystem(recent = 3) {
		return this.upgradeEcosystems(await this.getNewest("ecosystem", recent));
	}

	async getTutorials() {
		return this.upgradeTutorials(await this.getAllSorted("tutorials"));
	}

	async getTutorialTags() {
		return CATEGORIES.map(c => c.toLowerCase()); // ToDo: Return all existing tags from tutorials DB instead
	}

	async getNewestTutorials(recent = 3) {
		return this.upgradeTutorials(await this.getNewest("tutorials", recent));
	}

	async getCatalogs() {
		return this.upgradeCatalogs(await this.getAllSorted("catalogs"));
	}

	async getNewestData(recent = 3) {
		return this.upgradeCatalogs(await this.getNewest("catalogs", recent));
	}

	async getAllSorted(table) {
		return await this.getAll(table, "*", "title");
	}

	async getNewest(table, recent = 3) {
		try {
			const sql = `
			SELECT *
			FROM ${table}
			ORDER BY created DESC
			LIMIT ${recent}
			`;
			const res = await this.db.query(sql);
			return res.rows;
		} catch (error) {
			console.error(error);
		}
		return [];
	}

	async getCatalog(slug) {
		const catalog = await this.findOne("catalogs", "slug", slug);
		if (catalog) {
			return this.upgradeCatalog(catalog);
		}
		else {
			return null;
		}
	}

	async getCountPerRootCatalog(table) {
		try {
			const sql = `
			SELECT cat.id, cat.title, COUNT(DISTINCT res.id) AS num
			FROM catalogs AS cat
				LEFT JOIN ${table} AS res ON cat.id = res.catalog
			GROUP BY cat.id, cat.title
			ORDER BY num DESC
			`;
			const res = await this.db.query(sql);
			if (res.rows.length > 0) {
				return res.rows.map(v => {
					v.num = parseInt(v.num, 10);
					return v;
				});
			}
		} catch(error) {
			console.error(error);
		}
	}

	async getAll(table, column = '*', orderBy = null, asc = true) {
		try {
			if (column !== '*' && orderBy === null) {
				orderBy = column;
			}
			let sql = `SELECT DISTINCT ${column} FROM ${table}`;
			if (orderBy) {
				let order = asc ? 'ASC' : 'DESC';
				sql += ` ORDER BY ${orderBy} ${order}`
			}
			const res = await this.db.query(sql);
			if (res.rows.length > 0) {
				if (column !== '*') {
					return res.rows.map(arr => arr[column]);
				}
				else {
					return res.rows;
				}
			}
		} catch(error) {
			console.error(error);
		}
		return [];
	}

	async getErrorCount() {
		return await this.getCount('queue', 'checks > 0');
	}

	async getPendingCount() {
		const sqlCondition = `
			accessed IS NULL   -- New entries
			OR (accessed < (NOW() - INTERVAL '1 WEEK') AND checks BETWEEN 1 AND 4)   -- On failue, try again after a week, stop after 4 weeks
			OR (crawled < (NOW() - INTERVAL '1 YEAR') OR accessed < (NOW() - INTERVAL '1 YEAR'))   -- Recrawl every year
		`;
		return await this.getCount('queue', sqlCondition);
	}

	async getCount(table, condition = null) {
		let where = '';
		if (condition) {
			where = `WHERE ${condition}`;
		}
		const sql = `SELECT COUNT(*) AS num FROM ${table} ${where}`;
		let res = await this.queryOne(sql);
		if (res !== null) {
			return parseInt(res.num, 10);
		}
		else {
			return 0;
		}
	}

	async findOne(table, column, value, excludeColumns = ["email"]) {
		const sql = `
			SELECT *
			FROM ${table}
			WHERE ${column} = $1
			LIMIT 1
		`;
		return await this.queryOne(sql, [value], excludeColumns);
	}

	async queryOne(sql, values = [], excludeColumns = ["email"]) {
		try {
			const res = await this.db.query(sql, values);
			if (res.rows.length > 0) {
				return Utils.omit(res.rows[0], excludeColumns);
			}
		} catch(error) {
			console.error(error);
		}
		return null;
	}

	async insertFromObject(data, table, timestamps = true) {
		try {
			if (timestamps) {
				data.created = new Date();
				data.updated = new Date();
			}
			const values = Object.values(data);
			const columns = Object.keys(data).join(', ');
			const placeholders = Utils.range(1, values.length+1).map(i => '$' + i).join(', ');
			const sql = `
				INSERT INTO ${table} (${columns})
				VALUES (${placeholders})
				RETURNING *
			`;
			const res = await this.db.query(sql, values);
			return res.rows[0];
		} catch(error) {
			console.error(error);
			return null;
		}
	}
	
	async addEcosystem(url, title, summary, categories = [], language = null, email = null) {
		url = await this.checkUrl(url);
		title = this.checkTitle(title);
		summary = this.checkSummary(summary);
		categories = this.checkCategories(categories);
		language = this.checkLanguage(language);
		email = this.checkEmail(email);
		await this.checkDuplicates("ecosystem", url, title);

		var data = {url, title, summary, categories, language, email};
		const ecosystem = await this.insertFromObject(data, "ecosystem");
		if (ecosystem) {
			return this.upgradeEcosystem(ecosystem);
		}
		else {
			throw new Error("Adding to the ecosystem database failed. Please contact us for details.");
		}
	}
	
	async addTutorial(url, title, summary, language, tags = [], email = null) {
		url = await this.checkUrl(url);
		title = this.checkTitle(title, 200);
		summary = this.checkSummary(summary);
		tags = this.checkTags(tags);
		language = this.checkSpokenLanguage(language);
		email = this.checkEmail(email);
		await this.checkDuplicates("tutorials", url, title);

		var data = {url, title, summary, tags, language, email};
		const tutorial = await this.insertFromObject(data, "tutorials");
		if (tutorial) {
			return this.upgradeTutorial(tutorial);
		}
		else {
			throw new Error("Adding to the tutorial database failed. Please contact us for details.");
		}
	}

	async addCatalog(isApi, url, slug, title, summary, access = 'public', accessInfo = null, email = null) {
		if (typeof isApi !== 'boolean') {
			isApi = false;
		}

		access = this.checkAccess(access);
		accessInfo = this.checkAccessInfo(access, accessInfo);
		url = await this.checkUrl(url, access !== 'private');
		slug = this.checkSlug(slug);
		title = this.checkTitle(title);
		summary = this.checkSummary(summary);
		email = this.checkEmail(email);
		await this.checkDuplicates("catalogs", url, title);
		if (await this.getCatalog(slug)) {
			throw new Error("Another catalog with the given slug exists. Please choose a different slug.");
		}

		var data = {slug, url, title, summary, access, access_info: accessInfo, email, is_api: isApi};
		const catalog = await this.insertFromObject(data, "catalogs");
		if (catalog) {
			return this.upgradeCatalog(catalog);
		}
		else {
			throw new Error("Adding to the catalog database failed. Please contact us for details.");
		}
	}

	async checkDuplicates(table, url, title = null) {
		const res = await this.db.query(`SELECT * FROM ${table}`);
		
		const cleanString = (str) => str.replace(/[\s-_]/g, '');
	
		let similar = res.rows.find(col => {
			let cleanedColUrl = cleanString(col.url.toLowerCase());
			let cleanedUrl = cleanString(url.toLowerCase());
			
			if(cleanedColUrl === cleanedUrl) { 
				return true;
			}
	
			if (typeof title === 'string') {
				let cleanedColTitle = cleanString(col.title.toLowerCase());
				let cleanedTitle = cleanString(title.toLowerCase());
				
				if(cleanedColTitle === cleanedTitle) { 
					return true;
				}
			}
			return false;
		});
	
		if (typeof similar !== 'undefined') {
			throw new Error("The given resource has already been submitted or the title or URL is very similar to another one.");
		}
	}
	

	async checkUrl(url, checkCatalog = false) {
		try {
			require('url').parse(url);
		} catch (e) {
			throw new Error('URL is invalid');
		}

		if (!checkCatalog) {
			return url;
		}

		try {
			let catalog = await axios(url);
			if (Utils.isPlainObject(catalog.data) && typeof catalog.data.id === 'string' && typeof catalog.data.description === 'string' && Array.isArray(catalog.data.links)) {
				return url;
			}
			else {
				throw new Error("A catalog can't be found at the URL given.");
			}
		} catch (e) {
			throw new Error("The URL given returned an error. Is this a private Catalog or API?");
		}
	}

	checkSlug(slug) {
		let length = typeof slug === 'string' ? slug.length : 0;
		if (slug.length < 3) {
			throw new Error(`Slug must be at least 3 characters, is ${length} characters`);
		}
		else if (slug.length > 50) {
			throw new Error(`Slug must be no longer than 50 characters, is ${length} characters`);
		}
		else if (!slug.match(/^[a-z0-9-]+$/)) {
			throw new Error('Slug must only contain the following characters: a-z, 0-9, -');
		}
		return slug;
	}

	checkTitle(title, maxLength = 50) {
		let length = typeof title === 'string' ? title.length : 0;
		if (title.length < 3) {
			throw new Error(`Title must be at least 3 characters, is ${length} characters`);
		}
		else if (title.length > maxLength) {
			throw new Error(`Title must be no longer than ${maxLength} characters, is ${length} characters`);
		}
		return title;
	}

	checkAccess(access) {
		if (!validAccess.includes(access)) {
			throw new Error('Access must by one of `public`, `protected` or `private`');
		}
		return access;
	}

	checkAccessInfo(access, accessInfo) {
		if (access === 'public') {
			return null;
		}

		let length = typeof accessInfo === 'string' ? accessInfo.length : 0;
		if (length < 100) {
			throw new Error(`Access details must be at least 100 characters, is ${length} characters`);
		}
		else if (accessInfo.length > 1000) {
			throw new Error(`Access details must be no longer than 1000 characters, is ${length} characters`);
		}
		return accessInfo;
	}

	checkSummary(summary) {
		let length = typeof summary === 'string' ? summary.length : 0;
		if (length < 50) {
			throw new Error(`Summary must be at least 50 characters, is ${length} characters`);
		}
		else if (length > 300) {
			throw new Error(`Summary must be no longer than 300 characters, is ${length} characters`);
		}
		return summary;
	}

	checkLanguage(lang) {
		if (typeof lang !== 'string' || lang.length === 0) {
			return null;
		}
		if (!this.languages.includes(lang)) {
			throw new Error(`Programming Language "${lang}" is invalid`);
		}
		return lang;
	}

	checkSpokenLanguage(lang) {
		if (!this.spokenLanguages.find(l => l.code === lang)) {
			throw new Error(`Language "${lang}" is invalid`);
		}
		return lang;
	}

	checkTags(tags) {
		if (!Array.isArray(tags) || tags.length === 0) {
			throw new Error(`At least one tag is required`);
		}
		for(let i in tags) {
			let tag = tags[i];
			if (typeof tag !== 'string') {
				throw new Error(`One of the tags is not a string`);
			}
			if (tag.length < 2) {
				throw new Error(`Tag "${tag}" must be at least 2 characters, is ${tag.length} characters`);
			}
			if (tag.length > 50) {
				throw new Error(`Tag "${tag}" must be no longer than 50 characters, is ${tag.length} characters`);
			}
			tags[i] = tag.toLowerCase();
		}
		return tags;
	}

	checkCategories(categories) {
		if (!Array.isArray(categories) || categories.length === 0) {
			throw new Error(`At least one category is required`);
		}
		let invalidCategory = categories.find(cat => !CATEGORIES.includes(cat));
		if (invalidCategory) {
			throw new Error(`Category "${invalidCategory}" is invalid`);
		}
		return categories;
	}

	checkEmail(email) {
		if (typeof email !== 'string' || email.length === 0) {
			return null;
		}
		if (!email.match(emailRegExp)) {
			throw new Error('Email is invalid');
		}
		return email;
	}

	upgradeEcosystem(tool) {
		// Remove email
		delete tool.email;
		return tool;
	}
	
	upgradeEcosystems(tools) {
		return tools.map(this.upgradeEcosystem);
	}

	upgradeTutorial(doc) {
		// Remove email
		delete doc.email;
		return doc;
	}
	
	upgradeTutorials(docs) {
		return docs.map(this.upgradeTutorial);
	}
	
	upgradeCatalog(catalog) {
		// Keep legacy "isPrivate" flag for external APIs
		catalog.isPrivate = Boolean(catalog.access !== "public");
		// is_api => isApi
		catalog.isApi = catalog.is_api;
		delete catalog.is_api;
		// access_info => accessInfo
		catalog.accessInfo = catalog.access_info;
		delete catalog.access_info;
		// Remove email
		delete catalog.email;
		return catalog;
	}
	
	upgradeCatalogs(catalogs) {
		return catalogs.map(this.upgradeCatalog);
	}

}