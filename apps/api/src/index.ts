import { serve } from '@hono/node-server';
import { createSqliteStorage } from '@scrimmage/storage-sqlite';
import { loadConfig } from './config.js';
import { createApp } from './app.js';

const config = loadConfig();
const storage = createSqliteStorage({ path: config.databasePath, migrate: true });
const app = createApp(storage, { webOrigin: config.webOrigin });

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Scrimmage API listening on http://localhost:${info.port}`);
});

function shutdown(): void {
  server.close();
  storage.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
