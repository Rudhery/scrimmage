import { ScrimmageService, TeamService, type Storage } from '@scrimmage/core';
import { createSqliteStorage } from '@scrimmage/storage-sqlite';
import type { Client } from 'discord.js';
import type { Config } from './config.js';
import type { Logger } from './logger.js';

/**
 * The application container. Holds the shared, long-lived dependencies that
 * command handlers need. Built once at startup and passed to every command.
 */
export interface AppContext {
  readonly config: Config;
  readonly logger: Logger;
  readonly client: Client;
  readonly storage: Storage;
  readonly teams: TeamService;
  readonly scrimmages: ScrimmageService;
}

/** Wire up storage and services from configuration. */
export function createContext(config: Config, logger: Logger, client: Client): AppContext {
  const storage = createSqliteStorage({ path: config.databasePath, migrate: true });
  return {
    config,
    logger,
    client,
    storage,
    teams: new TeamService(storage.teams),
    scrimmages: new ScrimmageService(storage.scrimmages, storage.teams),
  };
}
