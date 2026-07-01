import { useParams } from 'react-router-dom';
import { useStandings } from '../api';
import { Crest, Panel, SectionTitle, StateBlock } from '../components/ui';

const ROW =
  'grid grid-cols-[2rem_1fr_repeat(5,2rem)] items-center gap-2 sm:grid-cols-[2.5rem_1fr_repeat(6,2.75rem)]';

export default function StandingsPage() {
  const { guildId = '' } = useParams();
  const { data, isLoading, isError } = useStandings(guildId);

  if (isLoading) return <StateBlock title="Loading standings…" />;
  if (isError) return <StateBlock title="Couldn't load standings" hint="Is the API running?" />;
  if (!data || data.length === 0) {
    return (
      <StateBlock
        title="No matches played yet"
        hint="The table fills up as results are recorded."
      />
    );
  }

  return (
    <section>
      <SectionTitle label="League table" count={data.length} />
      <Panel className="mt-4 overflow-hidden">
        <div
          className={`${ROW} border-b border-line px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted`}
        >
          <span>#</span>
          <span>Team</span>
          <span className="text-center">P</span>
          <span className="text-center">W</span>
          <span className="text-center">D</span>
          <span className="text-center">L</span>
          <span className="hidden text-center sm:block">GD</span>
          <span className="text-center text-lime">PTS</span>
        </div>

        {data.map((row, index) => (
          <div
            key={row.teamId}
            className={`${ROW} rise border-b border-line/60 px-4 py-3 text-sm last:border-0 hover:bg-surface2/50`}
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <span className={`font-display text-lg ${index === 0 ? 'text-lime' : 'text-muted'}`}>
              {index + 1}
            </span>
            <span className="flex min-w-0 items-center gap-3">
              <Crest tag={row.team?.tag ?? '???'} size="sm" />
              <span className="truncate font-semibold">{row.team?.name ?? 'Unknown team'}</span>
            </span>
            <span className="text-center text-muted">{row.played}</span>
            <span className="text-center">{row.wins}</span>
            <span className="text-center">{row.draws}</span>
            <span className="text-center">{row.losses}</span>
            <span className="hidden text-center text-muted sm:block">
              {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
            </span>
            <span className="text-center font-display text-lg">{row.points}</span>
          </div>
        ))}
      </Panel>
    </section>
  );
}
