import { Collection } from 'discord.js';
import type { Command } from '../lib/command.js';
import { teamCommand } from './team.js';
import { scrimCommand } from './scrim.js';
import { standingsCommand } from './standings.js';

/** Every command the bot exposes. */
export const commandList: readonly Command[] = [teamCommand, scrimCommand, standingsCommand];

/** Commands indexed by name for fast lookup during interaction handling. */
export const commands = new Collection<string, Command>(
  commandList.map((command) => [command.data.name, command]),
);
