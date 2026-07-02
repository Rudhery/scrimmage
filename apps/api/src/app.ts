import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie } from 'hono/cookie';
import {
  BotStatusService,
  ChampionshipService,
  GuildSettingsService,
  ScrimmageService,
  StandingsService,
  TeamService,
  ConflictError,
  InvalidStateError,
  NotFoundError,
  ScrimmageError,
  ValidationError,
  type ScrimmageStatus,
  type Storage,
  type Team,
} from '@scrimmage/core';
import type { Context } from 'hono';
import type { OAuthConfig } from './auth/oauth.js';
import { SessionStore } from './auth/sessions.js';
import {
  registerAuth,
  requireGuildAccess,
  requireManageServer,
  SESSION_COOKIE,
} from './auth/routes.js';

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

/** Map a thrown domain error to an HTTP response. */
function fail(c: Context, error: unknown): Response {
  if (error instanceof ValidationError) {
    return c.json({ error: error.message, issues: error.issues }, 400);
  }
  if (error instanceof NotFoundError) {
    return c.json({ error: error.message }, 404);
  }
  if (error instanceof ConflictError || error instanceof InvalidStateError) {
    return c.json({ error: error.message }, 409);
  }
  if (error instanceof ScrimmageError) {
    return c.json({ error: error.message }, 400);
  }
  return c.json({ error: 'Something went wrong.' }, 500);
}

/** Parse an ISO date string, throwing a ValidationError if it is invalid. */
function parseDate(value: unknown, field: string): Date {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`Invalid ${field}.`);
  }
  return date;
}

/**
 * Build the read-only HTTP API. It reuses the exact same `@scrimmage/core`
 * services the bot uses — the only difference is the front-end. When OAuth is
 * configured, guild data routes require a logged-in member of that guild.
 */
export function createApp(storage: Storage, options: AppOptions): Hono {
  const teams = new TeamService(storage.teams);
  const scrimmages = new ScrimmageService(storage.scrimmages, storage.teams);
  const standings = new StandingsService(
    storage.scrimmages,
    new GuildSettingsService(storage.guildSettings),
  );
  const championships = new ChampionshipService(storage.championships);
  const botStatus = new BotStatusService(storage.botPresence);

  const oauth = options.oauth ?? null;
  const sessions = options.sessions ?? new SessionStore();
  const canManage = requireManageServer(sessions, oauth !== null);

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

  // --- Overview (server panorama) ---

  app.get('/api/guilds/:guildId/overview', async (c) => {
    const guildId = c.req.param('guildId');
    const [bot, allTeams, allScrims, allChamps] = await Promise.all([
      botStatus.statusFor(guildId),
      teams.listTeams(guildId),
      scrimmages.list(guildId),
      championships.listChampionships(guildId),
    ]);
    const byId = new Map(allTeams.map((team) => [team.id, team]));
    const withRefs = (scrimmage: (typeof allScrims)[number]) => ({
      ...scrimmage,
      homeTeam: teamRef(byId.get(scrimmage.homeTeamId)),
      awayTeam: teamRef(byId.get(scrimmage.awayTeamId)),
    });

    const recentScrimmages = [...allScrims]
      .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
      .slice(0, 5)
      .map(withRefs);

    const teamActivity = allTeams
      .map((team) => {
        const involved = allScrims.filter(
          (s) => s.homeTeamId === team.id || s.awayTeamId === team.id,
        );
        const lastMatchAt = involved.reduce<Date | null>((latest, s) => {
          return !latest || s.scheduledAt.getTime() > latest.getTime() ? s.scheduledAt : latest;
        }, null);
        return { team: teamRef(team), matches: involved.length, lastMatchAt };
      })
      .sort((a, b) => b.matches - a.matches);

    return c.json({
      bot,
      counts: {
        teams: allTeams.length,
        scrimmages: {
          total: allScrims.length,
          proposed: allScrims.filter((s) => s.status === 'proposed').length,
          confirmed: allScrims.filter((s) => s.status === 'confirmed').length,
          played: allScrims.filter((s) => s.status === 'played').length,
        },
        championships: {
          total: allChamps.length,
          active: allChamps.filter((ch) => ch.status === 'active').length,
        },
      },
      activeChampionships: allChamps.filter((ch) => ch.status === 'active'),
      recentScrimmages,
      teamActivity,
    });
  });

  // --- Championships (read) ---

  app.get('/api/guilds/:guildId/championships', async (c) => {
    return c.json(await championships.listChampionships(c.req.param('guildId')));
  });

  app.get('/api/guilds/:guildId/championships/:champId', async (c) => {
    const { guildId, champId } = c.req.param();
    try {
      const championship = await championships.getChampionship(guildId, champId);
      const [entrants, matchList, allTeams] = await Promise.all([
        championships.listTeams(champId),
        championships.listMatches(champId),
        teams.listTeams(guildId),
      ]);
      const byId = new Map(allTeams.map((team) => [team.id, team]));
      const seededTeams = entrants
        .sort((a, b) => a.seed - b.seed)
        .map((entrant) => ({ ...entrant, team: teamRef(byId.get(entrant.teamId)) }));
      const bracket = await Promise.all(
        matchList
          .sort((a, b) => a.round - b.round || a.position - b.position)
          .map(async (match) => ({
            ...match,
            sets: (await championships.getMatch(match.id)).sets,
          })),
      );
      return c.json({ championship, teams: seededTeams, matches: bracket });
    } catch (error) {
      return fail(c, error);
    }
  });

  // --- Teams & championships (write; requires Manage Server when OAuth is on) ---

  app.post('/api/guilds/:guildId/teams', canManage, async (c) => {
    const guildId = c.req.param('guildId');
    const session = oauth ? sessions.get(getCookie(c, SESSION_COOKIE)) : null;
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    try {
      const team = await teams.createTeam({
        guildId,
        name: String(body.name ?? ''),
        tag: String(body.tag ?? ''),
        captainId: session?.user.id ?? String(body.captainId ?? '0'),
        description: body.description ? String(body.description) : undefined,
        logoUrl: body.logoUrl ? String(body.logoUrl) : undefined,
      });
      return c.json(team, 201);
    } catch (error) {
      return fail(c, error);
    }
  });

  app.post('/api/guilds/:guildId/championships', canManage, async (c) => {
    const guildId = c.req.param('guildId');
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    try {
      const championship = await championships.createChampionship(guildId, {
        name: String(body.name ?? ''),
        bestOf: Number(body.bestOf),
        startsAt: parseDate(body.startsAt, 'start date'),
        endsAt: parseDate(body.endsAt, 'end date'),
      });
      return c.json(championship, 201);
    } catch (error) {
      return fail(c, error);
    }
  });

  app.put('/api/guilds/:guildId/championships/:champId/teams', canManage, async (c) => {
    const { guildId, champId } = c.req.param();
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const teamIds = Array.isArray(body.teamIds) ? body.teamIds.map((id) => String(id)) : [];
    try {
      return c.json(await championships.setTeams(guildId, champId, teamIds));
    } catch (error) {
      return fail(c, error);
    }
  });

  app.post('/api/guilds/:guildId/championships/:champId/bracket', canManage, async (c) => {
    const { guildId, champId } = c.req.param();
    try {
      return c.json(await championships.generateBracket(guildId, champId));
    } catch (error) {
      return fail(c, error);
    }
  });

  app.post('/api/guilds/:guildId/matches/:matchId/sets', canManage, async (c) => {
    const { guildId, matchId } = c.req.param();
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const rawSets = Array.isArray(body.sets) ? body.sets : [];
    const sets = rawSets.map((entry) => {
      const set = entry as Record<string, unknown>;
      return { homeScore: Number(set.homeScore), awayScore: Number(set.awayScore) };
    });
    try {
      return c.json(await championships.recordSets(guildId, matchId, sets));
    } catch (error) {
      return fail(c, error);
    }
  });

  return app;
}
