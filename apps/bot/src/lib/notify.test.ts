import { describe, expect, it, vi } from 'vitest';
import type { Client } from 'discord.js';
import type { Logger } from '../logger.js';
import { dmUser, dmUsers } from './notify.js';

const logger = { debug: vi.fn() } as unknown as Logger;

describe('dmUser', () => {
  it('sends a DM to the resolved user', async () => {
    const send = vi.fn();
    const client = {
      users: { fetch: vi.fn().mockResolvedValue({ send }) },
    } as unknown as Client;

    expect(await dmUser(client, 'u1', 'hi', logger)).toBe(true);
    expect(send).toHaveBeenCalledWith('hi');
  });

  it('returns false and never throws when the DM fails', async () => {
    const client = {
      users: { fetch: vi.fn().mockRejectedValue(new Error('DMs closed')) },
    } as unknown as Client;

    expect(await dmUser(client, 'u1', 'hi', logger)).toBe(false);
  });
});

describe('dmUsers', () => {
  it('de-duplicates recipients', async () => {
    const fetch = vi.fn().mockResolvedValue({ send: vi.fn() });
    const client = { users: { fetch } } as unknown as Client;

    await dmUsers(client, ['u1', 'u1', 'u2'], 'hi', logger);

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
