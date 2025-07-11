const CATEGORIES = [
	'API',
	'CLI',
	'Client',
	'Data Creation',
	'Data Processing',
	'Other',
	'Server',
	'Static',
	'Validation',
	'Visualization'
];

const LINK_REGEXP = /^(.*)\[([^\]]+)\]\((https?:\/\/[^\)<>"']+)\)(.*)$/is;

const DEV = false;
const HTTP_HOST = DEV ? 'localhost' : 'stacindex.org';
const HTTP_INT_PORT = DEV ? 80 : 9999;
const HTTP_PORT = DEV ? 80 : 80;
const HTTP_PATH = DEV ? '' : '/api';
const HTTPS = !DEV;

const DATABASE = {
	user: 'postgres',
	host: 'localhost',
	database: 'stacindex',
	password: '',
	port: 5432
};

module.exports = {
	LINK_REGEXP,
	CATEGORIES,
	DEV,
	HTTP_HOST,
	HTTP_PORT,
	HTTP_INT_PORT,
	HTTP_PATH,
	HTTPS,
	DATABASE
};