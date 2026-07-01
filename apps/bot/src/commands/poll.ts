import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  type ButtonInteraction,
} from 'discord.js';
import type { AvailabilityPoll } from '@scrimmage/core';
import type { AppContext } from '../context.js';
import type { Command } from '../lib/command.js';
import { pollEmbed } from '../lib/format.js';
import { accentFor, requireGuildId } from '../lib/interaction.js';
import type { PagedView } from '../lib/pagination.js';

const POLL_NAMESPACE = 'poll';

export const pollCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Availability poll: find the time slot that works for the most players.')
    .addStringOption((opt) =>
      opt
        .setName('title')
        .setDescription('What is the poll about?')
        .setRequired(true)
        .setMaxLength(100),
    )
    .addStringOption((opt) =>
      opt
        .setName('options')
        .setDescription('Comma-separated slots, e.g. "Sat 8pm, Sun 6pm, Mon 9pm" (2–10)')
        .setRequired(true),
    ),

  async execute(interaction, context) {
    const guildId = await requireGuildId(interaction);
    if (!guildId) {
      return;
    }
    const title = interaction.options.getString('title', true);
    const slots = interaction.options.getString('options', true).split(',');
    const poll = await context.polls.createPoll(guildId, title, slots, interaction.user.id);
    await interaction.reply(await renderPoll(context, guildId, poll.id));
  },
};

function pollRows(poll: AvailabilityPoll): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let start = 0; start < poll.slots.length; start += 5) {
    const buttons = poll.slots.slice(start, start + 5).map((_, offset) =>
      new ButtonBuilder()
        .setCustomId(`${POLL_NAMESPACE}:${poll.id}:${start + offset}`)
        .setLabel(String(start + offset + 1))
        .setStyle(ButtonStyle.Secondary),
    );
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons));
  }
  return rows;
}

/** Render the poll panel — shared by the command and the buttons. */
export async function renderPoll(
  context: AppContext,
  guildId: string,
  pollId: string,
): Promise<PagedView> {
  const poll = await context.polls.getPoll(pollId);
  const [votes, accent] = await Promise.all([
    context.polls.listVotes(pollId),
    accentFor(context, guildId),
  ]);
  return { embeds: [pollEmbed(poll, votes, accent)], components: pollRows(poll) };
}

/** Whether a button belongs to an availability poll. */
export function isPollButton(customId: string): boolean {
  return customId.startsWith(`${POLL_NAMESPACE}:`);
}

/** Handle a slot toggle, updating the poll panel in place. */
export async function handlePollButton(
  interaction: ButtonInteraction,
  context: AppContext,
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) {
    return;
  }
  const [, pollId, slotRaw] = interaction.customId.split(':');
  const slotIndex = Number(slotRaw);
  if (!pollId || Number.isNaN(slotIndex)) {
    return;
  }
  await context.polls.toggle(pollId, slotIndex, interaction.user.id);
  await interaction.update(await renderPoll(context, guildId, pollId));
}
