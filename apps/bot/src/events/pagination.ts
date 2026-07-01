import type { ButtonInteraction } from 'discord.js';
import type { ScrimmageStatus } from '@scrimmage/core';
import type { AppContext } from '../context.js';
import { renderTeamList } from '../commands/team.js';
import { renderScrimList } from '../commands/scrim.js';
import { renderStandings } from '../commands/standings.js';
import { renderMvp } from '../commands/stats.js';

const PREFIX = 'page';

/** Whether a button belongs to a paginated list. */
export function isPaginationButton(customId: string): boolean {
  return customId.startsWith(`${PREFIX}:`);
}

/**
 * Handle a Prev/Next click. The target page (and, for scrimmages, the status
 * filter) is encoded in the customId, so we just re-render that page in place.
 */
export async function handlePaginationButton(
  interaction: ButtonInteraction,
  context: AppContext,
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) {
    return;
  }
  const parts = interaction.customId.split(':');
  const kind = parts[1];

  if (kind === 'team') {
    const page = Number.parseInt(parts[2] ?? '0', 10);
    await interaction.update(await renderTeamList(context, guildId, page));
    return;
  }
  if (kind === 'scrim') {
    const statusPart = parts[2] ?? 'all';
    const page = Number.parseInt(parts[3] ?? '0', 10);
    const status = statusPart === 'all' ? null : (statusPart as ScrimmageStatus);
    await interaction.update(await renderScrimList(context, guildId, status, page));
    return;
  }
  if (kind === 'standings') {
    const page = Number.parseInt(parts[2] ?? '0', 10);
    await interaction.update(await renderStandings(context, guildId, page));
    return;
  }
  if (kind === 'mvp') {
    const page = Number.parseInt(parts[2] ?? '0', 10);
    await interaction.update(await renderMvp(context, guildId, page));
  }
}
