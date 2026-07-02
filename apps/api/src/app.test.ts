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

  it('creates a team through the API', async () => {
    const { storage, app } = setup();
    const res = await app.request('/api/guilds/g/teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Alpha', tag: 'ALP' }),
    });
    expect(res.status).toBe(201);
    const list = (await (await app.request('/api/guilds/g/teams')).json()) as unknown[];
    expect(list).toHaveLength(1);
    storage.close();
  });

  it('runs a championship from creation to a recorded result', async () => {
    const { storage, app } = setup();
    const teams = new TeamService(storage.teams);
    const defs: Array<[string, string]> = [
      ['Alpha', 'ALP'],
      ['Bravo', 'BRV'],
      ['Charlie', 'CHA'],
      ['Delta', 'DEL'],
    ];
    const created = [];
    for (const [name, tag] of defs) {
      created.push(await teams.createTeam({ guildId: 'g', name, tag, captainId: 'cap' }));
    }

    const createRes = await app.request('/api/guilds/g/championships', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Cup',
        bestOf: 3,
        startsAt: '2026-07-01',
        endsAt: '2026-07-31',
      }),
    });
    expect(createRes.status).toBe(201);
    const champ = (await createRes.json()) as { id: string; status: string };
    expect(champ.status).toBe('draft');

    const seedRes = await app.request(`/api/guilds/g/championships/${champ.id}/teams`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ teamIds: created.map((t) => t.id) }),
    });
    expect(seedRes.status).toBe(200);

    const bracketRes = await app.request(`/api/guilds/g/championships/${champ.id}/bracket`, {
      method: 'POST',
    });
    expect(bracketRes.status).toBe(200);
    expect(((await bracketRes.json()) as { status: string }).status).toBe('active');

    const detail = (await (
      await app.request(`/api/guilds/g/championships/${champ.id}`)
    ).json()) as { matches: Array<{ id: string; round: number; position: number }> };
    const semi = detail.matches.find((m) => m.round === 1 && m.position === 0);

    const setRes = await app.request(`/api/guilds/g/matches/${semi!.id}/sets`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sets: [
          { homeScore: 25, awayScore: 20 },
          { homeScore: 25, awayScore: 18 },
        ],
      }),
    });
    expect(setRes.status).toBe(200);
    expect(((await setRes.json()) as { status: string }).status).toBe('played');
    storage.close();
  });

  it('schedules a scrimmage, records the result and MVP awards', async () => {
    const { storage, app } = setup();
    const teams = new TeamService(storage.teams);
    const home = await teams.createTeam({
      guildId: 'g',
      name: 'Alpha',
      tag: 'ALP',
      captainId: 'cap',
    });
    const away = await teams.createTeam({
      guildId: 'g',
      name: 'Bravo',
      tag: 'BRV',
      captainId: 'cap',
    });

    const future = new Date(Date.now() + 86_400_000).toISOString();
    const scheduleRes = await app.request('/api/guilds/g/scrimmages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ homeTeamId: home.id, awayTeamId: away.id, scheduledAt: future }),
    });
    expect(scheduleRes.status).toBe(201);
    const scrim = (await scheduleRes.json()) as { id: string; status: string };
    expect(scrim.status).toBe('confirmed');

    const resultRes = await app.request(`/api/guilds/g/scrimmages/${scrim.id}/result`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ homeScore: 3, awayScore: 1 }),
    });
    expect(resultRes.status).toBe(200);

    const awardsRes = await app.request(`/api/guilds/g/scrimmages/${scrim.id}/awards`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ overall: 'u1', offensive: 'u2', defensive: 'u3' }),
    });
    expect(awardsRes.status).toBe(200);
    expect(((await awardsRes.json()) as { overall: string }).overall).toBe('u1');
    storage.close();
  });

  it('rejects a championship with an invalid best-of', async () => {
    const { storage, app } = setup();
    const res = await app.request('/api/guilds/g/championships', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x', bestOf: 4, startsAt: '2026-07-01', endsAt: '2026-07-31' }),
    });
    expect(res.status).toBe(400);
    storage.close();
  });
});
