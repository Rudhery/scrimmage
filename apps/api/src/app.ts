import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie } from 'hono/cookie';
import {
  ScrimmageService,
  StandingsService,
  TeamService,
  type ScrimmageStatus,
  type Storage,
  type Team,
} from '@scrimmage/core';
import type { OAuthConfig } from './auth/oauth.js';
import { SessionStore } from './auth/sessions.js';
import { registerAuth, requireGuildAccess, SESSION_COOKIE } from './auth/routes.js';

export interface AppOptions {
  readonly webOrigin: string;
  /** OAuth settings, or `null`/absent to run open (no login required). */
  readonly oauth?: OAuthConfig | null;
  /** Session store (injectable for tests). */
  readonly sessions?: SessionStore;
}

/** A compact reference to a team, embedded in scrimmage/standings responses. */
function teamRef(team: Team | undefined): { id: string; name: string; tag: string } | null {
  return team ? { id: team.id, name: team.name, tag: team.tag } : null;
}

/**
 * Build the read-only HTTP API. It reuses the exact same `@scrimmage/core`
 * services the bot uses — the only difference is the front-end. When OAuth is
 * configured, guild data routes require a logged-in member of that guild.
 */
export function createApp(storage: Storage, options: AppOptions): Hono {
  const teams = new TeamService(storage.teams);
  const scrimmages = new ScrimmageService(storage.scrimmages, storage.teams);
  const standings = new StandingsService(storage.scrimmages);

  const oauth = options.oauth ?? null;
  const sessions = options.sessions ?? new SessionStore();

  const app = new Hono();
  app.use('/api/*', cors({ origin: options.webOrigin, credentials: true }));

  app.get('/api/health', (c) => c.json({ status: 'ok' }));

  app.get('/api/auth/me', (c) => {
    const session = oauth ? sessions.get(getCookie(c, SESSION_COOKIE)) : null;
    return c.json({
      oauthConfigured: oauth !== null,
      authenticated: session !== null,
      user: session?.user ?? null,
      guilds: session?.guilds ?? [],
    });
  });

  if (oauth) {
    registerAuth(app, sessions, oauth);
    // Everything under a specific guild requires a member session.
    app.use('/api/guilds/:guildId/*', requireGuildAccess(sessions));
  }

  app.get('/api/guilds/:guildId/teams', async (c) => {
    return c.json(await teams.listTeams(c.req.param('guildId')));
  });

  app.get('/api/guilds/:guildId/teams/:teamId', async (c) => {
    const { guildId, teamId } = c.req.param();
    const team = await storage.teams.findById(guildId, teamId);
    if (!team) {
      return c.json({ error: 'Team not found.' }, 404);
    }
    const [roster, standing] = await Promise.all([
      teams.getRoster(team.id),
      standings.forTeam(guildId, team.id),
    ]);
    return c.json({ team, roster, standing });
  });

  app.get('/api/guilds/:guildId/scrimmages', async (c) => {
    const guildId = c.req.param('guildId');
    const status = c.req.query('status') as ScrimmageStatus | undefined;
    const [list, allTeams] = await Promise.all([
      scrimmages.list(guildId, status ? { status } : undefined),
      teams.listTeams(guildId),
    ]);
    const byId = new Map(allTeams.map((team) => [team.id, team]));
    return c.json(
      list.map((scrimmage) => ({
        ...scrimmage,
        homeTeam: teamRef(byId.get(scrimmage.homeTeamId)),
        awayTeam: teamRef(byId.get(scrimmage.awayTeamId)),
      })),
    );
  });

  app.get('/api/guilds/:guildId/standings', async (c) => {
    const guildId = c.req.param('guildId');
    const [table, allTeams] = await Promise.all([
      standings.forGuild(guildId),
      teams.listTeams(guildId),
    ]);
    const byId = new Map(allTeams.map((team) => [team.id, team]));
    return c.json(
      table.map((standing) => ({ ...standing, team: teamRef(byId.get(standing.teamId)) })),
    );
  });

  return app;
}
