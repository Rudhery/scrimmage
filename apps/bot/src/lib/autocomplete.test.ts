import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrimmageService, ScrimmageStatus, TeamService, type Storage } from '@scrimmage/core';
import { createSqliteStorage } from '@scrimmage/storage-sqlite';
import type { AutocompleteInteraction } from 'discord.js';
import type { AppContext } from '../context.js';
import { respondScrimmageIds, respondTeamNames } from './autocomplete.js';

function fakeAutocomplete(guildId: string | null, focused: string) {
  const respond = vi.fn();
  const interaction = {
    guildId,
    options: { getFocused: () => focused },
    respond,
  } as unknown as AutocompleteInteraction;
  return { interaction, respond };
}

describe('autocomplete responders', () => {
  let storage: Storage;
  let teams: TeamService;
  let scrims: ScrimmageService;
  let context: AppContext;

  beforeEach(() => {
    storage = createSqliteStorage({ path: ':memory:', migrate: true });
    teams = new TeamService(storage.teams);
    scrims = new ScrimmageService(storage.scrimmages, storage.teams);
    context = { teams, scrimmages: scrims } as unknown as AppContext;
  });

  afterEach(async () => {
    await storage.close();
  });

  it('suggests team names filtered by the query', async () => {
    await teams.createTeam({ guildId: 'g', name: 'Red Dragons', tag: 'RDG', captainId: 'a' });
    await teams.createTeam({ guildId: 'g', name: 'Blue Wolves', tag: 'BLU', captainId: 'b' });

    const { interaction, respond } = fakeAutocomplete('g', 'red');
    await respondTeamNames(interaction, context);

    expect(respond).toHaveBeenCalledWith([{ name: 'Red Dragons [RDG]', value: 'Red Dragons' }]);
  });

  it('suggests nothing outside a guild', async () => {
    const { interaction, respond } = fakeAutocomplete(null, '');
    await respondTeamNames(interaction, context);
    expect(respond).toHaveBeenCalledWith([]);
  });

  it('only suggests scrimmages that match the eligibility predicate', async () => {
    const home = await teams.createTeam({ guildId: 'g', name: 'Home', tag: 'HOM', captainId: 'a' });
    const away = await teams.createTeam({ guildId: 'g', name: 'Away', tag: 'AWY', captainId: 'b' });
    const future = new Date(Date.now() + 86_400_000);
    const base = { guildId: 'g', homeTeamId: home.id, awayTeamId: away.id, proposedBy: 'a' };

    await scrims.propose({ ...base, scheduledAt: future });
    const confirmed = await scrims.propose({ ...base, scheduledAt: future });
    await scrims.confirm('g', confirmed.id);

    const { interaction, respond } = fakeAutocomplete('g', '');
    await respondScrimmageIds(
      interaction,
      context,
      (scrim) => scrim.status === ScrimmageStatus.Confirmed,
    );

    const choices = respond.mock.calls.at(0)?.at(0) as { value: string }[] | undefined;
    expect(choices).toHaveLength(1);
    expect(choices?.[0]?.value).toBe(confirmed.id);
  });
});
