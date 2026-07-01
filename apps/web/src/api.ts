import { useQuery, type UseQueryResult } from '@tanstack/react-query';

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
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
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

export function useStandings(guildId: string): UseQueryResult<Standing[]> {
  return useQuery({
    queryKey: ['standings', guildId],
    queryFn: () => getJson<Standing[]>(`/api/guilds/${encodeURIComponent(guildId)}/standings`),
  });
}
