import type { AutocompleteInteraction } from 'discord.js';
import type { Scrimmage } from '@scrimmage/core';
import type { AppContext } from '../context.js';

/** Discord allows at most 25 autocomplete suggestions per response. */
const MAX_CHOICES = 25;

/** Suggest existing team names (matched by name or tag) for the focused option. */
export async function respondTeamNames(
  interaction: AutocompleteInteraction,
  context: AppContext,
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.respond([]);
    return;
  }

  const query = interaction.options.getFocused().toLowerCase();
  const teams = await context.teams.listTeams(guildId);
  const choices = teams
    .filter((team) => `${team.name} ${team.tag}`.toLowerCase().includes(query))
    .slice(0, MAX_CHOICES)
    .map((team) => ({ name: `${team.name} [${team.tag}]`, value: team.name }));

  await interaction.respond(choices);
}

/** Suggest the guild's configured stat categories for the focused option. */
export async function respondStatCategories(
  interaction: AutocompleteInteraction,
  context: AppContext,
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.respond([]);
    return;
  }
  const query = interaction.options.getFocused().toLowerCase();
  const categories = await context.statCategories.list(guildId);
  await interaction.respond(
    categories
      .filter((category) => `${category.label} ${category.key}`.toLowerCase().includes(query))
      .slice(0, MAX_CHOICES)
      .map((category) => ({ name: category.label, value: category.key })),
  );
}

/**
 * Suggest scrimmage IDs for the focused option, labelled with the matchup and
 * status so they are easy to recognise. Pass `isEligible` to only offer the
 * scrimmages a given action can actually be applied to.
 */
export async function respondScrimmageIds(
  interaction: AutocompleteInteraction,
  context: AppContext,
  isEligible: (scrim: Scrimmage) => boolean = () => true,
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.respond([]);
    return;
  }

  const query = interaction.options.getFocused().toLowerCase();
  const [scrimmages, teams] = await Promise.all([
    context.scrimmages.list(guildId),
    context.teams.listTeams(guildId),
  ]);
  const tagById = new Map(teams.map((team) => [team.id, team.tag]));

  const choices = scrimmages
    .filter(isEligible)
    .filter((scrim) => scrim.id.toLowerCase().includes(query))
    .slice(0, MAX_CHOICES)
    .map((scrim) => {
      const home = tagById.get(scrim.homeTeamId) ?? '???';
      const away = tagById.get(scrim.awayTeamId) ?? '???';
      return {
        name: `${home} vs ${away} · ${scrim.status} · ${scrim.id.slice(0, 8)}`,
        value: scrim.id,
      };
    });

  await interaction.respond(choices);
}
