import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

const base = { DISCORD_TOKEN: 'token', DISCORD_CLIENT_ID: 'client' } satisfies NodeJS.ProcessEnv;

describe('loadConfig', () => {
  it('loads a valid configuration and applies defaults', () => {
    const config = loadConfig(base);
    expect(config.discordToken).toBe('token');
    expect(config.discordClientId).toBe('client');
    expect(config.databasePath).toBe('./scrimmage.sqlite');
    expect(config.logLevel).toBe('info');
  });

  it('throws a descriptive error when required variables are missing', () => {
    expect(() => loadConfig({})).toThrow(/DISCORD_TOKEN/);
  });

  it('rejects an invalid log level', () => {
    expect(() => loadConfig({ ...base, LOG_LEVEL: 'verbose' })).toThrow();
  });
});
