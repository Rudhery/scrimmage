import type { Team, TeamMember, TeamRole } from '../domain/team.js';
import type { Scrimmage, ScrimmageStatus } from '../domain/scrimmage.js';
import type { GuildSettings } from '../domain/guild-settings.js';
import type { PlayerStatLine, StatCategory } from '../domain/stats.js';
import type { Rsvp } from '../domain/rsvp.js';
import type { AvailabilityPoll, PollVote } from '../domain/poll.js';

/**
 * Persistence boundary for teams and their rosters.
 *
 * Implementations live in `@scrimmage/storage-*` packages. The core never depends
 * on a concrete database — only on this interface.
 */
export interface TeamRepository {
  create(team: Team): Promise<Team>;
  update(team: Team): Promise<Team>;
  findById(guildId: string, id: string): Promise<Team | null>;
  /** Case-insensitive lookup by name within a guild. */
  findByName(guildId: string, name: string): Promise<Team | null>;
  list(guildId: string): Promise<Team[]>;
  delete(guildId: string, id: string): Promise<void>;

  addMember(member: TeamMember): Promise<void>;
  removeMember(teamId: string, userId: string): Promise<void>;
  setMemberRole(teamId: string, userId: string, role: TeamRole): Promise<void>;
  findMember(teamId: string, userId: string): Promise<TeamMember | null>;
  listMembers(teamId: string): Promise<TeamMember[]>;
}

/** Optional filters when listing scrimmages. */
export interface ScrimmageFilter {
  status?: ScrimmageStatus;
  teamId?: string;
}

/** Persistence boundary for scrimmages (friendly matches). */
export interface ScrimmageRepository {
  create(scrimmage: Scrimmage): Promise<Scrimmage>;
  findById(guildId: string, id: string): Promise<Scrimmage | null>;
  list(guildId: string, filter?: ScrimmageFilter): Promise<Scrimmage[]>;
  update(scrimmage: Scrimmage): Promise<Scrimmage>;
  /**
   * Confirmed scrimmages (across all guilds) that still need a pre-game reminder:
   * `reminderSentAt` is null and `scheduledAt <= before`.
   */
  listDueReminders(before: Date): Promise<Scrimmage[]>;
}

/** Persistence boundary for per-guild settings. */
export interface GuildSettingsRepository {
  get(guildId: string): Promise<GuildSettings | null>;
  upsert(settings: GuildSettings): Promise<GuildSettings>;
}

/** Persistence boundary for per-guild stat category configuration. */
export interface StatCategoryRepository {
  list(guildId: string): Promise<StatCategory[]>;
  upsert(category: StatCategory): Promise<void>;
  remove(guildId: string, key: string): Promise<void>;
}

/** Persistence boundary for per-player, per-scrimmage stat lines. */
export interface PlayerStatsRepository {
  set(line: PlayerStatLine): Promise<void>;
  listByScrimmage(scrimmageId: string): Promise<PlayerStatLine[]>;
  listByGuild(guildId: string): Promise<PlayerStatLine[]>;
}

/** Persistence boundary for scrimmage RSVPs. */
export interface RsvpRepository {
  set(rsvp: Rsvp): Promise<void>;
  listByScrimmage(scrimmageId: string): Promise<Rsvp[]>;
}

/** Persistence boundary for availability polls and their votes. */
export interface PollRepository {
  create(poll: AvailabilityPoll): Promise<AvailabilityPoll>;
  findById(id: string): Promise<AvailabilityPoll | null>;
  addVote(vote: PollVote): Promise<void>;
  removeVote(vote: PollVote): Promise<void>;
  listVotes(pollId: string): Promise<PollVote[]>;
}

/**
 * A storage backend bundles the repositories the application needs and owns the
 * lifecycle of the underlying connection.
 */
export interface Storage {
  readonly teams: TeamRepository;
  readonly scrimmages: ScrimmageRepository;
  readonly guildSettings: GuildSettingsRepository;
  readonly statCategories: StatCategoryRepository;
  readonly playerStats: PlayerStatsRepository;
  readonly rsvps: RsvpRepository;
  readonly polls: PollRepository;
  /** Release any underlying resources (connections, file handles, …). */
  close(): Promise<void> | void;
}
