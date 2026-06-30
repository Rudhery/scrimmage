import { EmbedBuilder, time, TimestampStyles } from 'discord.js';
import { ScrimmageStatus, type Scrimmage, type Team, type TeamMember } from '@scrimmage/core';

const BRAND_COLOR = 0x5865f2;

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
  return new EmbedBuilder()
    .setTitle(`${team.name} [${team.tag}]`)
    .setColor(BRAND_COLOR)
    .addFields(
      { name: 'Captain', value: `<@${team.captainId}>`, inline: true },
      { name: 'Members', value: String(roster.length), inline: true },
      {
        name: 'Roster',
        value: roster.length ? roster.map((member) => `<@${member.userId}>`).join(', ') : '—',
      },
    )
    .setFooter({ text: `Team ID: ${team.id}` });
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
