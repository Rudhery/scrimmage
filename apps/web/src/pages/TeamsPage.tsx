import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useCanManage, useCreateTeam, useTeams } from '../api';
import { Crest, Panel, SectionTitle, StateBlock } from '../components/ui';

const inputClass =
  'w-full rounded-lg border border-line bg-surface2 px-3 py-2 text-sm text-fg outline-none focus:border-lime/60';
const primaryButton =
  'rounded-lg bg-lime px-4 py-2 text-sm font-bold text-ink transition hover:brightness-110 disabled:opacity-50';

export default function TeamsPage() {
  const { guildId = '' } = useParams();
  const { data, isLoading, isError } = useTeams(guildId);
  const canManage = useCanManage(guildId);

  return (
    <section className="space-y-6">
      <SectionTitle label="Teams" count={data?.length} />

      {canManage ? <CreateTeamForm guildId={guildId} /> : null}

      {isLoading ? <StateBlock title="Loading teams…" /> : null}
      {isError ? <StateBlock title="Couldn't load teams" hint="Is the API running?" /> : null}
      {data && data.length === 0 ? (
        <StateBlock
          title="No teams yet"
          hint={
            canManage
              ? 'Create one above, or use /team create in Discord.'
              : 'Use /team create in Discord.'
          }
        />
      ) : null}

      {data && data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
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
                <p className="truncate text-sm text-muted">
                  {team.description ?? 'No description'}
                </p>
              </div>
            </Panel>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function CreateTeamForm({ guildId }: { guildId: string }) {
  const create = useCreateTeam(guildId);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await create
      .mutateAsync({ name, tag, logoUrl: logoUrl || undefined })
      .then(() => {
        setName('');
        setTag('');
        setLogoUrl('');
      })
      .catch(() => undefined);
  }

  return (
    <Panel className="p-4">
      <p className="mb-3 font-display text-xl tracking-wide">New team</p>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Name
          </span>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Karasuno"
            required
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Tag
          </span>
          <input
            className={inputClass}
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="KRS"
            required
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Logo URL (optional)
          </span>
          <input
            className={inputClass}
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button type="submit" className={primaryButton} disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create team'}
          </button>
          {create.isError ? (
            <span className="text-sm text-cancelled">{create.error.message}</span>
          ) : null}
        </div>
      </form>
    </Panel>
  );
}
