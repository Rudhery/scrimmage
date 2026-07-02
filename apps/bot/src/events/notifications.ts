import { time, TimestampStyles } from 'discord.js';
import type { Scrimmage, Team } from '@scrimmage/core';
import type { AppContext } from '../context.js';
import { dmUser, dmUsers } from '../lib/notify.js';
import { DEFAULT_ACCENT, scrimmageEmbed } from '../lib/format.js';
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  translator,
  type MessageKey,
  type Translator,
} from '../i18n/index.js';

/**
 * Subscribe the bot's DM notifications to the core's domain events. This is the
 * single place that turns domain changes into Discord side effects — the
 * services themselves stay completely Discord-agnostic.
 *
 * Notifications are shared, guild-wide artifacts, so they use the guild's
 * configured language.
 */
export function registerNotifications(context: AppContext): void {
  const { events, client, logger, storage, guildSettings } = context;

  const captainsOf = (home: Team | null, away: Team | null): string[] =>
    [home?.captainId, away?.captainId].filter((id): id is string => id !== undefined);

  const resolveScrimTeams = (scrimmage: Scrimmage): Promise<[Team | null, Team | null]> =>
    Promise.all([
      storage.teams.findById(scrimmage.guildId, scrimmage.homeTeamId),
      storage.teams.findById(scrimmage.guildId, scrimmage.awayTeamId),
    ]);

  const localizeGuild = async (guildId: string): Promise<{ t: Translator; accent: number }> => {
    const settings = await guildSettings.get(guildId);
    return {
      t: translator(normalizeLocale(settings.language) ?? DEFAULT_LOCALE),
      accent: settings.brandColor ?? DEFAULT_ACCENT,
    };
  };

  const announceScrim = async (scrimmage: Scrimmage, headline: MessageKey): Promise<void> => {
    const [home, away] = await resolveScrimTeams(scrimmage);
    const { t, accent } = await localizeGuild(scrimmage.guildId);
    await dmUsers(
      client,
      captainsOf(home, away),
      { content: t(headline), embeds: [scrimmageEmbed(scrimmage, home, away, t, accent)] },
      logger,
    );
  };

  events.on('scrimmage.proposed', ({ scrimmage }) =>
    announceScrim(scrimmage, 'notify.scrim.proposed'),
  );
  events.on('scrimmage.confirmed', ({ scrimmage }) =>
    announceScrim(scrimmage, 'notify.scrim.confirmed'),
  );
  events.on('scrimmage.cancelled', ({ scrimmage }) =>
    announceScrim(scrimmage, 'notify.scrim.cancelled'),
  );
  events.on('scrimmage.played', ({ scrimmage }) => announceScrim(scrimmage, 'notify.scrim.played'));

  events.on('scrimmage.reminderDue', async ({ scrimmage }) => {
    const [home, away] = await resolveScrimTeams(scrimmage);
    const captains = captainsOf(home, away);
    const settings = await guildSettings.get(scrimmage.guildId);
    const t = translator(normalizeLocale(settings.language) ?? DEFAULT_LOCALE);
    const embed = scrimmageEmbed(scrimmage, home, away, t, settings.brandColor ?? DEFAULT_ACCENT);
    const kickoff = time(scrimmage.scheduledAt, TimestampStyles.RelativeTime);

    // Announce in the configured channel, falling back to the one it was proposed in.
    const targetChannelId = settings.announceChannelId ?? scrimmage.channelId;
    if (targetChannelId) {
      try {
        const channel = await client.channels.fetch(targetChannelId);
        if (channel && channel.isTextBased() && !channel.isDMBased()) {
          const roleIds = [home?.roleId, away?.roleId].filter((id): id is string => id != null);
          const mentions = [
            ...captains.map((id) => `<@${id}>`),
            ...roleIds.map((id) => `<@&${id}>`),
          ].join(' ');
          await channel.send({
            content: `${mentions} ${t('notify.reminder.channel', { kickoff })}`.trim(),
            embeds: [embed],
            allowedMentions: { users: captains, roles: roleIds },
          });
        }
      } catch (error) {
        logger.debug({ err: error, channelId: targetChannelId }, 'could not post reminder');
      }
    }

    // Always DM the captains too.
    await dmUsers(
      client,
      captains,
      { content: t('notify.reminder.dm', { kickoff }), embeds: [embed] },
      logger,
    );
  });

  events.on('team.memberAdded', async ({ team, member }) => {
    const { t } = await localizeGuild(team.guildId);
    await dmUser(client, member.userId, t('notify.memberAdded', { name: team.name }), logger);
  });
  events.on('team.memberRoleChanged', async ({ team, member }) => {
    const { t } = await localizeGuild(team.guildId);
    await dmUser(
      client,
      member.userId,
      t('notify.memberRole', { role: t(`role.${member.role}` as MessageKey), name: team.name }),
      logger,
    );
  });
  events.on('team.captainTransferred', async ({ team }) => {
    const { t } = await localizeGuild(team.guildId);
    await dmUser(client, team.captainId, t('notify.captain', { name: team.name }), logger);
  });
}
