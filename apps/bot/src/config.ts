import { z } from 'zod';

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required.'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required.'),
  DISCORD_GUILD_ID: z.string().optional(),
  DATABASE_PATH: z.string().min(1).default('./scrimmage.sqlite'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

export interface Config {
  readonly discordToken: string;
  readonly discordClientId: string;
  readonly discordGuildId?: string;
  readonly databasePath: string;
  readonly logLevel: z.infer<typeof envSchema>['LOG_LEVEL'];
}

/**
 * Load and validate configuration from the environment. Throws a readable error
 * listing every problem at once rather than failing on the first missing value.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const env_ = parsed.data;
  return {
    discordToken: env_.DISCORD_TOKEN,
    discordClientId: env_.DISCORD_CLIENT_ID,
    discordGuildId: env_.DISCORD_GUILD_ID,
    databasePath: env_.DATABASE_PATH,
    logLevel: env_.LOG_LEVEL,
  };
}
