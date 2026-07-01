import { MessageFlags, PermissionFlagsBits, type ChatInputCommandInteraction } from 'discord.js';
import type { Team } from '@scrimmage/core';
import { DEFAULT_LOCALE, normalizeLocale, translate } from '../i18n/index.js';

/**
 * Ensure the command was used inside a guild. Replies with an ephemeral notice
 * and returns `null` when it was not, so callers can simply:
 *
 * ```ts
 * const guildId = await requireGuildId(interaction);
 * if (!guildId) return;
 * ```
 */
export async function requireGuildId(
  interaction: ChatInputCommandInteraction,
): Promise<string | null> {
  if (interaction.guildId) {
    return interaction.guildId;
  }
  const locale = normalizeLocale(interaction.locale) ?? DEFAULT_LOCALE;
  await interaction.reply({
    content: translate(locale, 'error.guildOnly'),
    flags: MessageFlags.Ephemeral,
  });
  return null;
}

/** Whether the invoking user may modify or delete the given team. */
export function canManageTeam(interaction: ChatInputCommandInteraction, team: Team): boolean {
  if (interaction.user.id === team.captainId) {
    return true;
  }
  return isServerManager(interaction);
}

/** Whether the invoking user has the Manage Server permission. */
export function isServerManager(interaction: ChatInputCommandInteraction): boolean {
  return interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false;
}
