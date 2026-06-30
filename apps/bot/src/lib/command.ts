import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import type { AppContext } from '../context.js';

/** A slash command: its definition plus the handler that runs it. */
export interface Command {
  readonly data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute(interaction: ChatInputCommandInteraction, context: AppContext): Promise<void>;
}
