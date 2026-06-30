import { EmbedBuilder, time, TimestampStyles } from 'discord.js';
import {
  ScrimmageStatus,
  TeamRole,
  type Scrimmage,
  type Team,
  type TeamMember,
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
    )
    .setFooter({ text: `Team ID: ${team.id}` });

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

export function teamListEmbed(teams: Team[]): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle('Teams').setColor(BRAND_COLOR);
  embed.setDescription(
    teams.length
      ? teams.map((team) => `**${team.name}** \`[${team.tag}]\``).join('\n')
      : 'No teams yet. Create one with `/team create`.',
  );
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

export function scrimmageListEmbed(lines: string[], status: ScrimmageStatus | null): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(status ? `Scrimmages — ${STATUS_LABEL[status]}` : 'Scrimmages')
    .setColor(BRAND_COLOR)
    .setDescription(lines.length ? lines.join('\n\n') : 'No scrimmages found.');
}
