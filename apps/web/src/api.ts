import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

export type ScrimmageStatus = 'proposed' | 'confirmed' | 'cancelled' | 'played';
export type TeamRole = 'coach' | 'assistant' | 'player';

export interface Team {
  id: string;
  guildId: string;
  name: string;
  tag: string;
  captainId: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: string;
}

export interface TeamRef {
  id: string;
  name: string;
  tag: string;
}

export interface ScrimmageAwards {
  offensive: string | null;
  defensive: string | null;
  overall: string | null;
}

export interface Scrimmage {
  id: string;
  guildId: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledAt: string;
  status: ScrimmageStatus;
  result: { homeScore: number; awayScore: number } | null;
  proposedBy: string;
  channelId: string | null;
  reminderSentAt: string | null;
  createdAt: string;
  homeTeam: TeamRef | null;
  awayTeam: TeamRef | null;
  awards?: ScrimmageAwards;
}

export interface Standing {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  team: TeamRef | null;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

async function sendJson<T>(url: string, method: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) {
        message = data.error;
      }
    } catch {
      /* keep the default message */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export interface AuthUser {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
}

export interface AuthGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface AuthMe {
  oauthConfigured: boolean;
  authenticated: boolean;
  user: AuthUser | null;
  guilds: AuthGuild[];
}

export function useAuth(): UseQueryResult<AuthMe> {
  return useQuery({
    queryKey: ['auth'],
    queryFn: () => getJson<AuthMe>('/api/auth/me'),
    staleTime: 60_000,
  });
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}

export function useTeams(guildId: string): UseQueryResult<Team[]> {
  return useQuery({
    queryKey: ['teams', guildId],
    queryFn: () => getJson<Team[]>(`/api/guilds/${encodeURIComponent(guildId)}/teams`),
  });
}

export function useScrimmages(
  guildId: string,
  status: ScrimmageStatus | 'all',
): UseQueryResult<Scrimmage[]> {
  return useQuery({
    queryKey: ['scrimmages', guildId, status],
    queryFn: () => {
      const query = status === 'all' ? '' : `?status=${status}`;
      return getJson<Scrimmage[]>(`/api/guilds/${encodeURIComponent(guildId)}/scrimmages${query}`);
    },
  });
}

export interface ScheduleScrimInput {
  homeTeamId: string;
  awayTeamId: string;
  scheduledAt: string;
}

function invalidateScrims(queryClient: ReturnType<typeof useQueryClient>, guildId: string): void {
  void queryClient.invalidateQueries({ queryKey: ['scrimmages', guildId] });
  void queryClient.invalidateQueries({ queryKey: ['overview', guildId] });
}

export function useScheduleScrim(
  guildId: string,
): UseMutationResult<Scrimmage, Error, ScheduleScrimInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ScheduleScrimInput) =>
      sendJson<Scrimmage>(`/api/guilds/${encodeURIComponent(guildId)}/scrimmages`, 'POST', input),
    onSuccess: () => invalidateScrims(queryClient, guildId),
  });
}

export function useRecordScrimResult(
  guildId: string,
): UseMutationResult<Scrimmage, Error, { id: string; homeScore: number; awayScore: number }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, homeScore, awayScore }) =>
      sendJson<Scrimmage>(
        `/api/guilds/${encodeURIComponent(guildId)}/scrimmages/${encodeURIComponent(id)}/result`,
        'POST',
        { homeScore, awayScore },
      ),
    onSuccess: () => invalidateScrims(queryClient, guildId),
  });
}

export function useCancelScrim(guildId: string): UseMutationResult<Scrimmage, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      sendJson<Scrimmage>(
        `/api/guilds/${encodeURIComponent(guildId)}/scrimmages/${encodeURIComponent(id)}/cancel`,
        'POST',
        {},
      ),
    onSuccess: () => invalidateScrims(queryClient, guildId),
  });
}

export function useSetScrimAwards(
  guildId: string,
): UseMutationResult<ScrimmageAwards, Error, { id: string } & Partial<ScrimmageAwards>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...awards }) =>
      sendJson<ScrimmageAwards>(
        `/api/guilds/${encodeURIComponent(guildId)}/scrimmages/${encodeURIComponent(id)}/awards`,
        'PUT',
        awards,
      ),
    onSuccess: () => invalidateScrims(queryClient, guildId),
  });
}

export function useStandings(guildId: string): UseQueryResult<Standing[]> {
  return useQuery({
    queryKey: ['standings', guildId],
    queryFn: () => getJson<Standing[]>(`/api/guilds/${encodeURIComponent(guildId)}/standings`),
  });
}

// --- Overview ---

export interface BotStatus {
  online: boolean;
  lastSeenAt: string | null;
}

export interface TeamActivity {
  team: TeamRef | null;
  matches: number;
  lastMatchAt: string | null;
}

export interface GuildOverview {
  bot: BotStatus;
  counts: {
    teams: number;
    scrimmages: { total: number; proposed: number; confirmed: number; played: number };
    championships: { total: number; active: number };
  };
  activeChampionships: Championship[];
  recentScrimmages: Scrimmage[];
  teamActivity: TeamActivity[];
}

export function useOverview(guildId: string): UseQueryResult<GuildOverview> {
  return useQuery({
    queryKey: ['overview', guildId],
    queryFn: () => getJson<GuildOverview>(`/api/guilds/${encodeURIComponent(guildId)}/overview`),
    refetchInterval: 30_000,
  });
}

// --- Championships ---

export type ChampionshipStatus = 'draft' | 'active' | 'completed';
export type MatchStatus = 'pending' | 'played';

export interface Championship {
  id: string;
  guildId: string;
  name: string;
  format: string;
  bestOf: number;
  startsAt: string;
  endsAt: string;
  status: ChampionshipStatus;
  createdAt: string;
}

export interface MatchSet {
  matchId: string;
  setNumber: number;
  homeScore: number;
  awayScore: number;
}

export interface Match {
  id: string;
  championshipId: string;
  round: number;
  position: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
  winnerTeamId: string | null;
  status: MatchStatus;
  nextMatchId: string | null;
  createdAt: string;
  sets: MatchSet[];
}

export interface ChampionshipEntrant {
  championshipId: string;
  teamId: string;
  seed: number;
  team: TeamRef | null;
}

export interface ChampionshipDetail {
  championship: Championship;
  teams: ChampionshipEntrant[];
  matches: Match[];
}

const guildKey = (guildId: string) => encodeURIComponent(guildId);

export function useChampionships(guildId: string): UseQueryResult<Championship[]> {
  return useQuery({
    queryKey: ['championships', guildId],
    queryFn: () => getJson<Championship[]>(`/api/guilds/${guildKey(guildId)}/championships`),
  });
}

export function useChampionship(
  guildId: string,
  champId: string,
): UseQueryResult<ChampionshipDetail> {
  return useQuery({
    queryKey: ['championship', guildId, champId],
    queryFn: () =>
      getJson<ChampionshipDetail>(
        `/api/guilds/${guildKey(guildId)}/championships/${encodeURIComponent(champId)}`,
      ),
  });
}

export interface CreateTeamInput {
  name: string;
  tag: string;
  description?: string;
  logoUrl?: string;
}

export function useCreateTeam(guildId: string): UseMutationResult<Team, Error, CreateTeamInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTeamInput) =>
      sendJson<Team>(`/api/guilds/${guildKey(guildId)}/teams`, 'POST', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams', guildId] }),
  });
}

export interface UpdateTeamInput {
  teamId: string;
  name?: string;
  tag?: string;
  logoUrl?: string | null;
}

export function useUpdateTeam(guildId: string): UseMutationResult<Team, Error, UpdateTeamInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, ...patch }: UpdateTeamInput) =>
      sendJson<Team>(
        `/api/guilds/${guildKey(guildId)}/teams/${encodeURIComponent(teamId)}`,
        'PATCH',
        patch,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams', guildId] }),
  });
}

export interface CreateChampionshipInput {
  name: string;
  bestOf: number;
  startsAt: string;
  endsAt: string;
}

export function useCreateChampionship(
  guildId: string,
): UseMutationResult<Championship, Error, CreateChampionshipInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChampionshipInput) =>
      sendJson<Championship>(`/api/guilds/${guildKey(guildId)}/championships`, 'POST', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['championships', guildId] }),
  });
}

/** Seed the teams and immediately draw the bracket. */
export function useDrawBracket(
  guildId: string,
  champId: string,
): UseMutationResult<Championship, Error, string[]> {
  const queryClient = useQueryClient();
  const base = `/api/guilds/${guildKey(guildId)}/championships/${encodeURIComponent(champId)}`;
  return useMutation({
    mutationFn: async (teamIds: string[]) => {
      await sendJson(`${base}/teams`, 'PUT', { teamIds });
      return sendJson<Championship>(`${base}/bracket`, 'POST', {});
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['championship', guildId, champId] }),
  });
}

export interface RecordSetsInput {
  matchId: string;
  sets: Array<{ homeScore: number; awayScore: number }>;
}

export function useRecordSets(
  guildId: string,
  champId: string,
): UseMutationResult<Match, Error, RecordSetsInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, sets }: RecordSetsInput) =>
      sendJson<Match>(
        `/api/guilds/${guildKey(guildId)}/matches/${encodeURIComponent(matchId)}/sets`,
        'POST',
        {
          sets,
        },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['championship', guildId, champId] }),
  });
}

const MANAGE_GUILD = 1n << 5n;
const ADMINISTRATOR = 1n << 3n;

/** A sandbox guild for trying every feature without Discord login. */
export const TEST_GUILD = 'teste';

/** Whether the current user may manage this guild (create teams, run championships). */
export function useCanManage(guildId: string): boolean {
  const { data } = useAuth();
  if (guildId === TEST_GUILD) {
    return true; // sandbox: everything is editable
  }
  if (!data) {
    return false;
  }
  if (!data.oauthConfigured) {
    return true; // open mode (local dev)
  }
  const guild = data.guilds.find((g) => g.id === guildId);
  if (!guild) {
    return false;
  }
  if (guild.owner) {
    return true;
  }
  try {
    const permissions = BigInt(guild.permissions);
    return (permissions & ADMINISTRATOR) !== 0n || (permissions & MANAGE_GUILD) !== 0n;
  } catch {
    return false;
  }
}
