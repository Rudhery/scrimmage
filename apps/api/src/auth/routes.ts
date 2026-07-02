import { randomUUID } from 'node:crypto';
import type { Hono, MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { SessionStore } from './sessions.js';
import { buildAuthorizeUrl, fetchIdentity, type OAuthConfig } from './oauth.js';

export const SESSION_COOKIE = 'sid';
const STATE_COOKIE = 'oauth_state';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

/** Register the Discord OAuth login/callback/logout routes. */
export function registerAuth(app: Hono, sessions: SessionStore, config: OAuthConfig): void {
  app.get('/api/auth/login', (c) => {
    const state = randomUUID();
    setCookie(c, STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: config.cookieSecure,
      path: '/',
      maxAge: 300,
    });
    return c.redirect(buildAuthorizeUrl(config, state));
  });

  app.get('/api/auth/callback', async (c) => {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const expected = getCookie(c, STATE_COOKIE);
    deleteCookie(c, STATE_COOKIE, { path: '/' });

    if (!code || !state || !expected || state !== expected) {
      return c.text('Invalid OAuth state.', 400);
    }

    try {
      const { user, guilds } = await fetchIdentity(config, code);
      const id = sessions.create({
        user: {
          id: user.id,
          username: user.username,
          globalName: user.global_name ?? null,
          avatar: user.avatar ?? null,
        },
        guilds: guilds.map((guild) => ({
          id: guild.id,
          name: guild.name,
          icon: guild.icon ?? null,
          owner: guild.owner ?? false,
          permissions: guild.permissions ?? '0',
        })),
      });
      setCookie(c, SESSION_COOKIE, id, {
        httpOnly: true,
        sameSite: 'Lax',
        secure: config.cookieSecure,
        path: '/',
        maxAge: SESSION_MAX_AGE,
      });
      return c.redirect(config.postLoginRedirect);
    } catch {
      return c.text('Login failed. Please try again.', 502);
    }
  });

  app.post('/api/auth/logout', (c) => {
    sessions.delete(getCookie(c, SESSION_COOKIE));
    deleteCookie(c, SESSION_COOKIE, { path: '/' });
    return c.json({ ok: true });
  });
}

/**
 * Guard guild data routes: require a valid session and that the user is a member
 * of the guild being requested.
 */
export function requireGuildAccess(sessions: SessionStore): MiddlewareHandler {
  return async (c, next) => {
    const session = sessions.get(getCookie(c, SESSION_COOKIE));
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const guildId = c.req.param('guildId');
    if (!session.guilds.some((guild) => guild.id === guildId)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    return next();
  };
}

const MANAGE_GUILD = 1n << 5n;
const ADMINISTRATOR = 1n << 3n;

/**
 * Guard write routes: require the user to have "Manage Server" (or Administrator,
 * or be the owner) on the guild. When OAuth is disabled the API runs open, so the
 * guard is a no-op — handy for local development.
 */
export function requireManageServer(sessions: SessionStore, enabled: boolean): MiddlewareHandler {
  return async (c, next) => {
    if (!enabled) {
      return next();
    }
    const session = sessions.get(getCookie(c, SESSION_COOKIE));
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const guild = session.guilds.find((g) => g.id === c.req.param('guildId'));
    if (!guild) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    let permissions = 0n;
    try {
      permissions = BigInt(guild.permissions);
    } catch {
      permissions = 0n;
    }
    const canManage =
      guild.owner || (permissions & ADMINISTRATOR) !== 0n || (permissions & MANAGE_GUILD) !== 0n;
    if (!canManage) {
      return c.json({ error: 'You need the Manage Server permission.' }, 403);
    }
    return next();
  };
}
