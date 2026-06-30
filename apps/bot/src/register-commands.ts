import 'dotenv/config';
import { loadConfig } from './config.js';
import { commandList } from './commands/index.js';
import { registerCommands } from './lib/register.js';

/**
 * Standalone script to register slash commands with Discord. Run it with
 * `npm run register` (from the bot workspace) after changing any command.
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const count = await registerCommands(config, commandList);
  const target = config.discordGuildId ? `guild ${config.discordGuildId}` : 'the global scope';
  console.log(`✅ Registered ${count} command(s) to ${target}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
