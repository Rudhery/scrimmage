import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
  useCanManage,
  useCancelScrim,
  useRecordScrimResult,
  useScheduleScrim,
  useScrimmages,
  useSetScrimAwards,
  useTeams,
  type Scrimmage,
  type ScrimmageStatus,
} from '../api';
import {
  Crest,
  Panel,
  SectionTitle,
  StateBlock,
  StatusBadge,
  formatKickoff,
} from '../components/ui';

const inputClass =
  'w-full rounded-lg border border-line bg-surface2 px-3 py-2 text-sm text-fg outline-none focus:border-lime/60';
const primaryButton =
  'rounded-lg bg-lime px-4 py-2 text-sm font-bold text-ink transition hover:brightness-110 disabled:opacity-50';
const ghostButton =
  'rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-fg';

const FILTERS: Array<{ value: ScrimmageStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'proposed', label: 'Proposed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'played', label: 'Played' },
  { value: 'cancelled', label: 'Cancelled' },
];

const AWARDS: Array<{ key: 'overall' | 'offensive' | 'defensive'; label: string }> = [
  { key: 'overall', label: '🏐 MVP' },
  { key: 'offensive', label: '⚡ Offensive' },
  { key: 'defensive', label: '🛡️ Defensive' },
];

export default function ScrimmagesPage() {
  const { guildId = '' } = useParams();
  const [filter, setFilter] = useState<ScrimmageStatus | 'all'>('all');
  const { data, isLoading, isError } = useScrimmages(guildId, filter);
  const canManage = useCanManage(guildId);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle label="Scrimmages" count={data?.length} />
        <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface/60 p-1">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filter === option.value ? 'bg-lime text-ink' : 'text-muted hover:text-fg'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {canManage ? <ScheduleForm guildId={guildId} /> : null}

      {isLoading ? <StateBlock title="Loading scrimmages…" /> : null}
      {isError ? <StateBlock title="Couldn't load scrimmages" hint="Is the API running?" /> : null}
      {data && data.length === 0 ? (
        <StateBlock
          title="No scrimmages here"
          hint={canManage ? 'Schedule one above.' : 'Propose one with /scrim propose in Discord.'}
        />
      ) : null}

      {data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((scrim, index) => (
            <ScrimCard
              key={scrim.id}
              scrim={scrim}
              index={index}
              guildId={guildId}
              canManage={canManage}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ScrimCard({
  scrim,
  index,
  guildId,
  canManage,
}: {
  scrim: Scrimmage;
  index: number;
  guildId: string;
  canManage: boolean;
}) {
  const [managing, setManaging] = useState(false);
  const awards = scrim.awards;
  const hasAwards = awards && (awards.overall || awards.offensive || awards.defensive);

  return (
    <Panel className="rise p-4" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex flex-1 items-center justify-center gap-3 sm:gap-6">
        <TeamSide
          tag={scrim.homeTeam?.tag ?? '???'}
          name={scrim.homeTeam?.name ?? 'Unknown'}
          align="right"
        />
        <div className="shrink-0 text-center">
          {scrim.result ? (
            <p className="font-display text-2xl leading-none">
              {scrim.result.homeScore}
              <span className="mx-1 text-muted">:</span>
              {scrim.result.awayScore}
            </p>
          ) : (
            <p className="font-display text-xl text-muted">VS</p>
          )}
        </div>
        <TeamSide
          tag={scrim.awayTeam?.tag ?? '???'}
          name={scrim.awayTeam?.name ?? 'Unknown'}
          align="left"
        />
      </div>

      {hasAwards ? (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {AWARDS.map(({ key, label }) =>
            awards?.[key] ? (
              <span
                key={key}
                className="inline-flex items-center gap-1 rounded-full border border-lime/30 bg-lime/10 px-2.5 py-0.5 text-[11px] font-semibold text-lime"
              >
                {label} · <span className="font-mono text-muted">{awards[key]}</span>
              </span>
            ) : null,
          )}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3">
        <span className="font-mono text-xs text-muted">{formatKickoff(scrim.scheduledAt)}</span>
        <div className="flex items-center gap-2">
          {canManage && scrim.status !== 'cancelled' ? (
            <button className={ghostButton} onClick={() => setManaging((v) => !v)}>
              {managing ? 'close' : 'manage'}
            </button>
          ) : null}
          <StatusBadge status={scrim.status} />
        </div>
      </div>

      {managing ? (
        <ManagePanel scrim={scrim} guildId={guildId} onDone={() => setManaging(false)} />
      ) : null}
    </Panel>
  );
}

function ManagePanel({
  scrim,
  guildId,
  onDone,
}: {
  scrim: Scrimmage;
  guildId: string;
  onDone: () => void;
}) {
  const recordResult = useRecordScrimResult(guildId);
  const cancel = useCancelScrim(guildId);
  const setAwards = useSetScrimAwards(guildId);

  const [home, setHome] = useState(scrim.result ? String(scrim.result.homeScore) : '');
  const [away, setAway] = useState(scrim.result ? String(scrim.result.awayScore) : '');
  const [overall, setOverall] = useState(scrim.awards?.overall ?? '');
  const [offensive, setOffensive] = useState(scrim.awards?.offensive ?? '');
  const [defensive, setDefensive] = useState(scrim.awards?.defensive ?? '');

  async function submitResult(event: FormEvent) {
    event.preventDefault();
    await recordResult
      .mutateAsync({ id: scrim.id, homeScore: Number(home), awayScore: Number(away) })
      .catch(() => undefined);
  }

  async function submitAwards(event: FormEvent) {
    event.preventDefault();
    await setAwards
      .mutateAsync({ id: scrim.id, overall, offensive, defensive })
      .catch(() => undefined);
  }

  return (
    <div className="mt-3 space-y-4 border-t border-line pt-3">
      {scrim.status === 'confirmed' ? (
        <form onSubmit={submitResult} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Record result</p>
          <div className="flex items-center gap-2">
            <input
              className={`${inputClass} w-20 text-center`}
              inputMode="numeric"
              value={home}
              onChange={(e) => setHome(e.target.value)}
              placeholder="home"
            />
            <span className="text-muted">:</span>
            <input
              className={`${inputClass} w-20 text-center`}
              inputMode="numeric"
              value={away}
              onChange={(e) => setAway(e.target.value)}
              placeholder="away"
            />
            <button type="submit" className={primaryButton} disabled={recordResult.isPending}>
              Save score
            </button>
          </div>
          {recordResult.isError ? (
            <p className="text-xs text-cancelled">{recordResult.error.message}</p>
          ) : null}
        </form>
      ) : null}

      <form onSubmit={submitAwards} className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          MVP titles (Discord user IDs, empty to clear)
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <AwardInput label="🏐 MVP" value={overall} onChange={setOverall} />
          <AwardInput label="⚡ Offensive" value={offensive} onChange={setOffensive} />
          <AwardInput label="🛡️ Defensive" value={defensive} onChange={setDefensive} />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className={primaryButton} disabled={setAwards.isPending}>
            Save MVPs
          </button>
          {setAwards.isError ? (
            <span className="text-xs text-cancelled">{setAwards.error.message}</span>
          ) : null}
        </div>
      </form>

      <div className="flex items-center gap-3">
        {scrim.status !== 'played' ? (
          <button
            className={ghostButton}
            disabled={cancel.isPending}
            onClick={() =>
              void cancel
                .mutateAsync(scrim.id)
                .then(onDone)
                .catch(() => undefined)
            }
          >
            Cancel scrimmage
          </button>
        ) : null}
      </div>
    </div>
  );
}

function AwardInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-muted">{label}</span>
      <input
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="user id"
      />
    </label>
  );
}

function ScheduleForm({ guildId }: { guildId: string }) {
  const { data: teams } = useTeams(guildId);
  const schedule = useScheduleScrim(guildId);
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await schedule
      .mutateAsync({ homeTeamId, awayTeamId, scheduledAt })
      .then(() => {
        setHomeTeamId('');
        setAwayTeamId('');
        setScheduledAt('');
      })
      .catch(() => undefined);
  }

  return (
    <Panel className="p-4">
      <p className="mb-3 font-display text-xl tracking-wide">Schedule a scrimmage</p>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Home
          </span>
          <select
            className={inputClass}
            value={homeTeamId}
            onChange={(e) => setHomeTeamId(e.target.value)}
            required
          >
            <option value="">Select a team…</option>
            {(teams ?? []).map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} [{team.tag}]
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Away
          </span>
          <select
            className={inputClass}
            value={awayTeamId}
            onChange={(e) => setAwayTeamId(e.target.value)}
            required
          >
            <option value="">Select a team…</option>
            {(teams ?? []).map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} [{team.tag}]
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Kickoff
          </span>
          <input
            type="datetime-local"
            className={inputClass}
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
          />
        </label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button type="submit" className={primaryButton} disabled={schedule.isPending}>
            {schedule.isPending ? 'Scheduling…' : 'Schedule (confirmed)'}
          </button>
          {schedule.isError ? (
            <span className="text-sm text-cancelled">{schedule.error.message}</span>
          ) : null}
        </div>
      </form>
    </Panel>
  );
}

function TeamSide({ tag, name, align }: { tag: string; name: string; align: 'left' | 'right' }) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-3 ${
        align === 'right' ? 'flex-row-reverse text-right' : ''
      }`}
    >
      <Crest tag={tag} size="sm" />
      <span className="truncate font-semibold">{name}</span>
    </div>
  );
}
