import './env.js';
import { migrateSqlite } from '@scrimmage/storage-sqlite';

/**
 * Standalone migration runner. Applies all pending migrations to the configured
 * database. Only needs `DATABASE_PATH` — no Discord credentials required, so it
 * can run in CI or a deploy step before the bot starts.
 */
const databasePath = process.env.DATABASE_PATH ?? './scrimmage.sqlite';

console.log(`Applying migrations to ${databasePath} …`);
migrateSqlite(databasePath);
console.log('Migrations applied.');
