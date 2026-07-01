import { MessageFlags, PermissionFlagsBits, type ChatInputCommandInteraction } from 'discord.js';
import type { Team } from '@scrimmage/core';
import type { AppContext } from '../context.js';
import { DEFAULT_ACCENT } from './format.js';
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

/**
 * Whether the invoking user may modify or delete the given team: the captain, a
 * member with Manage Server, or a member holding the guild's scrim-admin role.
 */
export async function canManageTeam(
  context: AppContext,
  interaction: ChatInputCommandInteraction,
  team: Team,
): Promise<boolean> {
  if (interaction.user.id === team.captainId || isServerManager(interaction)) {
    return true;
  }
  const { adminRoleId } = await context.guildSettings.get(team.guildId);
  return adminRoleId !== null && memberHasRole(interaction, adminRoleId);
}

/** The guild's embed accent color, or the bot default. */
export async function accentFor(context: AppContext, guildId: string): Promise<number> {
  return (await context.guildSettings.get(guildId)).brandColor ?? DEFAULT_ACCENT;
}

/** Whether the invoking user has the Manage Server permission. */
export function isServerManager(interaction: ChatInputCommandInteraction): boolean {
  return interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false;
}

function memberHasRole(interaction: ChatInputCommandInteraction, roleId: string): boolean {
  const member = interaction.member;
  if (!member) {
    return false;
  }
  const roles = member.roles;
  return Array.isArray(roles) ? roles.includes(roleId) : roles.cache.has(roleId);
}
