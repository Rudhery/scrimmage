import { REST, Routes } from 'discord.js';
import type { Config } from '../config.js';
import type { Command } from './command.js';

/**
 * Register slash commands with Discord. Registers to a single guild when
 * `DISCORD_GUILD_ID` is set (updates are instant — ideal for development),
 * otherwise registers globally. Returns the number of commands registered.
 */
export async function registerCommands(
  config: Config,
  commands: readonly Command[],
): Promise<number> {
  const rest = new REST({ version: '10' }).setToken(config.discordToken);
  const body = commands.map((command) => command.data.toJSON());

  if (config.discordGuildId) {
    await rest.put(Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId), {
      body,
    });
  } else {
    await rest.put(Routes.applicationCommands(config.discordClientId), { body });
  }

  return body.length;
}
