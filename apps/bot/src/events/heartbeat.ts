import type { AppContext } from '../context.js';

const HEARTBEAT_MS = 30_000;

/**
 * Periodically record that the bot is connected to each of its guilds, so the
 * dashboard can show whether the bot is online in a given server.
 *
 * @returns a function that stops the loop.
 */
export function startHeartbeat(context: AppContext): () => void {
  const { client, botStatus, logger } = context;

  const beat = (): void => {
    const guildIds = [...client.guilds.cache.keys()];
    void botStatus
      .recordHeartbeat(guildIds)
      .catch((error: unknown) => logger.error({ err: error }, 'heartbeat failed'));
  };

  beat();
  const handle = setInterval(beat, HEARTBEAT_MS);
  handle.unref();
  return () => {
    clearInterval(handle);
  };
}
