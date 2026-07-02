import {
  MessageFlags,
  PermissionFlagsBits,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type ModalSubmitInteraction,
} from 'discord.js';
import type { Team } from '@scrimmage/core';
import type { AppContext } from '../context.js';
import { DEFAULT_ACCENT } from './format.js';
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  resolveLocale,
  translate,
  translator,
  type Translator,
} from '../i18n/index.js';

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

/**
 * Guard for team-management actions: replies with a localized permission error
 * and returns `false` when the user may not manage the team.
 */
export async function ensureCanManageTeam(
  context: AppContext,
  interaction: ChatInputCommandInteraction,
  team: Team,
): Promise<boolean> {
  if (await canManageTeam(context, interaction, team)) {
    return true;
  }
  const t = await translatorFor(context, interaction);
  await interaction.reply({
    content: t('error.permissionDenied'),
    flags: MessageFlags.Ephemeral,
  });
  return false;
}

/** The guild's embed accent color, or the bot default. */
export async function accentFor(context: AppContext, guildId: string): Promise<number> {
  return (await context.guildSettings.get(guildId)).brandColor ?? DEFAULT_ACCENT;
}

/**
 * Guild-scoped translator + accent for building shared artifacts (embeds shown
 * in a channel), resolved from the guild's language only. One settings read.
 */
export async function guildLocalize(
  context: AppContext,
  guildId: string,
): Promise<{ t: Translator; accent: number }> {
  const settings = await context.guildSettings.get(guildId);
  return {
    t: translator(normalizeLocale(settings.language) ?? DEFAULT_LOCALE),
    accent: settings.brandColor ?? DEFAULT_ACCENT,
  };
}

/**
 * A translator for replying to this interaction, resolved from the guild's
 * language then the user's Discord locale. Use for ephemeral, one-user replies.
 */
export async function translatorFor(
  context: AppContext,
  interaction: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction,
): Promise<Translator> {
  const guildId = interaction.guildId;
  const language = guildId ? (await context.guildSettings.get(guildId)).language : null;
  return translator(resolveLocale(language, interaction.locale));
}

/**
 * One settings read yielding both translators + the accent: `t` in the user's
 * locale (for ephemeral replies) and `te` in the guild's locale (for embeds).
 */
export async function localize(
  context: AppContext,
  interaction: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction,
): Promise<{ t: Translator; te: Translator; accent: number }> {
  const guildId = interaction.guildId;
  const settings = guildId ? await context.guildSettings.get(guildId) : null;
  const language = settings?.language ?? null;
  return {
    t: translator(resolveLocale(language, interaction.locale)),
    te: translator(normalizeLocale(language) ?? DEFAULT_LOCALE),
    accent: settings?.brandColor ?? DEFAULT_ACCENT,
  };
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
