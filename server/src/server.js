const express = require('express');
const cors = require('cors');
const fse = require('fs-extra');
const Utils = require('lodash');
const Data = require('./data');
const Config = require('./config');
const axios = require('axios');

const LINK_REL = [
	'child',
	'collection',
	'data',
	'item',
	'items',
	'parent',
	'root',
	'self'
];

class Server extends Config {

	constructor() {
		super();

		console.info('Initializing STAC Index Server...');

		this.http_server = null;
		this.https_server = null;

		this.afterServerStartListener = [];
		this.data = new Data(this.db);

		this.startServer();
	}

	addAfterServerStartListener(callback) {
		this.afterServerStartListener.push(callback);
	}

	async afterServerStart() {
		console.info('Server is expected to be exposed at %s', this.serverUrl);
		for(var listener of this.afterServerStartListener) {
			await listener(this);
		}
	}

	isHttpsEnabled() {
		return Boolean(this.ssl && this.ssl.port > 0 && typeof this.ssl.key === 'string' && typeof this.ssl.certificate === 'string');
	}

	async initHttpServer() {
		this.http_server = express();
		this.initServer(this.http_server);
		return new Promise((resolve) => {
			this.http_server.listen(this.port, () => {
				this.serverUrl = "http://" + this.hostname + (this.exposedPort !== 80 ? ":" + this.exposedPort : "") + this.exposedPath;
				console.info('HTTP-Server listening at %s', "http://localhost" + (this.port !== 80 ? ":" + this.port : ""));
				resolve();
			});
		});
	}

	async initHttpsServer() {
		if (this.isHttpsEnabled()) {
			var https_options = {
				key: fse.readFileSync(this.ssl.key),
				cert: fse.readFileSync(this.ssl.certificate)
			};
			const https = require('https');
			const httpsApp = express();
			this.initServer(httpsApp);
			this.https_server = https.createServer(https_options, httpsApp);
			return new Promise((resolve) => {
				if (this.isHttpsEnabled()) {
					this.https_server.listen(this.ssl.port, () => {
						this.serverUrl = "https://" + this.hostname + ":" + (this.ssl.exposedPort !== 443 ? ":" + this.ssl.exposedPort : "") + this.exposedPath;
						console.info('HTTPS-Server listening at %s', "https://localhost" + ":" + this.ssl.port);
						resolve();
					});
				}
				else {
					console.warn('HTTPS not enabled, see config.js to enable it.');
					resolve();
				}
			});
		}
		else {
			return Promise.resolve();
		}
	}

	errorHandler(req, res, err, next) {
		if (this.debug) {
			if (err.originalError) {
				console.error(err.originalError);
			}
			else {
				console.error(err);
			}
		}
		if (!res.headersSent) {
			res.status(500).json({ error: 'Internal Server Error' });
		}
		return next(err);
	}

	async startServer() {
		try {
			await this.initHttpServer();
			await this.initHttpsServer();
			await this.afterServerStart();
		} catch (e) {
			console.error('Server not started due to the following error: ');
			console.error(e);
			process.exit(1);
		}

	}

	initServer(server) {
		// Enable CORS
		server.use(cors({
			exposedHeaders: [this.corsExposeHeaders]
		}));
		
		// Parse JSON bodies
		server.use(express.json());
		server.use(express.urlencoded({ extended: true }));

		// Error handling middleware
		server.use((err, req, res, next) => {
			this.errorHandler(req, res, err, next);
		});

		server.get('/', this.root.bind(this));
		server.post('/add', this.add.bind(this));
		server.get('/ecosystem', this.ecosystem.bind(this));
		server.get('/languages', this.languages.bind(this));
		server.get('/spoken_languages', this.spokenLanguages.bind(this));
		server.get('/tags', this.tutorialTags.bind(this));
		server.get('/tutorials', this.tutorials.bind(this));
		server.get('/catalogs', this.catalogs.bind(this));
		server.get('/catalogs/:slug', this.catalogById.bind(this));
		server.get('/newest', this.newest.bind(this));
		server.get('/proxy', this.proxy.bind(this));
		server.get('/sitemap.xml', this.sitemap.bind(this));
	}

	root(req, res, next) {
		res.json({
			stac_version: "1.1.0",
			id: "stac-index",
			description: "Root catalog of STAC Index.",
			links: []
		});
	}

	async add(req, res) {
		if (!Utils.isPlainObject(req.body)) {
			res.status(400).json({ error: "No data given" });
			return;
		}
		switch(req.body.type) {
			case 'api':
			case 'catalog':
				try {
					let catalog = await this.data.addCatalog(req.body.type === 'api', req.body.url, req.body.slug, req.body.title, req.body.summary, req.body.access, req.body.accessInfo, req.body.email);
					res.json(catalog);
					return;
				} catch (e) {
					res.status(400).json({ error: e.message });
					return;
				}
			case 'ecosystem':
				try {
					let eco = await this.data.addEcosystem(req.body.url, req.body.title, req.body.summary, req.body.categories, req.body.language, req.body.email);
					res.json(eco);
					return;
				} catch (e) {
					res.status(400).json({ error: e.message });
					return;
				}
			case 'tutorial':
				try {
					let tut = await this.data.addTutorial(req.body.url, req.body.title, req.body.summary, req.body.language, req.body.tags, req.body.email);
					res.json(tut);
					return;
				} catch (e) {
					res.status(400).json({ error: e.message });
					return;
				}
		}
		res.status(400).json({ error: "Invalid type specified." });
		return;
	}

	async newest(req, res) {
		let ecosystem = await this.data.getNewestEcosystem();
		let data = await this.data.getNewestData();
		let tutorials = await this.data.getNewestTutorials();
		res.json({
			ecosystem,
			data,
			tutorials
		});
	}

	async ecosystem(req, res) {
		res.json(await this.data.getEcosystem());
	}

	async tutorials(req, res) {
		res.json(await this.data.getTutorials());
	}

	async catalogs(req, res) {
		res.json(await this.data.getCatalogs());
	}

	async spokenLanguages(req, res) {
		res.json(this.data.getSpokenLanguages());
	}

	async tutorialTags(req, res) {
		res.json(await this.data.getTutorialTags());
	}

	async catalogById(req, res) {
		const slug = req.params['slug'];
		const catalog = await this.data.getCatalog(slug);
		if (catalog) {
			res.json(catalog);
		}
		else {
			res.status(404).json({ error: `Catalog with slug '${slug}' doesn't exist` });
		}
	}

	languages(req, res, next) {
		res.json(this.data.getLanguages());
	}

	async sitemap(req, res) {
		let baseUrl = 'https://' + this.hostname;
		let urls = [
			['/', 1.0, 'hourly'],
			['/contact', 0, 'monthly'],
			['/privacy', 0, 'monthly'],
			['/add', 0, 'monthly'],
			['/catalogs', 0.5, 'daily'],
			['/ecosystem', 0.5, 'daily'],
			['/tutorials', 0.5, 'daily']
		];

		let catalogs = await this.data.getCatalogs();
		catalogs.forEach(c => urls.push([`/catalogs/${c.slug}`, 0.8, 'weekly']));

		let xml = urls
			.map(r => `\t<url><loc>${baseUrl}${r[0]}</loc><priority>${r[1]}</priority><changefreq>${r[2]}</changefreq></url>`)
			.join("\n");
		res.set('content-type', 'application/xml');
		res.send(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n${xml}\n</urlset>`);
	}

	async proxy(req, res) {
		let q = Object.keys(req.query);
		if (q.length !== 1) {
			res.status(400).json({ error: "Query string invalid" });
			return;
		}

		let url = q[0];
		try {
			url = await this.data.checkUrl(url);

			let response = await axios.get(url, {
				// `headers` are custom headers to be sent
				headers: {'Accept': 'application/json'},
				// `timeout` specifies the number of milliseconds before the request times out.
				timeout: 1000,
				// `maxContentLength` defines the max size of the http response content in bytes allowed in node.js
				maxContentLength: 100000
			});

			if (!Utils.isPlainObject(response.data) || (typeof response.data.stac_version !== 'stac_version' && !Array.isArray(response.data.links))) {
				throw new Error("Proxy only supports valid STAC");
			}
	
			res.json(this.proxyLinks(response.data, url));
		} catch (error) {
			console.error(error);
			res.status(400).json({ error: error.message });
		}
	}

	proxyLinks(obj, baseUrl) {
		if (obj && typeof obj === 'object') {
			for(let key in obj) {
				let val = obj[key];
				if (key === 'links' && Array.isArray(val)) {
					obj[key] = val.map(link => {
						if (typeof link.href === 'string' && LINK_REL.includes(link.rel)) {
							if (link.href.match(/^https?:\/\//i)) {
								link.href = this.serverUrl + '/proxy?' + encodeURIComponent(link.href);
							}
							else {
								// ToDo: We can't handle relative URLs yet
							}
						}
						return link;
					});
				}
				else {
					obj[key] = this.proxyLinks(val, baseUrl);
				}
			}
		}
		return obj;
	}

};

global.server = new Server();