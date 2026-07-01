import {
  GuildSettingsService,
  PlayerStatsService,
  PollService,
  RsvpService,
  ScrimmageService,
  StandingsService,
  StatCategoryService,
  TeamService,
  TypedEventBus,
  type EventBus,
  type Storage,
} from '@scrimmage/core';
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
  readonly events: EventBus;
  readonly storage: Storage;
  readonly teams: TeamService;
  readonly scrimmages: ScrimmageService;
  readonly standings: StandingsService;
  readonly guildSettings: GuildSettingsService;
  readonly statCategories: StatCategoryService;
  readonly playerStats: PlayerStatsService;
  readonly rsvps: RsvpService;
  readonly polls: PollService;
}

/** Wire up storage, the domain event bus and services from configuration. */
export function createContext(config: Config, logger: Logger, client: Client): AppContext {
  const storage = createSqliteStorage({ path: config.databasePath, migrate: true });
  const events = new TypedEventBus({
    onError: (error, event) => logger.error({ err: error, event }, 'event listener failed'),
  });
  const statCategories = new StatCategoryService(storage.statCategories);
  const guildSettings = new GuildSettingsService(storage.guildSettings);
  return {
    config,
    logger,
    client,
    events,
    storage,
    teams: new TeamService(storage.teams, { events }),
    scrimmages: new ScrimmageService(storage.scrimmages, storage.teams, { events }),
    standings: new StandingsService(storage.scrimmages, guildSettings),
    guildSettings,
    statCategories,
    playerStats: new PlayerStatsService(storage.playerStats, statCategories),
    rsvps: new RsvpService(storage.rsvps),
    polls: new PollService(storage.polls),
  };
}
