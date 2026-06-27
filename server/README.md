# STAC Index Server

## Project setup
```
npm install
```

### Deploy PostgreSQL 13+ database

See [database/create.sql](../database/create.sql) for the SQL schema.

### Configure

Adapt [commons.js](../commons.js) and [config.js](src/config.js) to suite your environment.

### Start server for development

```
npm run dev
```

### Start and stop server for production
```
npm run up
npm run down
```

### Check and fix database consistency/outdated entries

Runs a CLI helper that checks `catalogs`, `ecosystem` and `tutorials` for URL reachability, performs additional STAC checks for `catalogs`, and lets you select fixes interactively.

```bash
npm run db:check
```
