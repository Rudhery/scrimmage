import { EmbedBuilder, time, TimestampStyles } from 'discord.js';
import {
  RsvpStatus,
  ScrimmageStatus,
  type AvailabilityPoll,
  type PlayerAggregate,
  type PlayerStatLine,
  type PollVote,
  type Rsvp,
  type Scrimmage,
  type StatCategory,
  type Team,
  type TeamMember,
  type TeamStanding,
} from '@scrimmage/core';
import type { MessageKey, Translator } from '../i18n/index.js';

/** Default embed accent when a guild has not set a custom brand color. */
export const DEFAULT_ACCENT = 0x5865f2;

const STATUS_KEY: Record<ScrimmageStatus, MessageKey> = {
  [ScrimmageStatus.Proposed]: 'status.proposed',
  [ScrimmageStatus.Confirmed]: 'status.confirmed',
  [ScrimmageStatus.Cancelled]: 'status.cancelled',
  [ScrimmageStatus.Played]: 'status.played',
};

function label(team: Team | null): { name: string; tag: string } {
  return team ? { name: team.name, tag: team.tag } : { name: 'Unknown team', tag: '???' };
}

function pageFooter(embed: EmbedBuilder, page: number, pageCount: number, t: Translator): void {
  if (pageCount > 1) {
    embed.setFooter({ text: t('embed.page', { page: page + 1, count: pageCount }) });
  }
}

export function teamEmbed(
  team: Team,
  roster: TeamMember[],
  t: Translator,
  accent: number,
): EmbedBuilder {
  // The captain is shown on its own line, so keep them out of the role groups.
  const inRole = (role: TeamMember['role']): TeamMember[] =>
    roster.filter((member) => member.role === role && member.userId !== team.captainId);
  const mentions = (members: TeamMember[]): string =>
    members.length ? members.map((member) => `<@${member.userId}>`).join(', ') : '—';

  const embed = new EmbedBuilder()
    .setTitle(`${team.name} \`[${team.tag}]\``)
    .setColor(accent)
    .addFields(
      { name: t('embed.team.captain'), value: `<@${team.captainId}>`, inline: true },
      { name: t('embed.team.members'), value: String(roster.length), inline: true },
      {
        name: t('embed.team.created'),
        value: time(team.createdAt, TimestampStyles.LongDate),
        inline: true,
      },
    )
    .setFooter({ text: `Team ID: ${team.id}` });

  if (team.logoUrl) {
    embed.setThumbnail(team.logoUrl);
  }
  if (team.description) {
    embed.setDescription(team.description);
  }
  if (team.roleId) {
    embed.addFields({ name: t('embed.team.role'), value: `<@&${team.roleId}>`, inline: true });
  }

  const coaches = inRole('coach');
  const assistants = inRole('assistant');
  if (coaches.length) {
    embed.addFields({ name: t('embed.team.coaches'), value: mentions(coaches) });
  }
  if (assistants.length) {
    embed.addFields({ name: t('embed.team.assistants'), value: mentions(assistants) });
  }
  embed.addFields({ name: t('embed.team.players'), value: mentions(inRole('player')) });

  return embed;
}

export function teamListEmbed(
  teams: Team[],
  page: number,
  pageCount: number,
  t: Translator,
  accent: number,
): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle(t('embed.teams.title')).setColor(accent);
  embed.setDescription(
    teams.length
      ? teams.map((team) => `**${team.name}** \`[${team.tag}]\``).join('\n')
      : t('embed.teams.empty'),
  );
  pageFooter(embed, page, pageCount, t);
  return embed;
}

export function scrimmageEmbed(
  scrim: Scrimmage,
  home: Team | null,
  away: Team | null,
  t: Translator,
  accent: number,
): EmbedBuilder {
  const h = label(home);
  const a = label(away);

  const embed = new EmbedBuilder()
    .setTitle(`${h.name} vs ${a.name}`)
    .setColor(accent)
    .addFields(
      { name: t('embed.scrim.status'), value: t(STATUS_KEY[scrim.status]), inline: true },
      {
        name: t('embed.scrim.kickoff'),
        value: time(scrim.scheduledAt, TimestampStyles.LongDateTime),
        inline: true,
      },
    )
    .setFooter({ text: t('embed.scrim.id', { id: scrim.id }) });

  if (scrim.result) {
    embed.addFields({
      name: t('embed.scrim.result'),
      value: `${h.tag} ${scrim.result.homeScore} – ${scrim.result.awayScore} ${a.tag}`,
    });
  }
  return embed;
}

export function scrimmageLine(
  scrim: Scrimmage,
  home: Team | null,
  away: Team | null,
  t: Translator,
): string {
  const h = label(home);
  const a = label(away);
  const result = scrim.result ? ` \`${scrim.result.homeScore}–${scrim.result.awayScore}\`` : '';
  return [
    `${t(STATUS_KEY[scrim.status])} **${h.tag}** vs **${a.tag}**${result}`,
    `${time(scrim.scheduledAt, TimestampStyles.ShortDateTime)} · \`${scrim.id}\``,
  ].join('\n');
}

function formatGoalDifference(gd: number): string {
  return gd > 0 ? `+${gd}` : String(gd);
}

export function teamStatsEmbed(
  team: Team,
  standing: TeamStanding,
  t: Translator,
  accent: number,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`${team.name} \`[${team.tag}]\` — ${t('embed.teamStats.suffix')}`)
    .setColor(accent)
    .addFields(
      { name: t('embed.stats.played'), value: String(standing.played), inline: true },
      {
        name: t('embed.stats.wdl'),
        value: `${standing.wins}–${standing.draws}–${standing.losses}`,
        inline: true,
      },
      { name: t('embed.stats.points'), value: String(standing.points), inline: true },
      {
        name: t('embed.stats.goals'),
        value: `${standing.goalsFor}–${standing.goalsAgainst}`,
        inline: true,
      },
      {
        name: t('embed.stats.goalDiff'),
        value: formatGoalDifference(standing.goalDifference),
        inline: true,
      },
    );
  if (team.logoUrl) {
    embed.setThumbnail(team.logoUrl);
  }
  return embed;
}

export function standingLine(rank: number, team: Team | null, standing: TeamStanding): string {
  const tag = team ? team.tag : '???';
  return (
    `\`${String(rank).padStart(2, ' ')}\` **${tag}** — ${standing.points} pts · ` +
    `${standing.played}P · ${standing.wins}–${standing.draws}–${standing.losses} · ` +
    `GD ${formatGoalDifference(standing.goalDifference)}`
  );
}

export function standingsEmbed(
  lines: string[],
  page: number,
  pageCount: number,
  t: Translator,
  accent: number,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(t('embed.standings.title'))
    .setColor(accent)
    .setDescription(lines.length ? lines.join('\n') : t('embed.standings.empty'));
  pageFooter(embed, page, pageCount, t);
  return embed;
}

export function scrimmageListEmbed(
  lines: string[],
  status: ScrimmageStatus | null,
  page: number,
  pageCount: number,
  t: Translator,
  accent: number,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(
      status
        ? t('embed.scrims.titleFiltered', { status: t(STATUS_KEY[status]) })
        : t('embed.scrims.title'),
    )
    .setColor(accent)
    .setDescription(lines.length ? lines.join('\n\n') : t('embed.scrims.empty'));
  pageFooter(embed, page, pageCount, t);
  return embed;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function mvpLine(rank: number, aggregate: PlayerAggregate): string {
  return (
    `\`${String(rank).padStart(2, ' ')}\` <@${aggregate.userId}> — ` +
    `**${round(aggregate.score)}** pts · ${aggregate.appearances} app`
  );
}

export function statsLeaderboardEmbed(
  lines: string[],
  page: number,
  pageCount: number,
  t: Translator,
  accent: number,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(t('embed.mvp.title'))
    .setColor(accent)
    .setDescription(lines.length ? lines.join('\n') : t('embed.mvp.empty'));
  pageFooter(embed, page, pageCount, t);
  return embed;
}

export function playerStatsEmbed(
  userId: string,
  aggregate: PlayerAggregate | null,
  categories: StatCategory[],
  t: Translator,
  accent: number,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(t('embed.player.title'))
    .setColor(accent)
    .setDescription(`<@${userId}>`);
  if (!aggregate) {
    embed.addFields({ name: t('embed.player.noneTitle'), value: t('embed.player.none') });
    return embed;
  }
  embed.addFields(
    { name: t('embed.player.score'), value: String(round(aggregate.score)), inline: true },
    { name: t('embed.player.appearances'), value: String(aggregate.appearances), inline: true },
  );
  const totals = categories
    .map((category) => `${category.label}: **${aggregate.totals[category.key] ?? 0}**`)
    .join(' · ');
  if (totals) {
    embed.addFields({ name: t('embed.player.totals'), value: totals });
  }
  return embed;
}

export function scrimSheetEmbed(
  lines: PlayerStatLine[],
  categories: StatCategory[],
  t: Translator,
  accent: number,
): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle(t('embed.sheet.title')).setColor(accent);
  if (lines.length === 0) {
    embed.setDescription(t('embed.sheet.empty'));
    return embed;
  }
  embed.setDescription(
    lines
      .map((line) => {
        const parts = categories
          .map((category) => `${category.label} \`${line.values[category.key] ?? 0}\``)
          .join(' · ');
        return `<@${line.userId}>\n${parts}`;
      })
      .join('\n\n'),
  );
  return embed;
}

export function rsvpEmbed(
  scrim: Scrimmage,
  home: Team | null,
  away: Team | null,
  rsvps: Rsvp[],
  t: Translator,
  accent: number,
): EmbedBuilder {
  const h = label(home);
  const a = label(away);
  const list = (status: RsvpStatus): string => {
    const users = rsvps.filter((rsvp) => rsvp.status === status);
    return users.length ? users.map((rsvp) => `<@${rsvp.userId}>`).join(', ') : '—';
  };
  const count = (status: RsvpStatus): number =>
    rsvps.filter((rsvp) => rsvp.status === status).length;

  return new EmbedBuilder()
    .setTitle(t('embed.rsvp.title', { home: h.name, away: a.name }))
    .setColor(accent)
    .addFields(
      {
        name: t('embed.rsvp.going', { count: count(RsvpStatus.Going) }),
        value: list(RsvpStatus.Going),
      },
      {
        name: t('embed.rsvp.maybe', { count: count(RsvpStatus.Maybe) }),
        value: list(RsvpStatus.Maybe),
      },
      {
        name: t('embed.rsvp.declined', { count: count(RsvpStatus.Declined) }),
        value: list(RsvpStatus.Declined),
      },
    )
    .setFooter({ text: t('embed.scrim.id', { id: scrim.id }) });
}

export function pollEmbed(
  poll: AvailabilityPoll,
  votes: PollVote[],
  t: Translator,
  accent: number,
): EmbedBuilder {
  const votersOf = (index: number): PollVote[] => votes.filter((vote) => vote.slotIndex === index);
  const counts = poll.slots.map((_, index) => votersOf(index).length);
  const max = Math.max(0, ...counts);
  const lines = poll.slots.map((slot, index) => {
    const voters = votersOf(index);
    const star = max > 0 && counts[index] === max ? '⭐ ' : '';
    const who = voters.length ? voters.map((vote) => `<@${vote.userId}>`).join(', ') : '—';
    return `${star}**${index + 1}.** ${slot} — **${counts[index]}** ✅\n${who}`;
  });
  return new EmbedBuilder()
    .setTitle(`📊 ${poll.title}`)
    .setColor(accent)
    .setDescription(lines.join('\n\n'))
    .setFooter({ text: t('embed.poll.footer', { id: poll.id }) });
}
