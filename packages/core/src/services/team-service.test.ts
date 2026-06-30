import { beforeEach, describe, expect, it } from 'vitest';
import { TeamService } from './team-service.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors/index.js';
import { createMemoryStorage } from '../testing/memory-storage.js';
import type { Storage } from '../storage/repositories.js';

const GUILD = 'guild-1';
const CAPTAIN = 'user-captain';

describe('TeamService', () => {
  let storage: Storage;
  let service: TeamService;
  let counter: number;

  beforeEach(() => {
    storage = createMemoryStorage();
    counter = 0;
    service = new TeamService(storage.teams, {
      now: () => new Date('2030-01-01T00:00:00.000Z'),
      generateId: () => `team-${++counter}`,
    });
  });

  const baseInput = () => ({ guildId: GUILD, name: 'Red Dragons', tag: 'rdg', captainId: CAPTAIN });

  it('creates a team, upper-cases the tag and adds the captain as a member', async () => {
    const team = await service.createTeam(baseInput());

    expect(team.id).toBe('team-1');
    expect(team.tag).toBe('RDG');
    expect(team.captainId).toBe(CAPTAIN);

    const roster = await service.getRoster(team.id);
    expect(roster).toHaveLength(1);
    expect(roster[0]?.userId).toBe(CAPTAIN);
  });

  it('rejects a duplicate team name within the same guild', async () => {
    await service.createTeam(baseInput());
    await expect(service.createTeam(baseInput())).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects an invalid tag', async () => {
    await expect(service.createTeam({ ...baseInput(), tag: '@@' })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('throws when fetching an unknown team', async () => {
    await expect(service.getTeam(GUILD, 'missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('deletes a team', async () => {
    const team = await service.createTeam(baseInput());
    await service.deleteTeam(GUILD, team.id);
    await expect(service.getTeam(GUILD, team.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('adds and removes members, but protects the captain', async () => {
    const team = await service.createTeam(baseInput());

    await service.addMember(GUILD, team.id, 'user-2');
    expect(await service.getRoster(team.id)).toHaveLength(2);

    await expect(service.addMember(GUILD, team.id, 'user-2')).rejects.toBeInstanceOf(ConflictError);

    await service.removeMember(GUILD, team.id, 'user-2');
    expect(await service.getRoster(team.id)).toHaveLength(1);

    await expect(service.removeMember(GUILD, team.id, CAPTAIN)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('renames a team and rejects clashing names', async () => {
    const team = await service.createTeam(baseInput());
    const renamed = await service.renameTeam(GUILD, team.id, 'Blue Wolves');
    expect(renamed.name).toBe('Blue Wolves');

    await service.createTeam({ ...baseInput(), name: 'Green Owls', tag: 'GRN' });
    await expect(service.renameTeam(GUILD, team.id, 'Green Owls')).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('transfers captaincy, adding the new captain to the roster if needed', async () => {
    const team = await service.createTeam(baseInput());

    const updated = await service.transferCaptain(GUILD, team.id, 'user-9');
    expect(updated.captainId).toBe('user-9');
    expect((await service.getRoster(team.id)).map((member) => member.userId)).toContain('user-9');

    await expect(service.transferCaptain(GUILD, team.id, 'user-9')).rejects.toBeInstanceOf(
      ConflictError,
    );
  });
});
