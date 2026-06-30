import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { ScrimmageStatus, type Scrimmage, type Team } from '@scrimmage/core';
import type { AppContext } from '../context.js';
import type { Command } from '../lib/command.js';
import { parseSchedule } from '../lib/time.js';
import { scrimmageEmbed, scrimmageLine, scrimmageListEmbed } from '../lib/format.js';
import { requireGuildId } from '../lib/interaction.js';
import { respondScrimmageIds, respondTeamNames } from '../lib/autocomplete.js';

export const scrimCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('scrim')
    .setDescription('Propose and manage scrimmages (friendly matches).')
    .addSubcommand((sub) =>
      sub
        .setName('propose')
        .setDescription('Propose a friendly match between two teams.')
        .addStringOption((opt) =>
          opt
            .setName('home')
            .setDescription('Home team name')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addStringOption((opt) =>
          opt
            .setName('away')
            .setDescription('Away team name')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addStringOption((opt) =>
          opt
            .setName('when')
            .setDescription('Kickoff time (ISO 8601 e.g. 2026-07-15T20:00, or a Unix timestamp)')
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('confirm')
        .setDescription('Confirm a proposed scrimmage.')
        .addStringOption((opt) =>
          opt.setName('id').setDescription('Scrimmage').setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('cancel')
        .setDescription('Cancel a scrimmage.')
        .addStringOption((opt) =>
          opt.setName('id').setDescription('Scrimmage').setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('List scrimmages in this server.')
        .addStringOption((opt) =>
          opt
            .setName('status')
            .setDescription('Filter by status')
            .addChoices(
              { name: 'Proposed', value: ScrimmageStatus.Proposed },
              { name: 'Confirmed', value: ScrimmageStatus.Confirmed },
              { name: 'Cancelled', value: ScrimmageStatus.Cancelled },
              { name: 'Played', value: ScrimmageStatus.Played },
            ),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('result')
        .setDescription('Record the final score of a confirmed scrimmage.')
        .addStringOption((opt) =>
          opt.setName('id').setDescription('Scrimmage').setRequired(true).setAutocomplete(true),
        )
        .addIntegerOption((opt) =>
          opt.setName('home').setDescription('Home team score').setRequired(true).setMinValue(0),
        )
        .addIntegerOption((opt) =>
          opt.setName('away').setDescription('Away team score').setRequired(true).setMinValue(0),
        ),
    ),

  async execute(interaction, context) {
    const guildId = await requireGuildId(interaction);
    if (!guildId) {
      return;
    }

    switch (interaction.options.getSubcommand()) {
      case 'propose':
        await propose(interaction, context, guildId);
        return;
      case 'confirm':
        await confirm(interaction, context, guildId);
        return;
      case 'cancel':
        await cancel(interaction, context, guildId);
        return;
      case 'list':
        await list(interaction, context, guildId);
        return;
      case 'result':
        await result(interaction, context, guildId);
        return;
    }
  },

  async autocomplete(interaction, context) {
    const focused = interaction.options.getFocused(true);
    if (focused.name === 'home' || focused.name === 'away') {
      await respondTeamNames(interaction, context);
      return;
    }
    if (focused.name === 'id') {
      await respondScrimmageIds(
        interaction,
        context,
        eligibleFor(interaction.options.getSubcommand()),
      );
      return;
    }
    await interaction.respond([]);
  },
};

/** Which scrimmages a given subcommand can act on — drives the ID autocomplete. */
function eligibleFor(subcommand: string): (scrim: Scrimmage) => boolean {
  switch (subcommand) {
    case 'confirm':
      return (scrim) => scrim.status === ScrimmageStatus.Proposed;
    case 'result':
      return (scrim) => scrim.status === ScrimmageStatus.Confirmed;
    case 'cancel':
      return (scrim) =>
        scrim.status === ScrimmageStatus.Proposed || scrim.status === ScrimmageStatus.Confirmed;
    default:
      return () => true;
  }
}

async function propose(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const scheduledAt = parseSchedule(interaction.options.getString('when', true));
  if (!scheduledAt) {
    await interaction.reply({
      content:
        '❌ I could not understand that time. Use ISO 8601 (e.g. `2026-07-15T20:00`) or a Unix timestamp.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const home = await context.teams.getTeamByName(
    guildId,
    interaction.options.getString('home', true),
  );
  const away = await context.teams.getTeamByName(
    guildId,
    interaction.options.getString('away', true),
  );

  const scrim = await context.scrimmages.propose({
    guildId,
    homeTeamId: home.id,
    awayTeamId: away.id,
    scheduledAt,
    proposedBy: interaction.user.id,
  });
  await interaction.reply({
    content: '📋 Scrimmage proposed!',
    embeds: [scrimmageEmbed(scrim, home, away)],
  });
}

async function confirm(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const scrim = await context.scrimmages.confirm(
    guildId,
    interaction.options.getString('id', true),
  );
  const [home, away] = await resolveTeams(context, guildId, scrim.homeTeamId, scrim.awayTeamId);
  await interaction.reply({
    content: '🟢 Scrimmage confirmed!',
    embeds: [scrimmageEmbed(scrim, home, away)],
  });
}

async function cancel(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const scrim = await context.scrimmages.cancel(guildId, interaction.options.getString('id', true));
  const [home, away] = await resolveTeams(context, guildId, scrim.homeTeamId, scrim.awayTeamId);
  await interaction.reply({
    content: '🔴 Scrimmage cancelled.',
    embeds: [scrimmageEmbed(scrim, home, away)],
  });
}

async function result(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const scrim = await context.scrimmages.recordResult(
    guildId,
    interaction.options.getString('id', true),
    {
      homeScore: interaction.options.getInteger('home', true),
      awayScore: interaction.options.getInteger('away', true),
    },
  );
  const [home, away] = await resolveTeams(context, guildId, scrim.homeTeamId, scrim.awayTeamId);
  await interaction.reply({
    content: '🏁 Result recorded!',
    embeds: [scrimmageEmbed(scrim, home, away)],
  });
}

async function list(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const status = interaction.options.getString('status') as ScrimmageStatus | null;
  const scrims = await context.scrimmages.list(guildId, status ? { status } : undefined);

  const teams = await context.teams.listTeams(guildId);
  const byId = new Map(teams.map((team) => [team.id, team]));
  const lines = scrims.map((scrim) =>
    scrimmageLine(scrim, byId.get(scrim.homeTeamId) ?? null, byId.get(scrim.awayTeamId) ?? null),
  );

  await interaction.reply({ embeds: [scrimmageListEmbed(lines, status)] });
}

/** Resolve both teams of a scrimmage, tolerating teams that were deleted. */
function resolveTeams(
  context: AppContext,
  guildId: string,
  homeId: string,
  awayId: string,
): Promise<[Team | null, Team | null]> {
  return Promise.all([
    context.storage.teams.findById(guildId, homeId),
    context.storage.teams.findById(guildId, awayId),
  ]);
}
