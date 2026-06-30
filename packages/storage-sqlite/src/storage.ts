import type { Storage } from '@scrimmage/core';
import { createConnection } from './client.js';
import { applyMigrations } from './migrator.js';
import { DrizzleScrimmageRepository } from './repositories/scrimmage-repository.js';
import { DrizzleTeamRepository } from './repositories/team-repository.js';

export interface SqliteStorageOptions {
  /** Path to the SQLite file. Use `':memory:'` for an ephemeral database. */
  path: string;
  /** Apply pending migrations when connecting. Defaults to `false`. */
  migrate?: boolean;
}

/**
 * Create a {@link Storage} backed by SQLite. This is the entry point most callers
 * use — it wires up the Drizzle repositories and owns the connection lifecycle.
 */
export function createSqliteStorage(options: SqliteStorageOptions): Storage {
  const { db, sqlite } = createConnection(options.path);
  if (options.migrate) {
    applyMigrations(db);
  }

  return {
    teams: new DrizzleTeamRepository(db),
    scrimmages: new DrizzleScrimmageRepository(db),
    close() {
      sqlite.close();
    },
  };
}
