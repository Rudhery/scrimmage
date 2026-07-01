import { describe, expect, it } from 'vitest';
import { createSqliteStorage } from '@scrimmage/storage-sqlite';
import { createApp } from '../app.js';
import { SessionStore } from './sessions.js';
import type { OAuthConfig } from './oauth.js';

const OAUTH: OAuthConfig = {
  clientId: 'id',
  clientSecret: 'secret',
  redirectUri: 'http://localhost:5173/api/auth/callback',
  postLoginRedirect: '/',
  cookieSecure: false,
};

function setup(withOAuth: boolean) {
  const storage = createSqliteStorage({ path: ':memory:', migrate: true });
  const sessions = new SessionStore();
  const app = createApp(storage, {
    webOrigin: '*',
    oauth: withOAuth ? OAUTH : null,
    sessions,
  });
  return { storage, sessions, app };
}

function seedSession(sessions: SessionStore, guildIds: string[]): string {
  return sessions.create({
    user: { id: 'u1', username: 'user', globalName: null, avatar: null },
    guilds: guildIds.map((id) => ({ id, name: id, icon: null, owner: false, permissions: '0' })),
  });
}

describe('auth', () => {
  it('reports OAuth status via /api/auth/me', async () => {
    const { storage, app } = setup(true);
    const body = (await (await app.request('/api/auth/me')).json()) as {
      oauthConfigured: boolean;
      authenticated: boolean;
    };
    expect(body.oauthConfigured).toBe(true);
    expect(body.authenticated).toBe(false);
    storage.close();
  });

  it('rejects guild data without a session', async () => {
    const { storage, app } = setup(true);
    expect((await app.request('/api/guilds/g/teams')).status).toBe(401);
    storage.close();
  });

  it('forbids guilds the user is not a member of', async () => {
    const { storage, sessions, app } = setup(true);
    const sid = seedSession(sessions, ['other']);
    const res = await app.request('/api/guilds/g/teams', { headers: { Cookie: `sid=${sid}` } });
    expect(res.status).toBe(403);
    storage.close();
  });

  it('allows members of the requested guild', async () => {
    const { storage, sessions, app } = setup(true);
    const sid = seedSession(sessions, ['g']);
    const res = await app.request('/api/guilds/g/teams', { headers: { Cookie: `sid=${sid}` } });
    expect(res.status).toBe(200);
    storage.close();
  });

  it('stays open when OAuth is not configured', async () => {
    const { storage, app } = setup(false);
    expect((await app.request('/api/guilds/g/teams')).status).toBe(200);
    storage.close();
  });
});
