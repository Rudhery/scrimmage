import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

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
});

export interface ApiConfig {
  readonly databasePath: string;
  readonly port: number;
  readonly webOrigin: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return {
    databasePath: parsed.data.DATABASE_PATH,
    port: parsed.data.API_PORT,
    webOrigin: parsed.data.WEB_ORIGIN,
  };
}
