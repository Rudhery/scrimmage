import type { GuildSettings } from '../domain/guild-settings.js';
import type { GuildSettingsRepository } from '../storage/repositories.js';

function defaults(guildId: string): GuildSettings {
  return { guildId, announceChannelId: null };
}

/** Reads and updates per-guild settings, returning sensible defaults when unset. */
export class GuildSettingsService {
  constructor(private readonly settings: GuildSettingsRepository) {}

  /** Current settings for a guild (defaults if it has never been configured). */
  async get(guildId: string): Promise<GuildSettings> {
    return (await this.settings.get(guildId)) ?? defaults(guildId);
  }

  /** Set or clear (with `null`) the announcement channel. */
  async setAnnounceChannel(guildId: string, channelId: string | null): Promise<GuildSettings> {
    const current = await this.get(guildId);
    return this.settings.upsert({ ...current, announceChannelId: channelId });
  }
}
