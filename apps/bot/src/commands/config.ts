import { ChannelType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../lib/command.js';
import { isServerManager, requireGuildId } from '../lib/interaction.js';
import { LOCALE_LABELS, resolveLocale, translate, type Locale } from '../i18n/index.js';

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
    )
    .addSubcommand((sub) =>
      sub
        .setName('language')
        .setDescription('Set the server language.')
        .addStringOption((opt) =>
          opt
            .setName('language')
            .setDescription('Language')
            .setRequired(true)
            .addChoices(
              { name: 'Auto (follow each user)', value: 'auto' },
              { name: 'English', value: 'en' },
              { name: 'Português (Brasil)', value: 'pt-BR' },
              { name: 'Español', value: 'es' },
            ),
        ),
    ),

  async execute(interaction, context) {
    const guildId = await requireGuildId(interaction);
    if (!guildId) {
      return;
    }

    const settings = await context.guildSettings.get(guildId);
    const locale = resolveLocale(settings.language, interaction.locale);
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'view') {
      const channel = settings.announceChannelId
        ? `<#${settings.announceChannelId}>`
        : translate(locale, 'config.notSet');
      const language = settings.language
        ? (LOCALE_LABELS[settings.language as Locale] ?? settings.language)
        : translate(locale, 'config.followUser');
      await interaction.reply({
        content:
          `**${translate(locale, 'config.title')}**\n` +
          `• ${translate(locale, 'config.announceLabel')}: ${channel}\n` +
          `• ${translate(locale, 'config.languageLabel')}: ${language}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!isServerManager(interaction)) {
      await interaction.reply({
        content: translate(locale, 'config.notAllowed'),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (subcommand === 'language') {
      const choice = interaction.options.getString('language', true);
      const language = choice === 'auto' ? null : choice;
      await context.guildSettings.setLanguage(guildId, language);
      const newLocale = resolveLocale(language, interaction.locale);
      await interaction.reply(
        language
          ? translate(newLocale, 'config.language.set', {
              language: LOCALE_LABELS[language as Locale] ?? language,
            })
          : translate(newLocale, 'config.language.cleared'),
      );
      return;
    }

    const channel = interaction.options.getChannel('channel');
    const updated = await context.guildSettings.setAnnounceChannel(guildId, channel?.id ?? null);
    await interaction.reply(
      updated.announceChannelId
        ? translate(locale, 'config.announce.set', { channel: `<#${updated.announceChannelId}>` })
        : translate(locale, 'config.announce.cleared'),
    );
  },
};
