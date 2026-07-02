import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useCanManage,
  useChampionship,
  useDrawBracket,
  useRecordSets,
  useTeams,
  type ChampionshipDetail,
  type Match,
  type TeamRef,
} from '../api';
import { Panel, SectionTitle, StateBlock } from '../components/ui';
import { ChampBadge } from './ChampionshipsPage';

const inputClass =
  'w-16 rounded-md border border-line bg-surface2 px-2 py-1 text-center text-sm text-fg outline-none focus:border-lime/60';
const primaryButton =
  'rounded-lg bg-lime px-4 py-2 text-sm font-bold text-ink transition hover:brightness-110 disabled:opacity-50';
const ghostButton =
  'rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-fg';

export default function ChampionshipDetailPage() {
  const { guildId = '', champId = '' } = useParams();
  const { data, isLoading, isError } = useChampionship(guildId, champId);
  const canManage = useCanManage(guildId);

  if (isLoading) return <StateBlock title="Loading championship…" />;
  if (isError || !data) return <StateBlock title="Couldn't load this championship" />;

  const { championship } = data;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to=".." relative="path" className="text-sm text-muted hover:text-fg">
            ← Cups
          </Link>
          <SectionTitle label={championship.name} />
          <ChampBadge status={championship.status} />
        </div>
        <span className="font-mono text-xs text-muted">best of {championship.bestOf}</span>
      </div>

      {championship.status === 'draft' ? (
        <Seeding guildId={guildId} champId={champId} canManage={canManage} />
      ) : (
        <Bracket data={data} guildId={guildId} champId={champId} canManage={canManage} />
      )}
    </section>
  );
}

// --- Draft: pick and order the teams, then draw the bracket ---

function Seeding({
  guildId,
  champId,
  canManage,
}: {
  guildId: string;
  champId: string;
  canManage: boolean;
}) {
  const { data: teams } = useTeams(guildId);
  const draw = useDrawBracket(guildId, champId);
  const [selected, setSelected] = useState<string[]>([]);

  if (!canManage) {
    return (
      <StateBlock
        title="This championship hasn't started"
        hint="A manager will draw the bracket."
      />
    );
  }

  const byId = new Map((teams ?? []).map((t) => [t.id, t]));
  const available = (teams ?? []).filter((t) => !selected.includes(t.id));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Panel className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Available teams
        </p>
        <div className="flex flex-wrap gap-2">
          {available.length === 0 ? (
            <span className="text-sm text-muted">No more teams.</span>
          ) : null}
          {available.map((team) => (
            <button
              key={team.id}
              className={ghostButton}
              onClick={() => setSelected((s) => [...s, team.id])}
            >
              + {team.tag}
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Seeds (top = strongest)
        </p>
        <ol className="space-y-2">
          {selected.length === 0 ? (
            <span className="text-sm text-muted">Click teams to add them, in seed order.</span>
          ) : null}
          {selected.map((id, index) => (
            <li key={id} className="flex items-center justify-between gap-2">
              <span className="text-sm">
                <span className="font-mono text-muted">{index + 1}.</span>{' '}
                <span className="font-semibold">{byId.get(id)?.name ?? id}</span>{' '}
                <span className="font-mono text-xs text-muted">[{byId.get(id)?.tag}]</span>
              </span>
              <button
                className={ghostButton}
                onClick={() => setSelected((s) => s.filter((x) => x !== id))}
              >
                remove
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex items-center gap-3">
          <button
            className={primaryButton}
            disabled={selected.length < 2 || draw.isPending}
            onClick={() => void draw.mutateAsync(selected).catch(() => undefined)}
          >
            {draw.isPending ? 'Drawing…' : 'Draw bracket'}
          </button>
          {draw.isError ? (
            <span className="text-sm text-cancelled">{draw.error.message}</span>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

// --- Active/completed: the bracket ---

function roundLabel(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semifinals';
  if (fromEnd === 2) return 'Quarterfinals';
  return `Round ${round}`;
}

function Bracket({
  data,
  guildId,
  champId,
  canManage,
}: {
  data: ChampionshipDetail;
  guildId: string;
  champId: string;
  canManage: boolean;
}) {
  const record = useRecordSets(guildId, champId);
  const teamById = new Map<string, TeamRef | null>(data.teams.map((e) => [e.teamId, e.team]));
  const tagOf = (id: string | null): string => (id ? (teamById.get(id)?.tag ?? '???') : 'TBD');

  const rounds = [...new Set(data.matches.map((m) => m.round))].sort((a, b) => a - b);
  const totalRounds = rounds.length ? Math.max(...rounds) : 0;

  const champion =
    data.championship.status === 'completed'
      ? (data.matches.find((m) => m.round === totalRounds)?.winnerTeamId ?? null)
      : null;

  return (
    <div className="space-y-5">
      {champion ? (
        <Panel className="rise flex items-center gap-3 border-lime/40 p-4">
          <span className="text-2xl">🏆</span>
          <p className="font-display text-2xl tracking-wide text-lime">
            {teamById.get(champion)?.name ?? tagOf(champion)} win the cup!
          </p>
        </Panel>
      ) : null}

      <div className="flex gap-6 overflow-x-auto pb-4">
        {rounds.map((round) => (
          <div key={round} className="flex min-w-[230px] flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {roundLabel(round, totalRounds)}
            </p>
            <div className="flex flex-1 flex-col justify-around gap-4">
              {data.matches
                .filter((m) => m.round === round)
                .sort((a, b) => a.position - b.position)
                .map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    tagOf={tagOf}
                    bestOf={data.championship.bestOf}
                    canManage={canManage}
                    onRecord={(sets) => record.mutateAsync({ matchId: match.id, sets })}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function setsWon(match: Match): { home: number; away: number } {
  let home = 0;
  let away = 0;
  for (const set of match.sets) {
    if (set.homeScore > set.awayScore) home += 1;
    else away += 1;
  }
  return { home, away };
}

function MatchCard({
  match,
  tagOf,
  bestOf,
  canManage,
  onRecord,
}: {
  match: Match;
  tagOf: (id: string | null) => string;
  bestOf: number;
  canManage: boolean;
  onRecord: (sets: Array<{ homeScore: number; awayScore: number }>) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const won = setsWon(match);
  const playable =
    match.status === 'pending' && match.homeTeamId !== null && match.awayTeamId !== null;

  const side = (id: string | null, count: number) => {
    const winner = match.winnerTeamId !== null && match.winnerTeamId === id;
    return (
      <div className="flex items-center justify-between">
        <span className={winner ? 'font-bold text-lime' : id ? 'text-fg' : 'text-muted'}>
          {tagOf(id)}
        </span>
        {match.status === 'played' ? <span className="font-mono text-sm">{count}</span> : null}
      </div>
    );
  };

  return (
    <Panel className="rise p-3">
      <div className="space-y-1">
        {side(match.homeTeamId, won.home)}
        <div className="h-px bg-line" />
        {side(match.awayTeamId, won.away)}
      </div>

      {match.status === 'played' && match.sets.length > 0 ? (
        <p className="mt-2 font-mono text-[11px] text-muted">
          {match.sets.map((s) => `${s.homeScore}-${s.awayScore}`).join('  ')}
        </p>
      ) : null}

      {playable && canManage ? (
        editing ? (
          <RecordForm
            bestOf={bestOf}
            onCancel={() => setEditing(false)}
            onSubmit={async (sets) => {
              await onRecord(sets);
              setEditing(false);
            }}
          />
        ) : (
          <button className={`${ghostButton} mt-2`} onClick={() => setEditing(true)}>
            Record result
          </button>
        )
      ) : null}
    </Panel>
  );
}

function RecordForm({
  bestOf,
  onSubmit,
  onCancel,
}: {
  bestOf: number;
  onSubmit: (sets: Array<{ homeScore: number; awayScore: number }>) => Promise<void>;
  onCancel: () => void;
}) {
  const [rows, setRows] = useState<Array<{ home: string; away: string }>>([
    { home: '', away: '' },
    { home: '', away: '' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update(index: number, key: 'home' | 'away', value: string) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  async function submit() {
    const sets = rows
      .filter((row) => row.home !== '' && row.away !== '')
      .map((row) => ({ homeScore: Number(row.home), awayScore: Number(row.away) }));
    setSaving(true);
    setError(null);
    try {
      await onSubmit(sets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 border-t border-line pt-3">
      {rows.map((row, index) => (
        <div key={index} className="flex items-center justify-center gap-2">
          <input
            className={inputClass}
            inputMode="numeric"
            value={row.home}
            onChange={(e) => update(index, 'home', e.target.value)}
            placeholder="H"
          />
          <span className="text-muted">–</span>
          <input
            className={inputClass}
            inputMode="numeric"
            value={row.away}
            onChange={(e) => update(index, 'away', e.target.value)}
            placeholder="A"
          />
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button
          className={ghostButton}
          disabled={rows.length >= bestOf}
          onClick={() => setRows((r) => [...r, { home: '', away: '' }])}
        >
          + set
        </button>
        <div className="flex gap-2">
          <button className={ghostButton} onClick={onCancel}>
            cancel
          </button>
          <button className={primaryButton} disabled={saving} onClick={() => void submit()}>
            {saving ? '…' : 'Save'}
          </button>
        </div>
      </div>
      {error ? <p className="text-xs text-cancelled">{error}</p> : null}
    </div>
  );
}
