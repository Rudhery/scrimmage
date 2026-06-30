import { MessageFlags, type Interaction } from 'discord.js';
import type { Collection } from 'discord.js';
import type { AppContext } from '../context.js';
import type { Command } from '../lib/command.js';
import { toUserMessage } from '../lib/errors.js';

/** Route an incoming interaction to its command and report failures gracefully. */
export async function handleInteraction(
  interaction: Interaction,
  context: AppContext,
  commands: Collection<string, Command>,
): Promise<void> {
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
