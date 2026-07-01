/** Per-guild configuration. Defaults apply when a guild has never been configured. */
export interface GuildSettings {
  readonly guildId: string;
  /** Channel where announcements (e.g. pre-game reminders) are posted, if set. */
  readonly announceChannelId: string | null;
}
