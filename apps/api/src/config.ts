import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';
import type { OAuthConfig } from './auth/oauth.js';

function findEnvFile(start: string): string | undefined {
  let dir = start;
  for (;;) {
    const candidate = join(dir, '.env');
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return undefined;
    }
    dir = parent;
  }
}

const envFile = findEnvFile(process.cwd());
loadDotenv(envFile ? { path: envFile } : undefined);

const schema = z.object({
  DATABASE_PATH: z.string().min(1).default('./scrimmage.sqlite'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  // Origin allowed by CORS — the Vite dev server by default.
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  // Discord OAuth (optional): login is enabled only when both id and secret are set.
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  OAUTH_REDIRECT_URI: z.string().default('http://localhost:5173/api/auth/callback'),
  POST_LOGIN_REDIRECT: z.string().default('/'),
});

export interface ApiConfig {
  readonly databasePath: string;
  readonly port: number;
  readonly webOrigin: string;
  /** OAuth settings, or `null` when Discord login is not configured. */
  readonly oauth: OAuthConfig | null;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const data = parsed.data;
  const oauth: OAuthConfig | null =
    data.DISCORD_CLIENT_ID && data.DISCORD_CLIENT_SECRET
      ? {
          clientId: data.DISCORD_CLIENT_ID,
          clientSecret: data.DISCORD_CLIENT_SECRET,
          redirectUri: data.OAUTH_REDIRECT_URI,
          postLoginRedirect: data.POST_LOGIN_REDIRECT,
          cookieSecure: data.OAUTH_REDIRECT_URI.startsWith('https://'),
        }
      : null;

  return {
    databasePath: data.DATABASE_PATH,
    port: data.API_PORT,
    webOrigin: data.WEB_ORIGIN,
    oauth,
  };
}
