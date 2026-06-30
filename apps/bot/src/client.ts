import { Client, GatewayIntentBits } from 'discord.js';

/**
 * Create the Discord client. Only the `Guilds` intent is required — slash
 * commands arrive as interactions and need no privileged intents.
 */
export function createClient(): Client {
  return new Client({ intents: [GatewayIntentBits.Guilds] });
}
