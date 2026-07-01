import { EmbedBuilder, time, TimestampStyles } from 'discord.js';
import {
  RsvpStatus,
  ScrimmageStatus,
  TeamRole,
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

/** Default embed accent when a guild has not set a custom brand color. */
export const DEFAULT_ACCENT = 0x5865f2;

/** Human label and emoji for each member role. */
export const ROLE_LABEL: Record<TeamRole, string> = {
  [TeamRole.Coach]: '🎓 Coach',
  [TeamRole.Assistant]: '🧩 Assistant',
  [TeamRole.Player]: '🎮 Player',
};

const STATUS_LABEL: Record<ScrimmageStatus, string> = {
  [ScrimmageStatus.Proposed]: '🟡 Proposed',
  [ScrimmageStatus.Confirmed]: '🟢 Confirmed',
  [ScrimmageStatus.Cancelled]: '🔴 Cancelled',
  [ScrimmageStatus.Played]: '🏁 Played',
};

function label(team: Team | null): { name: string; tag: string } {
  return team ? { name: team.name, tag: team.tag } : { name: 'Unknown team', tag: '???' };
}

export function teamEmbed(team: Team, roster: TeamMember[], accent: number): EmbedBuilder {
  // The captain is shown on its own line, so keep them out of the role groups.
  const inRole = (role: TeamRole): TeamMember[] =>
    roster.filter((member) => member.role === role && member.userId !== team.captainId);
  const mentions = (members: TeamMember[]): string =>
    members.length ? members.map((member) => `<@${member.userId}>`).join(', ') : '—';

  const embed = new EmbedBuilder()
    .setTitle(`${team.name} \`[${team.tag}]\``)
    .setColor(accent)
    .addFields(
      { name: '👑 Captain', value: `<@${team.captainId}>`, inline: true },
      { name: '👥 Members', value: String(roster.length), inline: true },
      { name: '📅 Created', value: time(team.createdAt, TimestampStyles.LongDate), inline: true },
    )
    .setFooter({ text: `Team ID: ${team.id}` });

  if (team.logoUrl) {
    embed.setThumbnail(team.logoUrl);
  }
  if (team.description) {
    embed.setDescription(team.description);
  }
  if (team.roleId) {
    embed.addFields({ name: '🎽 Role', value: `<@&${team.roleId}>`, inline: true });
  }

  const coaches = inRole(TeamRole.Coach);
  const assistants = inRole(TeamRole.Assistant);
  if (coaches.length) {
    embed.addFields({ name: '🎓 Coaches', value: mentions(coaches) });
  }
  if (assistants.length) {
    embed.addFields({ name: '🧩 Assistants', value: mentions(assistants) });
  }
  embed.addFields({ name: '🎮 Players', value: mentions(inRole(TeamRole.Player)) });

  return embed;
}

export function teamListEmbed(
  teams: Team[],
  page: number,
  pageCount: number,
  accent: number,
): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle('Teams').setColor(accent);
  embed.setDescription(
    teams.length
      ? teams.map((team) => `**${team.name}** \`[${team.tag}]\``).join('\n')
      : 'No teams yet. Create one with `/team create`.',
  );
  if (pageCount > 1) {
    embed.setFooter({ text: `Page ${page + 1}/${pageCount}` });
  }
  return embed;
}

export function scrimmageEmbed(
  scrim: Scrimmage,
  home: Team | null,
  away: Team | null,
  accent: number,
): EmbedBuilder {
  const h = label(home);
  const a = label(away);

  const embed = new EmbedBuilder()
    .setTitle(`${h.name} vs ${a.name}`)
    .setColor(accent)
    .addFields(
      { name: 'Status', value: STATUS_LABEL[scrim.status], inline: true },
      {
        name: 'Kickoff',
        value: time(scrim.scheduledAt, TimestampStyles.LongDateTime),
        inline: true,
      },
    )
    .setFooter({ text: `Scrimmage ID: ${scrim.id}` });

  if (scrim.result) {
    embed.addFields({
      name: 'Result',
      value: `${h.tag} ${scrim.result.homeScore} – ${scrim.result.awayScore} ${a.tag}`,
    });
  }
  return embed;
}

export function rsvpEmbed(
  scrim: Scrimmage,
  home: Team | null,
  away: Team | null,
  rsvps: Rsvp[],
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
    .setTitle(`${h.name} vs ${a.name} — RSVP`)
    .setColor(accent)
    .addFields(
      { name: `✅ Going (${count(RsvpStatus.Going)})`, value: list(RsvpStatus.Going) },
      { name: `🤔 Maybe (${count(RsvpStatus.Maybe)})`, value: list(RsvpStatus.Maybe) },
      { name: `❌ Can't (${count(RsvpStatus.Declined)})`, value: list(RsvpStatus.Declined) },
    )
    .setFooter({ text: `Scrimmage ID: ${scrim.id}` });
}

export function pollEmbed(poll: AvailabilityPoll, votes: PollVote[], accent: number): EmbedBuilder {
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
    .setFooter({ text: `Poll ID: ${poll.id} · tap a number to toggle your availability` });
}

export function scrimmageLine(scrim: Scrimmage, home: Team | null, away: Team | null): string {
  const h = label(home);
  const a = label(away);
  const result = scrim.result ? ` \`${scrim.result.homeScore}–${scrim.result.awayScore}\`` : '';
  return [
    `${STATUS_LABEL[scrim.status]} **${h.tag}** vs **${a.tag}**${result}`,
    `${time(scrim.scheduledAt, TimestampStyles.ShortDateTime)} · \`${scrim.id}\``,
  ].join('\n');
}

function formatGoalDifference(gd: number): string {
  return gd > 0 ? `+${gd}` : String(gd);
}

export function teamStatsEmbed(team: Team, standing: TeamStanding, accent: number): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`${team.name} \`[${team.tag}]\` — stats`)
    .setColor(accent)
    .addFields(
      { name: 'Played', value: String(standing.played), inline: true },
      {
        name: 'W–D–L',
        value: `${standing.wins}–${standing.draws}–${standing.losses}`,
        inline: true,
      },
      { name: 'Points', value: String(standing.points), inline: true },
      { name: 'Goals (F–A)', value: `${standing.goalsFor}–${standing.goalsAgainst}`, inline: true },
      { name: 'Goal diff', value: formatGoalDifference(standing.goalDifference), inline: true },
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
  accent: number,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle('🏆 Standings')
    .setColor(accent)
    .setDescription(lines.length ? lines.join('\n') : 'No matches have been played yet.');
  if (pageCount > 1) {
    embed.setFooter({ text: `Page ${page + 1}/${pageCount}` });
  }
  return embed;
}

export function scrimmageListEmbed(
  lines: string[],
  status: ScrimmageStatus | null,
  page: number,
  pageCount: number,
  accent: number,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(status ? `Scrimmages — ${STATUS_LABEL[status]}` : 'Scrimmages')
    .setColor(accent)
    .setDescription(lines.length ? lines.join('\n\n') : 'No scrimmages found.');
  if (pageCount > 1) {
    embed.setFooter({ text: `Page ${page + 1}/${pageCount}` });
  }
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
  accent: number,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle('🏐 MVP leaderboard')
    .setColor(accent)
    .setDescription(lines.length ? lines.join('\n') : 'No player stats recorded yet.');
  if (pageCount > 1) {
    embed.setFooter({ text: `Page ${page + 1}/${pageCount}` });
  }
  return embed;
}

export function playerStatsEmbed(
  userId: string,
  aggregate: PlayerAggregate | null,
  categories: StatCategory[],
  accent: number,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle('Player stats')
    .setColor(accent)
    .setDescription(`<@${userId}>`);
  if (!aggregate) {
    embed.addFields({ name: 'No stats yet', value: 'This player has no recorded stats.' });
    return embed;
  }
  embed.addFields(
    { name: 'MVP score', value: String(round(aggregate.score)), inline: true },
    { name: 'Appearances', value: String(aggregate.appearances), inline: true },
  );
  const totals = categories
    .map((category) => `${category.label}: **${aggregate.totals[category.key] ?? 0}**`)
    .join(' · ');
  if (totals) {
    embed.addFields({ name: 'Totals', value: totals });
  }
  return embed;
}

export function scrimSheetEmbed(
  lines: PlayerStatLine[],
  categories: StatCategory[],
  accent: number,
): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle('📋 Match stat sheet').setColor(accent);
  if (lines.length === 0) {
    embed.setDescription('No stats recorded for this scrimmage yet. Use `/scrim stat`.');
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
