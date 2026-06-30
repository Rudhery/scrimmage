import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { config as loadDotenv } from 'dotenv';

/**
 * Side-effect module: loads the nearest `.env` into `process.env`.
 *
 * It walks up from the current working directory until it finds a `.env`, so the
 * bot picks up a single repo-root `.env` whether it is started from the repo root
 * or from its own workspace folder. Import this once, before reading any config.
 */
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
