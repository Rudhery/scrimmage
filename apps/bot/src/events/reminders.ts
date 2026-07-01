import type { AppContext } from '../context.js';

/**
 * Poll for confirmed scrimmages that are about to kick off. `processDueReminders`
 * marks them and emits `scrimmage.reminderDue`; the actual message is sent by the
 * listener in `notifications.ts`.
 *
 * Polling (rather than per-scrimmage timers) makes reminders survive restarts —
 * every tick re-reads state from storage, so nothing is lost when the bot stops.
 *
 * @returns a function that stops the loop.
 */
const WINDOW_MS = 24 * 60 * 60 * 1000;

export function startReminderLoop(context: AppContext): () => void {
  const { scrimmages, guildSettings, config, logger } = context;

  // Each guild may override the lead time; fall back to the bot default.
  const resolveLeadMs = async (guildId: string): Promise<number> => {
    const settings = await guildSettings.get(guildId);
    const minutes = settings.reminderLeadMinutes ?? config.reminderLeadMs / 60_000;
    return minutes * 60_000;
  };

  const tick = (): void => {
    scrimmages
      .processDueReminders(WINDOW_MS, resolveLeadMs)
      .catch((error: unknown) => logger.error({ err: error }, 'reminder loop failed'));
  };

  tick(); // catch anything already due at startup
  const handle = setInterval(tick, config.reminderPollMs);
  handle.unref();
  return () => {
    clearInterval(handle);
  };
}
