import { time, TimestampStyles } from 'discord.js';
import type { Scrimmage, Team } from '@scrimmage/core';
import type { AppContext } from '../context.js';
import { dmUser, dmUsers } from '../lib/notify.js';
import { ROLE_LABEL, scrimmageEmbed } from '../lib/format.js';

/**
 * Subscribe the bot's DM notifications to the core's domain events. This is the
 * single place that turns domain changes into Discord side effects — the
 * services themselves stay completely Discord-agnostic.
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

  const announceScrim = async (scrimmage: Scrimmage, headline: string): Promise<void> => {
    const [home, away] = await resolveScrimTeams(scrimmage);
    await dmUsers(
      client,
      captainsOf(home, away),
      { content: headline, embeds: [scrimmageEmbed(scrimmage, home, away)] },
      logger,
    );
  };

  events.on('scrimmage.proposed', ({ scrimmage }) =>
    announceScrim(scrimmage, '📣 A new scrimmage was proposed:'),
  );
  events.on('scrimmage.confirmed', ({ scrimmage }) =>
    announceScrim(scrimmage, '📣 A scrimmage was confirmed:'),
  );
  events.on('scrimmage.cancelled', ({ scrimmage }) =>
    announceScrim(scrimmage, '📣 A scrimmage was cancelled:'),
  );
  events.on('scrimmage.played', ({ scrimmage }) =>
    announceScrim(scrimmage, '📣 A scrimmage result was recorded:'),
  );

  events.on('scrimmage.reminderDue', async ({ scrimmage }) => {
    const [home, away] = await resolveScrimTeams(scrimmage);
    const captains = captainsOf(home, away);
    const embed = scrimmageEmbed(scrimmage, home, away);
    const kickoff = time(scrimmage.scheduledAt, TimestampStyles.RelativeTime);

    // Announce in the configured channel, falling back to the one it was proposed in.
    const settings = await guildSettings.get(scrimmage.guildId);
    const targetChannelId = settings.announceChannelId ?? scrimmage.channelId;
    if (targetChannelId) {
      try {
        const channel = await client.channels.fetch(targetChannelId);
        if (channel && channel.isTextBased() && !channel.isDMBased()) {
          const mentions = captains.map((id) => `<@${id}>`).join(' ');
          await channel.send({
            content: `${mentions} ⏰ Reminder: your scrimmage kicks off ${kickoff}!`.trim(),
            embeds: [embed],
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
      { content: `⏰ Your scrimmage kicks off ${kickoff}!`, embeds: [embed] },
      logger,
    );
  });

  events.on('team.memberAdded', async ({ team, member }) => {
    await dmUser(client, member.userId, `✅ You were added to **${team.name}**.`, logger);
  });
  events.on('team.memberRoleChanged', async ({ team, member }) => {
    await dmUser(
      client,
      member.userId,
      `🏷️ You are now **${ROLE_LABEL[member.role]}** on **${team.name}**.`,
      logger,
    );
  });
  events.on('team.captainTransferred', async ({ team }) => {
    await dmUser(client, team.captainId, `👑 You are now the captain of **${team.name}**.`, logger);
  });
}
