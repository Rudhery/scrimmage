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
import { useI18n, type Translate } from '../i18n';

function relative(iso: string | null, t: Translate): string {
  if (!iso) return t('common.never');
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return t('time.justNow');
  if (min < 60) return t('time.minAgo', { n: min });
  const hours = Math.floor(min / 60);
  if (hours < 24) return t('time.hAgo', { n: hours });
  return t('time.dAgo', { n: Math.floor(hours / 24) });
}

export default function OverviewPage() {
  const { guildId = '' } = useParams();
  const { data, isLoading, isError } = useOverview(guildId);
  const { t } = useI18n();

  if (isLoading) return <StateBlock title={t('overview.loading')} />;
  if (isError || !data)
    return <StateBlock title={t('overview.error')} hint={t('common.loadingApi')} />;

  return (
    <section className="space-y-6">
      <SectionTitle label={t('overview.title')} />
      <BotCard bot={data.bot} />
      <StatGrid counts={data.counts} />
      <ActiveCups cups={data.activeChampionships} />
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentScrimmages scrimmages={data.recentScrimmages} />
        <TeamActivityList activity={data.teamActivity} />
      </div>
    </section>
  );
}

function BotCard({ bot }: { bot: GuildOverview['bot'] }) {
  const { t } = useI18n();
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
          {bot.online ? t('overview.botOnline') : t('overview.botOffline')}
        </p>
        <p className="text-sm text-muted">
          {t('overview.lastSeen', { when: relative(bot.lastSeenAt, t) })}
        </p>
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
  const { t } = useI18n();
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard label={t('nav.teams')} value={counts.teams} />
      <StatCard
        label={t('nav.scrimmages')}
        value={counts.scrimmages.total}
        hint={t('overview.scrimHint', {
          upcoming: counts.scrimmages.confirmed,
          played: counts.scrimmages.played,
        })}
      />
      <StatCard
        label={t('cups.title')}
        value={counts.championships.total}
        hint={t('overview.cupsHint', { active: counts.championships.active })}
      />
    </div>
  );
}

function ActiveCups({ cups }: { cups: GuildOverview['activeChampionships'] }) {
  const { t } = useI18n();
  if (cups.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="font-display text-xl tracking-wide">{t('overview.activeCups')}</h3>
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

function RecentScrimmages({ scrimmages }: { scrimmages: Scrimmage[] }) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <h3 className="font-display text-xl tracking-wide">{t('overview.latestScrims')}</h3>
      {scrimmages.length === 0 ? (
        <StateBlock title={t('overview.noScrims')} />
      ) : (
        <Panel className="divide-y divide-line">
          {scrimmages.map((scrim) => (
            <Link
              key={scrim.id}
              to="scrimmages"
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
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <h3 className="font-display text-xl tracking-wide">{t('overview.teamActivity')}</h3>
      {activity.length === 0 ? (
        <StateBlock title={t('overview.noTeams')} />
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
                  {t(entry.matches === 1 ? 'overview.match' : 'overview.matches', {
                    count: entry.matches,
                    when: relative(entry.lastMatchAt, t),
                  })}
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
