import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import type { AppContext } from '../context.js';

/** A slash command: its definition plus the handler that runs it. */
export interface Command {
  readonly data:
    SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder;
  execute(interaction: ChatInputCommandInteraction, context: AppContext): Promise<void>;
  /** Optional handler for autocomplete interactions on this command's options. */
  autocomplete?(interaction: AutocompleteInteraction, context: AppContext): Promise<void>;
}
