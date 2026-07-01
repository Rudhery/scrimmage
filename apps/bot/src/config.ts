import { z } from 'zod';

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required.'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required.'),
  DISCORD_GUILD_ID: z.string().optional(),
  DATABASE_PATH: z.string().min(1).default('./scrimmage.sqlite'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  REMINDER_LEAD_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
  REMINDER_POLL_SECONDS: z.coerce.number().int().min(15).max(3600).default(60),
});

export interface Config {
  readonly discordToken: string;
  readonly discordClientId: string;
  readonly discordGuildId?: string;
  readonly databasePath: string;
  readonly logLevel: z.infer<typeof envSchema>['LOG_LEVEL'];
  /** How long before kickoff to send the reminder, in milliseconds. */
  readonly reminderLeadMs: number;
  /** How often the reminder loop checks for due scrimmages, in milliseconds. */
  readonly reminderPollMs: number;
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
    reminderLeadMs: env_.REMINDER_LEAD_MINUTES * 60_000,
    reminderPollMs: env_.REMINDER_POLL_SECONDS * 1000,
  };
}
