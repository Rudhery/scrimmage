import { describe, expect, it } from 'vitest';
import { TeamService } from '@scrimmage/core';
import { createSqliteStorage } from '@scrimmage/storage-sqlite';
import { createApp } from './app.js';

function setup() {
  const storage = createSqliteStorage({ path: ':memory:', migrate: true });
  const app = createApp(storage, { webOrigin: '*' });
  return { storage, app };
}

describe('API', () => {
  it('responds to the health check', async () => {
    const { storage, app } = setup();
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
    storage.close();
  });

  it("lists a guild's teams", async () => {
    const { storage, app } = setup();
    const teams = new TeamService(storage.teams);
    await teams.createTeam({ guildId: 'g', name: 'Alpha', tag: 'ALP', captainId: 'cap' });

    const res = await app.request('/api/guilds/g/teams');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ tag: string }>;
    expect(body).toHaveLength(1);
    expect(body[0]?.tag).toBe('ALP');
    storage.close();
  });

  it('returns 404 for an unknown team', async () => {
    const { storage, app } = setup();
    const res = await app.request('/api/guilds/g/teams/missing');
    expect(res.status).toBe(404);
    storage.close();
  });
});
