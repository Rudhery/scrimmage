/** Per-guild configuration. Defaults apply when a guild has never been configured. */
export interface GuildSettings {
  readonly guildId: string;
  /** Channel where announcements (e.g. pre-game reminders) are posted, if set. */
  readonly announceChannelId: string | null;
  /** Preferred language (BCP-47-ish, e.g. `pt-BR`), or `null` to follow each user. */
  readonly language: string | null;
}
