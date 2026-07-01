import type { Team, TeamMember, TeamRole } from '../domain/team.js';
import type { Scrimmage } from '../domain/scrimmage.js';
import type { GuildSettings } from '../domain/guild-settings.js';
import type {
  GuildSettingsRepository,
  ScrimmageFilter,
  ScrimmageRepository,
  Storage,
  TeamRepository,
} from '../storage/repositories.js';

/**
 * In-memory storage backend used by the test suite and quick experiments.
 *
 * It is intentionally not part of the public package surface — production
 * backends live in dedicated `@scrimmage/storage-*` packages.
 */
class MemoryTeamRepository implements TeamRepository {
  private readonly teams = new Map<string, Team>();
  private readonly members: TeamMember[] = [];

  async create(team: Team): Promise<Team> {
    this.teams.set(team.id, team);
    return team;
  }

  async update(team: Team): Promise<Team> {
    this.teams.set(team.id, team);
    return team;
  }

  async findById(guildId: string, id: string): Promise<Team | null> {
    const team = this.teams.get(id);
    return team && team.guildId === guildId ? team : null;
  }

  async findByName(guildId: string, name: string): Promise<Team | null> {
    const wanted = name.toLowerCase();
    for (const team of this.teams.values()) {
      if (team.guildId === guildId && team.name.toLowerCase() === wanted) {
        return team;
      }
    }
    return null;
  }

  async list(guildId: string): Promise<Team[]> {
    return [...this.teams.values()].filter((team) => team.guildId === guildId);
  }

  async delete(guildId: string, id: string): Promise<void> {
    const team = this.teams.get(id);
    if (!team || team.guildId !== guildId) {
      return;
    }
    this.teams.delete(id);
    for (let i = this.members.length - 1; i >= 0; i--) {
      if (this.members[i]?.teamId === id) {
        this.members.splice(i, 1);
      }
    }
  }

  async addMember(member: TeamMember): Promise<void> {
    this.members.push(member);
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    const index = this.members.findIndex((m) => m.teamId === teamId && m.userId === userId);
    if (index >= 0) {
      this.members.splice(index, 1);
    }
  }

  async setMemberRole(teamId: string, userId: string, role: TeamRole): Promise<void> {
    const index = this.members.findIndex((m) => m.teamId === teamId && m.userId === userId);
    const current = this.members[index];
    if (current) {
      this.members[index] = { ...current, role };
    }
  }

  async findMember(teamId: string, userId: string): Promise<TeamMember | null> {
    return this.members.find((m) => m.teamId === teamId && m.userId === userId) ?? null;
  }

  async listMembers(teamId: string): Promise<TeamMember[]> {
    return this.members.filter((m) => m.teamId === teamId);
  }
}

class MemoryScrimmageRepository implements ScrimmageRepository {
  private readonly scrimmages = new Map<string, Scrimmage>();

  async create(scrimmage: Scrimmage): Promise<Scrimmage> {
    this.scrimmages.set(scrimmage.id, scrimmage);
    return scrimmage;
  }

  async findById(guildId: string, id: string): Promise<Scrimmage | null> {
    const scrimmage = this.scrimmages.get(id);
    return scrimmage && scrimmage.guildId === guildId ? scrimmage : null;
  }

  async list(guildId: string, filter?: ScrimmageFilter): Promise<Scrimmage[]> {
    let items = [...this.scrimmages.values()].filter((s) => s.guildId === guildId);
    if (filter?.status) {
      items = items.filter((s) => s.status === filter.status);
    }
    if (filter?.teamId) {
      items = items.filter((s) => s.homeTeamId === filter.teamId || s.awayTeamId === filter.teamId);
    }
    return items;
  }

  async update(scrimmage: Scrimmage): Promise<Scrimmage> {
    this.scrimmages.set(scrimmage.id, scrimmage);
    return scrimmage;
  }

  async listDueReminders(before: Date): Promise<Scrimmage[]> {
    return [...this.scrimmages.values()].filter(
      (s) =>
        s.status === 'confirmed' &&
        s.reminderSentAt === null &&
        s.scheduledAt.getTime() <= before.getTime(),
    );
  }
}

class MemoryGuildSettingsRepository implements GuildSettingsRepository {
  private readonly settings = new Map<string, GuildSettings>();

  async get(guildId: string): Promise<GuildSettings | null> {
    return this.settings.get(guildId) ?? null;
  }

  async upsert(settings: GuildSettings): Promise<GuildSettings> {
    this.settings.set(settings.guildId, settings);
    return settings;
  }
}

/** Create a fresh, empty in-memory {@link Storage}. */
export function createMemoryStorage(): Storage {
  return {
    teams: new MemoryTeamRepository(),
    scrimmages: new MemoryScrimmageRepository(),
    guildSettings: new MemoryGuildSettingsRepository(),
    close() {
      /* nothing to release */
    },
  };
}
