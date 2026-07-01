import {
  ChannelType,
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { AppContext } from '../context.js';
import type { Command } from '../lib/command.js';
import { isServerManager, requireGuildId } from '../lib/interaction.js';

const NOT_ALLOWED = '❌ You need the **Manage Server** permission to change settings.';

export const configCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('View and change server settings.')
    .addSubcommand((sub) => sub.setName('view').setDescription('Show the current server settings.'))
    .addSubcommand((sub) =>
      sub
        .setName('announce')
        .setDescription('Set the announcement channel (leave empty to clear it).')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Channel for reminders and announcements')
            .addChannelTypes(ChannelType.GuildText),
        ),
    ),

  async execute(interaction, context) {
    const guildId = await requireGuildId(interaction);
    if (!guildId) {
      return;
    }

    if (interaction.options.getSubcommand() === 'view') {
      await showConfig(interaction, context, guildId);
      return;
    }

    if (!isServerManager(interaction)) {
      await interaction.reply({ content: NOT_ALLOWED, flags: MessageFlags.Ephemeral });
      return;
    }

    const channel = interaction.options.getChannel('channel');
    const updated = await context.guildSettings.setAnnounceChannel(guildId, channel?.id ?? null);
    await interaction.reply(
      updated.announceChannelId
        ? `📢 Announcements will be posted in <#${updated.announceChannelId}>.`
        : "📢 Announcement channel cleared — reminders fall back to the scrimmage's channel.",
    );
  },
};

async function showConfig(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const settings = await context.guildSettings.get(guildId);
  const channel = settings.announceChannelId ? `<#${settings.announceChannelId}>` : '_not set_';
  await interaction.reply({
    content: `**Server settings**\n• Announcement channel: ${channel}`,
    flags: MessageFlags.Ephemeral,
  });
}
