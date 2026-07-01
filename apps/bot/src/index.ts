import './env.js';
import { Events } from 'discord.js';
import { loadConfig } from './config.js';
import { createLogger } from './logger.js';
import { createContext } from './context.js';
import { createClient } from './client.js';
import { commandList, commands } from './commands/index.js';
import { registerCommands } from './lib/register.js';
import { handleInteraction } from './events/interaction-create.js';
import { registerNotifications } from './events/notifications.js';
import { startReminderLoop } from './events/reminders.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const client = createClient();
  const context = createContext(config, logger, client);
  registerNotifications(context);

  let stopReminders: (() => void) | undefined;

  client.once(Events.ClientReady, async (ready) => {
    logger.info(`Logged in as ${ready.user.tag}`);

    // Start the pre-game reminder loop only once the client can actually post.
    stopReminders = startReminderLoop(context);

    // Guild commands update instantly, so auto-register them in development.
    // For global commands, run `npm run register` explicitly.
    if (config.discordGuildId) {
      try {
        const count = await registerCommands(config, commandList);
        logger.info(`Registered ${count} guild command(s) to ${config.discordGuildId}`);
      } catch (error) {
        logger.error({ err: error }, 'failed to register guild commands');
      }
    }
  });

  client.on(Events.InteractionCreate, (interaction) =>
    handleInteraction(interaction, context, commands),
  );

  async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'shutting down');
    stopReminders?.();
    await client.destroy();
    await context.storage.close();
    process.exit(0);
  }
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await client.login(config.discordToken);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
