import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  SlashCommandBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type EmbedBuilder,
} from 'discord.js';
import { ScrimmageStatus, type Scrimmage, type Team } from '@scrimmage/core';
import type { AppContext } from '../context.js';
import type { Command } from '../lib/command.js';
import { parseSchedule } from '../lib/time.js';
import {
  scrimSheetEmbed,
  scrimmageEmbed,
  scrimmageLine,
  scrimmageListEmbed,
} from '../lib/format.js';
import { paginate, paginationRow, type PagedView } from '../lib/pagination.js';
import { requireGuildId } from '../lib/interaction.js';
import {
  respondScrimmageIds,
  respondStatCategories,
  respondTeamNames,
} from '../lib/autocomplete.js';

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
        .setName('info')
        .setDescription('Show the details of a scrimmage.')
        .addStringOption((opt) =>
          opt.setName('id').setDescription('Scrimmage').setRequired(true).setAutocomplete(true),
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
    )
    .addSubcommand((sub) =>
      sub
        .setName('stat')
        .setDescription("Record one of a player's stats for a scrimmage.")
        .addStringOption((opt) =>
          opt.setName('id').setDescription('Scrimmage').setRequired(true).setAutocomplete(true),
        )
        .addUserOption((opt) =>
          opt.setName('player').setDescription('The player').setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName('category')
            .setDescription('Stat category')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addIntegerOption((opt) =>
          opt.setName('value').setDescription('Value').setRequired(true).setMinValue(0),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('sheet')
        .setDescription('Show the recorded stat sheet for a scrimmage.')
        .addStringOption((opt) =>
          opt.setName('id').setDescription('Scrimmage').setRequired(true).setAutocomplete(true),
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
      case 'info':
        await info(interaction, context, guildId);
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
      case 'stat':
        await recordStat(interaction, context, guildId);
        return;
      case 'sheet':
        await sheet(interaction, context, guildId);
        return;
    }
  },

  async autocomplete(interaction, context) {
    const focused = interaction.options.getFocused(true);
    if (focused.name === 'home' || focused.name === 'away') {
      await respondTeamNames(interaction, context);
      return;
    }
    if (focused.name === 'category') {
      await respondStatCategories(interaction, context);
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
    channelId: interaction.channelId ?? undefined,
  });
  await interaction.reply({
    content: '📋 Scrimmage proposed!',
    embeds: [scrimmageEmbed(scrim, home, away)],
    components: [scrimActionRow(scrim.id)],
  });
}

async function info(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const scrim = await context.scrimmages.getScrimmage(
    guildId,
    interaction.options.getString('id', true),
  );
  const [home, away] = await resolveTeams(context, guildId, scrim.homeTeamId, scrim.awayTeamId);
  await interaction.reply({ embeds: [scrimmageEmbed(scrim, home, away)] });
}

async function confirm(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const reply = await applyScrimAction(
    context,
    guildId,
    interaction.options.getString('id', true),
    'confirm',
  );
  await interaction.reply(reply);
}

async function cancel(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const reply = await applyScrimAction(
    context,
    guildId,
    interaction.options.getString('id', true),
    'cancel',
  );
  await interaction.reply(reply);
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
  await interaction.reply(await renderScrimList(context, guildId, status, 0));
}

/** Render one page of the scrimmage list — shared by the command and pagination buttons. */
export async function renderScrimList(
  context: AppContext,
  guildId: string,
  status: ScrimmageStatus | null,
  page: number,
): Promise<PagedView> {
  const all = await context.scrimmages.list(guildId, status ? { status } : undefined);
  const { items, page: current, pageCount } = paginate(all, page);

  const teams = await context.teams.listTeams(guildId);
  const byId = new Map(teams.map((team) => [team.id, team]));
  const lines = items.map((scrim) =>
    scrimmageLine(scrim, byId.get(scrim.homeTeamId) ?? null, byId.get(scrim.awayTeamId) ?? null),
  );

  const row = paginationRow(`page:scrim:${status ?? 'all'}`, current, pageCount);
  return {
    embeds: [scrimmageListEmbed(lines, status, current, pageCount)],
    components: row ? [row] : [],
  };
}

type ScrimAction = 'confirm' | 'cancel';
type ScrimReply = { content: string; embeds: EmbedBuilder[] };

/** Run a confirm/cancel action and build the message that reports the result. */
async function applyScrimAction(
  context: AppContext,
  guildId: string,
  scrimId: string,
  action: ScrimAction,
): Promise<ScrimReply> {
  const scrim =
    action === 'confirm'
      ? await context.scrimmages.confirm(guildId, scrimId)
      : await context.scrimmages.cancel(guildId, scrimId);
  const [home, away] = await resolveTeams(context, guildId, scrim.homeTeamId, scrim.awayTeamId);
  const content = action === 'confirm' ? '🟢 Scrimmage confirmed!' : '🔴 Scrimmage cancelled.';
  return { content, embeds: [scrimmageEmbed(scrim, home, away)] };
}

const BUTTON_NAMESPACE = 'scrim';

/** The Confirm/Cancel action row shown under a freshly proposed scrimmage. */
function scrimActionRow(scrimId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${BUTTON_NAMESPACE}:confirm:${scrimId}`)
      .setLabel('Confirm')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`${BUTTON_NAMESPACE}:cancel:${scrimId}`)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger),
  );
}

/** Whether a button interaction belongs to the scrimmage commands. */
export function isScrimButton(customId: string): boolean {
  return customId.startsWith(`${BUTTON_NAMESPACE}:`);
}

/** Handle a Confirm/Cancel button on a proposed scrimmage. */
export async function handleScrimButton(
  interaction: ButtonInteraction,
  context: AppContext,
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) {
    return;
  }
  const [, action, scrimId] = interaction.customId.split(':');
  if ((action !== 'confirm' && action !== 'cancel') || !scrimId) {
    return;
  }
  const reply = await applyScrimAction(context, guildId, scrimId, action);
  await interaction.update({ ...reply, components: [] });
}

async function recordStat(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const scrim = await context.scrimmages.getScrimmage(
    guildId,
    interaction.options.getString('id', true),
  );
  const user = interaction.options.getUser('player', true);
  const category = interaction.options.getString('category', true);
  const value = interaction.options.getInteger('value', true);
  const teamId = await inferTeamId(context, scrim, user.id);

  await context.playerStats.setStat({
    guildId,
    scrimmageId: scrim.id,
    teamId,
    userId: user.id,
    key: category,
    value,
  });
  await interaction.reply(`📊 Recorded **${value}** ${category} for <@${user.id}>.`);
}

async function sheet(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const scrim = await context.scrimmages.getScrimmage(
    guildId,
    interaction.options.getString('id', true),
  );
  const [lines, categories] = await Promise.all([
    context.playerStats.forScrimmage(scrim.id),
    context.statCategories.list(guildId),
  ]);
  await interaction.reply({ embeds: [scrimSheetEmbed(lines, categories)] });
}

/** Best-effort: which of the scrimmage's two teams is the player on. */
async function inferTeamId(context: AppContext, scrim: Scrimmage, userId: string): Promise<string> {
  const [home, away] = await Promise.all([
    context.storage.teams.findMember(scrim.homeTeamId, userId),
    context.storage.teams.findMember(scrim.awayTeamId, userId),
  ]);
  if (home) {
    return scrim.homeTeamId;
  }
  if (away) {
    return scrim.awayTeamId;
  }
  return '';
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
