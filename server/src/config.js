const { DEV, HTTP_HOST, HTTP_PATH, HTTP_INT_PORT, HTTP_PORT, DATABASE } = require('../../commons');

module.exports = class Config {
	constructor() {
		this.debug = DEV;
		this.hostname = HTTP_HOST;
		this.exposedPath = HTTP_PATH;
		this.port = HTTP_INT_PORT;
		this.exposedPort = HTTP_PORT;
		this.ssl = {
			port: 0,
			exposedPort: 0,
			key: null,
			certificate: null
		};
		this.serverOptions = {
			ignoreTrailingSlash: true
		};
		this.corsExposeHeaders = 'Location';
		this.db = DATABASE;
	}
}