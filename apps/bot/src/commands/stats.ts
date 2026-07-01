import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { AppContext } from '../context.js';
import type { Command } from '../lib/command.js';
import { mvpLine, playerStatsEmbed, statsLeaderboardEmbed } from '../lib/format.js';
import { PAGE_SIZE, paginate, paginationRow, type PagedView } from '../lib/pagination.js';
import { requireGuildId } from '../lib/interaction.js';

export const statsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Player stats and the MVP leaderboard.')
    .addSubcommand((sub) => sub.setName('mvp').setDescription('Show the MVP leaderboard.'))
    .addSubcommand((sub) =>
      sub
        .setName('player')
        .setDescription("Show a player's stats.")
        .addUserOption((opt) => opt.setName('user').setDescription('The player').setRequired(true)),
    ),

  async execute(interaction, context) {
    const guildId = await requireGuildId(interaction);
    if (!guildId) {
      return;
    }
    if (interaction.options.getSubcommand() === 'player') {
      await player(interaction, context, guildId);
      return;
    }
    await interaction.reply(await renderMvp(context, guildId, 0));
  },
};

async function player(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const user = interaction.options.getUser('user', true);
  const [aggregate, categories] = await Promise.all([
    context.playerStats.forPlayer(guildId, user.id),
    context.statCategories.list(guildId),
  ]);
  await interaction.reply({ embeds: [playerStatsEmbed(user.id, aggregate, categories)] });
}

/** Render one page of the MVP leaderboard — shared by the command and pagination. */
export async function renderMvp(
  context: AppContext,
  guildId: string,
  page: number,
): Promise<PagedView> {
  const {
    items,
    page: current,
    pageCount,
  } = paginate(await context.playerStats.leaderboard(guildId), page);
  const lines = items.map((aggregate, index) =>
    mvpLine(current * PAGE_SIZE + index + 1, aggregate),
  );
  const row = paginationRow('page:mvp', current, pageCount);
  return {
    embeds: [statsLeaderboardEmbed(lines, current, pageCount)],
    components: row ? [row] : [],
  };
}
