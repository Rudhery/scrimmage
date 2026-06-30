import type { Client, MessageCreateOptions } from 'discord.js';
import type { Logger } from '../logger.js';

/**
 * Best-effort direct message. Sending a DM fails when the user shares no mutual
 * server or has DMs disabled, so we never let that break a command — we just log
 * it and report whether it went through.
 */
export async function dmUser(
  client: Client,
  userId: string,
  payload: string | MessageCreateOptions,
  logger: Logger,
): Promise<boolean> {
  try {
    const user = await client.users.fetch(userId);
    await user.send(payload);
    return true;
  } catch (error) {
    logger.debug({ err: error, userId }, 'could not DM user');
    return false;
  }
}

/** DM several users at once, de-duplicated, best-effort. */
export async function dmUsers(
  client: Client,
  userIds: Iterable<string>,
  payload: string | MessageCreateOptions,
  logger: Logger,
): Promise<void> {
  const unique = [...new Set(userIds)];
  await Promise.all(unique.map((userId) => dmUser(client, userId, payload, logger)));
}
