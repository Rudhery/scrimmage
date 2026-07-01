import { eq } from 'drizzle-orm';
import type { GuildSettings, GuildSettingsRepository } from '@scrimmage/core';
import type { Db } from '../client.js';
import { guildSettings } from '../schema.js';

export class DrizzleGuildSettingsRepository implements GuildSettingsRepository {
  constructor(private readonly db: Db) {}

  async get(guildId: string): Promise<GuildSettings | null> {
    const row = this.db
      .select()
      .from(guildSettings)
      .where(eq(guildSettings.guildId, guildId))
      .get();
    return row
      ? { guildId: row.guildId, announceChannelId: row.announceChannelId, language: row.language }
      : null;
  }

  async upsert(settings: GuildSettings): Promise<GuildSettings> {
    this.db
      .insert(guildSettings)
      .values({
        guildId: settings.guildId,
        announceChannelId: settings.announceChannelId,
        language: settings.language,
      })
      .onConflictDoUpdate({
        target: guildSettings.guildId,
        set: { announceChannelId: settings.announceChannelId, language: settings.language },
      })
      .run();
    return settings;
  }
}
