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
export function startReminderLoop(context: AppContext): () => void {
  const { scrimmages, config, logger } = context;

  const tick = (): void => {
    scrimmages
      .processDueReminders(config.reminderLeadMs)
      .catch((error: unknown) => logger.error({ err: error }, 'reminder loop failed'));
  };

  tick(); // catch anything already due at startup
  const handle = setInterval(tick, config.reminderPollMs);
  handle.unref();
  return () => {
    clearInterval(handle);
  };
}
