import { MessageFlags, type Interaction } from 'discord.js';
import type { Collection } from 'discord.js';
import type { AppContext } from '../context.js';
import type { Command } from '../lib/command.js';
import { toUserMessage } from '../lib/errors.js';
import {
  handleRsvpButton,
  handleScrimButton,
  isRsvpButton,
  isScrimButton,
} from '../commands/scrim.js';
import { handleTeamModal, isTeamModal } from '../commands/team.js';
import { handlePaginationButton, isPaginationButton } from './pagination.js';

/** Route an incoming interaction to its command and report failures gracefully. */
export async function handleInteraction(
  interaction: Interaction,
  context: AppContext,
  commands: Collection<string, Command>,
): Promise<void> {
  if (interaction.isAutocomplete()) {
    const command = commands.get(interaction.commandName);
    if (!command?.autocomplete) {
      return;
    }
    try {
      await command.autocomplete(interaction, context);
    } catch (error) {
      context.logger.error({ err: error, command: interaction.commandName }, 'autocomplete failed');
    }
    return;
  }

  if (interaction.isButton()) {
    try {
      if (isScrimButton(interaction.customId)) {
        await handleScrimButton(interaction, context);
      } else if (isRsvpButton(interaction.customId)) {
        await handleRsvpButton(interaction, context);
      } else if (isPaginationButton(interaction.customId)) {
        await handlePaginationButton(interaction, context);
      }
    } catch (error) {
      context.logger.error({ err: error, customId: interaction.customId }, 'button failed');
      const content = toUserMessage(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      }
    }
    return;
  }

  if (interaction.isModalSubmit()) {
    if (!isTeamModal(interaction.customId)) {
      return;
    }
    try {
      await handleTeamModal(interaction, context);
    } catch (error) {
      context.logger.error({ err: error, customId: interaction.customId }, 'modal failed');
      const content = toUserMessage(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commands.get(interaction.commandName);
  if (!command) {
    context.logger.warn({ command: interaction.commandName }, 'received unknown command');
    return;
  }

  try {
    await command.execute(interaction, context);
  } catch (error) {
    context.logger.error({ err: error, command: interaction.commandName }, 'command failed');
    const content = toUserMessage(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ content });
    } else {
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    }
  }
}
