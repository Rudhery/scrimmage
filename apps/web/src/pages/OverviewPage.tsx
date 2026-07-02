import { Link, useParams } from 'react-router-dom';
import { useOverview, type GuildOverview, type Scrimmage, type TeamActivity } from '../api';
import {
  Crest,
  Panel,
  SectionTitle,
  StateBlock,
  StatusBadge,
  formatKickoff,
} from '../components/ui';
import { ChampBadge } from './ChampionshipsPage';

function relative(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function OverviewPage() {
  const { guildId = '' } = useParams();
  const { data, isLoading, isError } = useOverview(guildId);

  if (isLoading) return <StateBlock title="Loading overview…" />;
  if (isError || !data)
    return <StateBlock title="Couldn't load the overview" hint="Is the API running?" />;

  return (
    <section className="space-y-6">
      <SectionTitle label="Overview" />
      <BotCard bot={data.bot} />
      <StatGrid counts={data.counts} />
      <ActiveCups cups={data.activeChampionships} />
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentScrimmages scrimmages={data.recentScrimmages} guildId={guildId} />
        <TeamActivityList activity={data.teamActivity} />
      </div>
    </section>
  );
}

function BotCard({ bot }: { bot: GuildOverview['bot'] }) {
  return (
    <Panel
      className={`rise flex items-center gap-4 p-5 ${bot.online ? 'border-confirmed/40' : ''}`}
    >
      <span className="relative flex h-3.5 w-3.5">
        {bot.online ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-confirmed opacity-60" />
        ) : null}
        <span
          className={`relative inline-flex h-3.5 w-3.5 rounded-full ${bot.online ? 'bg-confirmed' : 'bg-cancelled'}`}
        />
      </span>
      <div>
        <p className="font-display text-2xl tracking-wide">
          {bot.online ? 'Bot online' : 'Bot offline'}
        </p>
        <p className="text-sm text-muted">Last seen {relative(bot.lastSeenAt)}</p>
      </div>
    </Panel>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Panel className="rise p-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1 font-display text-4xl tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Panel>
  );
}

function StatGrid({ counts }: { counts: GuildOverview['counts'] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard label="Teams" value={counts.teams} />
      <StatCard
        label="Scrimmages"
        value={counts.scrimmages.total}
        hint={`${counts.scrimmages.confirmed} upcoming · ${counts.scrimmages.played} played`}
      />
      <StatCard
        label="Championships"
        value={counts.championships.total}
        hint={`${counts.championships.active} active`}
      />
    </div>
  );
}

function ActiveCups({ cups }: { cups: GuildOverview['activeChampionships'] }) {
  if (cups.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="font-display text-xl tracking-wide">Active championships</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {cups.map((cup) => (
          <Link key={cup.id} to={`championships/${cup.id}`}>
            <Panel className="flex items-center justify-between gap-3 p-4 transition hover:border-lime/40">
              <span className="truncate font-semibold">{cup.name}</span>
              <ChampBadge status={cup.status} />
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}

function scoreLabel(scrimmage: Scrimmage): string {
  return scrimmage.result ? `${scrimmage.result.homeScore}–${scrimmage.result.awayScore}` : 'vs';
}

function RecentScrimmages({ scrimmages, guildId }: { scrimmages: Scrimmage[]; guildId: string }) {
  return (
    <div className="space-y-2">
      <h3 className="font-display text-xl tracking-wide">Latest scrimmages</h3>
      {scrimmages.length === 0 ? (
        <StateBlock title="No scrimmages yet" />
      ) : (
        <Panel className="divide-y divide-line">
          {scrimmages.map((scrim) => (
            <Link
              key={scrim.id}
              to={`scrimmages`}
              state={{ guildId }}
              className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-surface2/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {scrim.homeTeam?.tag ?? '???'}{' '}
                  <span className="font-mono text-muted">{scoreLabel(scrim)}</span>{' '}
                  {scrim.awayTeam?.tag ?? '???'}
                </p>
                <p className="font-mono text-[11px] text-muted">
                  {formatKickoff(scrim.scheduledAt)}
                </p>
              </div>
              <StatusBadge status={scrim.status} />
            </Link>
          ))}
        </Panel>
      )}
    </div>
  );
}

function TeamActivityList({ activity }: { activity: TeamActivity[] }) {
  return (
    <div className="space-y-2">
      <h3 className="font-display text-xl tracking-wide">Team activity</h3>
      {activity.length === 0 ? (
        <StateBlock title="No teams yet" />
      ) : (
        <Panel className="divide-y divide-line">
          {activity.map((entry) => (
            <div
              key={entry.team?.id ?? Math.random()}
              className="flex items-center gap-3 px-4 py-3"
            >
              <Crest tag={entry.team?.tag ?? '???'} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{entry.team?.name ?? 'Unknown'}</p>
                <p className="font-mono text-[11px] text-muted">
                  {entry.matches} match{entry.matches === 1 ? '' : 'es'} · last{' '}
                  {relative(entry.lastMatchAt)}
                </p>
              </div>
              {entry.matches > 0 ? (
                <span className="h-2 w-2 rounded-full bg-confirmed" title="active" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-line" title="inactive" />
              )}
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
