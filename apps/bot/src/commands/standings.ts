import { SlashCommandBuilder } from 'discord.js';
import type { AppContext } from '../context.js';
import type { Command } from '../lib/command.js';
import { standingLine, standingsEmbed } from '../lib/format.js';
import { PAGE_SIZE, paginate, paginationRow, type PagedView } from '../lib/pagination.js';
import { accentFor, requireGuildId } from '../lib/interaction.js';

export const standingsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('standings')
    .setDescription('Show the league standings for this server.'),

  async execute(interaction, context) {
    const guildId = await requireGuildId(interaction);
    if (!guildId) {
      return;
    }
    await interaction.reply(await renderStandings(context, guildId, 0));
  },
};

/** Render one page of the standings — shared by the command and pagination buttons. */
export async function renderStandings(
  context: AppContext,
  guildId: string,
  page: number,
): Promise<PagedView> {
  const {
    items,
    page: current,
    pageCount,
  } = paginate(await context.standings.forGuild(guildId), page);

  const teams = await context.teams.listTeams(guildId);
  const byId = new Map(teams.map((team) => [team.id, team]));
  const lines = items.map((standing, index) =>
    standingLine(current * PAGE_SIZE + index + 1, byId.get(standing.teamId) ?? null, standing),
  );

  const row = paginationRow('page:standings', current, pageCount);
  return {
    embeds: [standingsEmbed(lines, current, pageCount, await accentFor(context, guildId))],
    components: row ? [row] : [],
  };
}
