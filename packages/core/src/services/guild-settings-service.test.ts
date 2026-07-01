import { describe, expect, it } from 'vitest';
import { GuildSettingsService } from './guild-settings-service.js';
import { createMemoryStorage } from '../testing/memory-storage.js';

describe('GuildSettingsService', () => {
  it('returns defaults for an unconfigured guild', async () => {
    const service = new GuildSettingsService(createMemoryStorage().guildSettings);
    expect(await service.get('g')).toEqual({
      guildId: 'g',
      announceChannelId: null,
      language: null,
    });
  });

  it('sets and clears the announce channel', async () => {
    const service = new GuildSettingsService(createMemoryStorage().guildSettings);

    const set = await service.setAnnounceChannel('g', 'chan-1');
    expect(set.announceChannelId).toBe('chan-1');
    expect((await service.get('g')).announceChannelId).toBe('chan-1');

    const cleared = await service.setAnnounceChannel('g', null);
    expect(cleared.announceChannelId).toBeNull();
  });

  it('sets and clears the language, preserving other settings', async () => {
    const service = new GuildSettingsService(createMemoryStorage().guildSettings);

    await service.setAnnounceChannel('g', 'chan-1');
    const set = await service.setLanguage('g', 'pt-BR');
    expect(set.language).toBe('pt-BR');
    expect(set.announceChannelId).toBe('chan-1');

    const cleared = await service.setLanguage('g', null);
    expect(cleared.language).toBeNull();
  });
});
