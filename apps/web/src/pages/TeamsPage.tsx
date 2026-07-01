import { useParams } from 'react-router-dom';
import { useTeams } from '../api';
import { Crest, Panel, SectionTitle, StateBlock } from '../components/ui';

export default function TeamsPage() {
  const { guildId = '' } = useParams();
  const { data, isLoading, isError } = useTeams(guildId);

  if (isLoading) return <StateBlock title="Loading teams…" />;
  if (isError) return <StateBlock title="Couldn't load teams" hint="Is the API running?" />;
  if (!data || data.length === 0) {
    return <StateBlock title="No teams yet" hint="Create one with /team create in Discord." />;
  }

  return (
    <section>
      <SectionTitle label="Teams" count={data.length} />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {data.map((team, index) => (
          <Panel
            key={team.id}
            className="rise flex items-center gap-4 p-4 transition hover:border-lime/40"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-xl border border-line object-cover"
              />
            ) : (
              <Crest tag={team.tag} />
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {team.name} <span className="font-mono text-xs text-muted">[{team.tag}]</span>
              </p>
              <p className="truncate text-sm text-muted">{team.description ?? 'No description'}</p>
            </div>
          </Panel>
        ))}
      </div>
    </section>
  );
}
