import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useScrimmages, type ScrimmageStatus } from '../api';
import {
  Crest,
  Panel,
  SectionTitle,
  StateBlock,
  StatusBadge,
  formatKickoff,
} from '../components/ui';

const FILTERS: Array<{ value: ScrimmageStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'proposed', label: 'Proposed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'played', label: 'Played' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function ScrimmagesPage() {
  const { guildId = '' } = useParams();
  const [filter, setFilter] = useState<ScrimmageStatus | 'all'>('all');
  const { data, isLoading, isError } = useScrimmages(guildId, filter);

  return (
    <section>
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

      <div className="mt-4">
        {isLoading ? (
          <StateBlock title="Loading scrimmages…" />
        ) : isError ? (
          <StateBlock title="Couldn't load scrimmages" hint="Is the API running?" />
        ) : !data || data.length === 0 ? (
          <StateBlock
            title="No scrimmages here"
            hint="Propose one with /scrim propose in Discord."
          />
        ) : (
          <div className="space-y-3">
            {data.map((scrim, index) => (
              <Panel
                key={scrim.id}
                className="rise p-4"
                style={{ animationDelay: `${index * 40}ms` }}
              >
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
                <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3">
                  <span className="font-mono text-xs text-muted">
                    {formatKickoff(scrim.scheduledAt)}
                  </span>
                  <StatusBadge status={scrim.status} />
                </div>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </section>
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
