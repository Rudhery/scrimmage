import { EmbedBuilder, time, TimestampStyles } from 'discord.js';
import {
  ScrimmageStatus,
  TeamRole,
  type Scrimmage,
  type Team,
  type TeamMember,
  type TeamStanding,
} from '@scrimmage/core';

const BRAND_COLOR = 0x5865f2;

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

export function teamEmbed(team: Team, roster: TeamMember[]): EmbedBuilder {
  // The captain is shown on its own line, so keep them out of the role groups.
  const inRole = (role: TeamRole): TeamMember[] =>
    roster.filter((member) => member.role === role && member.userId !== team.captainId);
  const mentions = (members: TeamMember[]): string =>
    members.length ? members.map((member) => `<@${member.userId}>`).join(', ') : '—';

  const embed = new EmbedBuilder()
    .setTitle(`${team.name} \`[${team.tag}]\``)
    .setColor(BRAND_COLOR)
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

export function teamListEmbed(teams: Team[], page: number, pageCount: number): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle('Teams').setColor(BRAND_COLOR);
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
): EmbedBuilder {
  const h = label(home);
  const a = label(away);

  const embed = new EmbedBuilder()
    .setTitle(`${h.name} vs ${a.name}`)
    .setColor(BRAND_COLOR)
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

export function teamStatsEmbed(team: Team, standing: TeamStanding): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`${team.name} \`[${team.tag}]\` — stats`)
    .setColor(BRAND_COLOR)
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

export function standingsEmbed(lines: string[], page: number, pageCount: number): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle('🏆 Standings')
    .setColor(BRAND_COLOR)
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
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(status ? `Scrimmages — ${STATUS_LABEL[status]}` : 'Scrimmages')
    .setColor(BRAND_COLOR)
    .setDescription(lines.length ? lines.join('\n\n') : 'No scrimmages found.');
  if (pageCount > 1) {
    embed.setFooter({ text: `Page ${page + 1}/${pageCount}` });
  }
  return embed;
}
