import { ChannelType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../lib/command.js';
import { isServerManager, requireGuildId } from '../lib/interaction.js';
import {
  localizations,
  LOCALE_LABELS,
  resolveLocale,
  translate,
  type Locale,
} from '../i18n/index.js';

export const configCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('View and change server settings.')
    .setDescriptionLocalizations(localizations('cmd.config'))
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
    )
    .addSubcommand((sub) =>
      sub
        .setName('points')
        .setDescription('Set the points awarded for win / draw / loss.')
        .addIntegerOption((opt) =>
          opt.setName('win').setDescription('Points for a win').setRequired(true).setMinValue(0),
        )
        .addIntegerOption((opt) =>
          opt.setName('draw').setDescription('Points for a draw').setRequired(true).setMinValue(0),
        )
        .addIntegerOption((opt) =>
          opt.setName('loss').setDescription('Points for a loss').setRequired(true).setMinValue(0),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('admin-role')
        .setDescription('Set the scrim-admin role (leave empty to clear it).')
        .addRoleOption((opt) =>
          opt.setName('role').setDescription('Role allowed to manage teams & scrimmages'),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('reminder')
        .setDescription('Set the reminder lead time in minutes (leave empty for the default).')
        .addIntegerOption((opt) =>
          opt
            .setName('minutes')
            .setDescription('Minutes before kickoff')
            .setMinValue(1)
            .setMaxValue(1440),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('color')
        .setDescription('Set the embed brand color (hex, leave empty to reset).')
        .addStringOption((opt) => opt.setName('hex').setDescription('Hex color, e.g. #5865F2')),
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
      const notSet = translate(locale, 'config.notSet');
      const channel = settings.announceChannelId ? `<#${settings.announceChannelId}>` : notSet;
      const language = settings.language
        ? (LOCALE_LABELS[settings.language as Locale] ?? settings.language)
        : translate(locale, 'config.followUser');
      const points = `${settings.points.win}/${settings.points.draw}/${settings.points.loss}`;
      const adminRole = settings.adminRoleId ? `<@&${settings.adminRoleId}>` : notSet;
      const reminder =
        settings.reminderLeadMinutes !== null
          ? translate(locale, 'config.reminderMinutes', { minutes: settings.reminderLeadMinutes })
          : translate(locale, 'config.reminderDefault');
      const color =
        settings.brandColor !== null
          ? `#${settings.brandColor.toString(16).padStart(6, '0')}`
          : translate(locale, 'config.color.default');
      await interaction.reply({
        content:
          `**${translate(locale, 'config.title')}**\n` +
          `• ${translate(locale, 'config.announceLabel')}: ${channel}\n` +
          `• ${translate(locale, 'config.languageLabel')}: ${language}\n` +
          `• ${translate(locale, 'config.pointsLabel')}: ${points}\n` +
          `• ${translate(locale, 'config.adminRoleLabel')}: ${adminRole}\n` +
          `• ${translate(locale, 'config.reminderLabel')}: ${reminder}\n` +
          `• ${translate(locale, 'config.colorLabel')}: ${color}`,
        flags: MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
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

    switch (subcommand) {
      case 'language': {
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
      case 'points': {
        const win = interaction.options.getInteger('win', true);
        const draw = interaction.options.getInteger('draw', true);
        const loss = interaction.options.getInteger('loss', true);
        await context.guildSettings.setPoints(guildId, win, draw, loss);
        await interaction.reply(translate(locale, 'config.points.set', { win, draw, loss }));
        return;
      }
      case 'admin-role': {
        const role = interaction.options.getRole('role');
        await context.guildSettings.setAdminRole(guildId, role?.id ?? null);
        await interaction.reply({
          content: role
            ? translate(locale, 'config.adminRole.set', { role: `<@&${role.id}>` })
            : translate(locale, 'config.adminRole.cleared'),
          allowedMentions: { parse: [] },
        });
        return;
      }
      case 'reminder': {
        const minutes = interaction.options.getInteger('minutes');
        await context.guildSettings.setReminderLead(guildId, minutes);
        await interaction.reply(
          minutes !== null
            ? translate(locale, 'config.reminder.set', { minutes })
            : translate(locale, 'config.reminder.cleared'),
        );
        return;
      }
      case 'color': {
        const hex = interaction.options.getString('hex');
        if (!hex) {
          await context.guildSettings.setBrandColor(guildId, null);
          await interaction.reply(translate(locale, 'config.color.cleared'));
          return;
        }
        const normalized = hex.replace(/^#/, '');
        if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
          await interaction.reply({
            content: translate(locale, 'config.color.invalid'),
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        await context.guildSettings.setBrandColor(guildId, Number.parseInt(normalized, 16));
        await interaction.reply(
          translate(locale, 'config.color.set', { hex: normalized.toUpperCase() }),
        );
        return;
      }
      default: {
        const channel = interaction.options.getChannel('channel');
        const updated = await context.guildSettings.setAnnounceChannel(
          guildId,
          channel?.id ?? null,
        );
        await interaction.reply(
          updated.announceChannelId
            ? translate(locale, 'config.announce.set', {
                channel: `<#${updated.announceChannelId}>`,
              })
            : translate(locale, 'config.announce.cleared'),
        );
      }
    }
  },
};
