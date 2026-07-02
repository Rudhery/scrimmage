import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useCanManage, useCreateTeam, useTeams, useUpdateTeam, type Team } from '../api';
import { Crest, Panel, SectionTitle, StateBlock } from '../components/ui';
import { useI18n } from '../i18n';

const ghostButton =
  'rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-fg';

const inputClass =
  'w-full rounded-lg border border-line bg-surface2 px-3 py-2 text-sm text-fg outline-none focus:border-lime/60';
const primaryButton =
  'rounded-lg bg-lime px-4 py-2 text-sm font-bold text-ink transition hover:brightness-110 disabled:opacity-50';

export default function TeamsPage() {
  const { guildId = '' } = useParams();
  const { data, isLoading, isError } = useTeams(guildId);
  const canManage = useCanManage(guildId);
  const { t } = useI18n();

  return (
    <section className="space-y-6">
      <SectionTitle label={t('teams.title')} count={data?.length} />

      {canManage ? <CreateTeamForm guildId={guildId} /> : null}

      {isLoading ? <StateBlock title={t('teams.loading')} /> : null}
      {isError ? <StateBlock title={t('teams.error')} hint={t('common.loadingApi')} /> : null}
      {data && data.length === 0 ? (
        <StateBlock
          title={t('teams.empty')}
          hint={canManage ? t('teams.emptyHintManage') : t('teams.emptyHint')}
        />
      ) : null}

      {data && data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((team, index) => (
            <TeamCard
              key={team.id}
              team={team}
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

function TeamCard({
  team,
  index,
  guildId,
  canManage,
}: {
  team: Team;
  index: number;
  guildId: string;
  canManage: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const { t } = useI18n();
  return (
    <Panel
      className="rise p-4 transition hover:border-lime/40"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-center gap-4">
        {team.logoUrl ? (
          <img
            src={team.logoUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl border border-line object-cover"
          />
        ) : (
          <Crest tag={team.tag} />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {team.name} <span className="font-mono text-xs text-muted">[{team.tag}]</span>
          </p>
          <p className="truncate text-sm text-muted">
            {team.description ?? t('teams.noDescription')}
          </p>
        </div>
        {canManage ? (
          <button className={ghostButton} onClick={() => setEditing((v) => !v)}>
            {editing ? t('common.close') : t('common.edit')}
          </button>
        ) : null}
      </div>
      {editing ? (
        <EditTeamForm team={team} guildId={guildId} onDone={() => setEditing(false)} />
      ) : null}
    </Panel>
  );
}

function EditTeamForm({
  team,
  guildId,
  onDone,
}: {
  team: Team;
  guildId: string;
  onDone: () => void;
}) {
  const update = useUpdateTeam(guildId);
  const { t } = useI18n();
  const [name, setName] = useState(team.name);
  const [tag, setTag] = useState(team.tag);
  const [logoUrl, setLogoUrl] = useState(team.logoUrl ?? '');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await update
      .mutateAsync({ teamId: team.id, name, tag, logoUrl: logoUrl.trim() ? logoUrl : null })
      .then(onDone)
      .catch(() => undefined);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 grid gap-2 border-t border-line pt-3 sm:grid-cols-2"
    >
      <input
        className={inputClass}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        className={inputClass}
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        placeholder="Tag"
      />
      <input
        className={`${inputClass} sm:col-span-2`}
        value={logoUrl}
        onChange={(e) => setLogoUrl(e.target.value)}
        placeholder="Logo URL (empty to clear)"
      />
      <div className="flex items-center gap-3 sm:col-span-2">
        <button type="submit" className={primaryButton} disabled={update.isPending}>
          {update.isPending ? t('teams.saving') : t('teams.save')}
        </button>
        {update.isError ? (
          <span className="text-sm text-cancelled">{update.error.message}</span>
        ) : null}
      </div>
    </form>
  );
}

function CreateTeamForm({ guildId }: { guildId: string }) {
  const create = useCreateTeam(guildId);
  const { t } = useI18n();
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
      <p className="mb-3 font-display text-xl tracking-wide">{t('teams.new')}</p>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            {t('common.name')}
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
            {t('teams.tag')}
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
            {t('teams.logo')}
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
            {create.isPending ? t('teams.creating') : t('teams.create')}
          </button>
          {create.isError ? (
            <span className="text-sm text-cancelled">{create.error.message}</span>
          ) : null}
        </div>
      </form>
    </Panel>
  );
}
