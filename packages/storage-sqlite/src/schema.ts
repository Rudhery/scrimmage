import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const teams = sqliteTable(
  'teams',
  {
    id: text('id').primaryKey(),
    guildId: text('guild_id').notNull(),
    name: text('name').notNull(),
    tag: text('tag').notNull(),
    captainId: text('captain_id').notNull(),
    description: text('description'),
    logoUrl: text('logo_url'),
    roleId: text('role_id'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('teams_guild_name_unique').on(table.guildId, table.name),
    index('teams_guild_idx').on(table.guildId),
  ],
);

export const teamMembers = sqliteTable(
  'team_members',
  {
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    role: text('role').notNull().default('player'),
    joinedAt: integer('joined_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.teamId, table.userId] })],
);

export const scrimmages = sqliteTable(
  'scrimmages',
  {
    id: text('id').primaryKey(),
    guildId: text('guild_id').notNull(),
    homeTeamId: text('home_team_id').notNull(),
    awayTeamId: text('away_team_id').notNull(),
    scheduledAt: integer('scheduled_at', { mode: 'timestamp_ms' }).notNull(),
    status: text('status').notNull(),
    homeScore: integer('home_score'),
    awayScore: integer('away_score'),
    proposedBy: text('proposed_by').notNull(),
    channelId: text('channel_id'),
    reminderSentAt: integer('reminder_sent_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('scrimmages_guild_idx').on(table.guildId),
    index('scrimmages_status_idx').on(table.status),
  ],
);

export const guildSettings = sqliteTable('guild_settings', {
  guildId: text('guild_id').primaryKey(),
  announceChannelId: text('announce_channel_id'),
  language: text('language'),
  pointsWin: integer('points_win').notNull().default(3),
  pointsDraw: integer('points_draw').notNull().default(1),
  pointsLoss: integer('points_loss').notNull().default(0),
  adminRoleId: text('admin_role_id'),
  reminderLeadMinutes: integer('reminder_lead_minutes'),
  brandColor: integer('brand_color'),
});

export const statCategories = sqliteTable(
  'stat_categories',
  {
    guildId: text('guild_id').notNull(),
    key: text('key').notNull(),
    label: text('label').notNull(),
    weight: real('weight').notNull(),
    position: integer('position').notNull(),
  },
  (table) => [primaryKey({ columns: [table.guildId, table.key] })],
);

export const playerStats = sqliteTable(
  'player_stats',
  {
    scrimmageId: text('scrimmage_id')
      .notNull()
      .references(() => scrimmages.id, { onDelete: 'cascade' }),
    guildId: text('guild_id').notNull(),
    teamId: text('team_id').notNull(),
    userId: text('user_id').notNull(),
    values: text('values').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.scrimmageId, table.userId] }),
    index('player_stats_guild_idx').on(table.guildId),
  ],
);
