import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCanManage, useChampionships, useCreateChampionship, type Championship } from '../api';
import { Panel, SectionTitle, StateBlock } from '../components/ui';
import { DateField } from '../components/DateField';
import { useI18n, type MessageKey } from '../i18n';

const inputClass =
  'w-full rounded-lg border border-line bg-surface2 px-3 py-2 text-sm text-fg outline-none focus:border-lime/60';
const primaryButton =
  'rounded-lg bg-lime px-4 py-2 text-sm font-bold text-ink transition hover:brightness-110 disabled:opacity-50';

export function ChampBadge({ status }: { status: Championship['status'] }) {
  const { t } = useI18n();
  const map: Record<Championship['status'], string> = {
    draft: 'text-proposed border-proposed/40 bg-proposed/10',
    active: 'text-confirmed border-confirmed/40 bg-confirmed/10',
    completed: 'text-played border-played/40 bg-played/10',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${map[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t(`cup.status.${status}` as MessageKey)}
    </span>
  );
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ChampionshipsPage() {
  const { guildId = '' } = useParams();
  const { data, isLoading, isError } = useChampionships(guildId);
  const canManage = useCanManage(guildId);
  const { t } = useI18n();

  return (
    <section className="space-y-6">
      <SectionTitle label={t('cups.title')} count={data?.length} />

      {canManage ? <CreateForm guildId={guildId} /> : null}

      {isLoading ? <StateBlock title={t('cups.loading')} /> : null}
      {isError ? <StateBlock title={t('cups.error')} hint={t('common.loadingApi')} /> : null}
      {data && data.length === 0 ? (
        <StateBlock
          title={t('cups.empty')}
          hint={canManage ? t('cups.emptyHintManage') : t('cups.emptyHint')}
        />
      ) : null}

      {data && data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((champ, index) => (
            <Link key={champ.id} to={champ.id}>
              <Panel
                className="rise flex items-center justify-between gap-4 p-4 transition hover:border-lime/40"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{champ.name}</p>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {t('cups.bestOfLine', { n: champ.bestOf })} · {formatDay(champ.startsAt)} →{' '}
                    {formatDay(champ.endsAt)}
                  </p>
                </div>
                <ChampBadge status={champ.status} />
              </Panel>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function CreateForm({ guildId }: { guildId: string }) {
  const create = useCreateChampionship(guildId);
  const { t, locale } = useI18n();
  const [name, setName] = useState('');
  const [bestOf, setBestOf] = useState(5);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await create
      .mutateAsync({ name, bestOf, startsAt, endsAt })
      .then(() => {
        setName('');
        setStartsAt('');
        setEndsAt('');
      })
      .catch(() => {
        /* error surfaced below */
      });
  }

  return (
    <Panel className="p-4">
      <p className="mb-3 font-display text-xl tracking-wide">{t('cups.new')}</p>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            {t('common.name')}
          </span>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Spring Cup"
            required
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            {t('cups.format')}
          </span>
          <select
            className={inputClass}
            value={bestOf}
            onChange={(e) => setBestOf(Number(e.target.value))}
          >
            <option value={3}>{t('cups.bo3')}</option>
            <option value={5}>{t('cups.bo5')}</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              {t('cups.starts')}
            </span>
            <DateField
              value={startsAt}
              onChange={setStartsAt}
              placeholder={t('cups.startDate')}
              locale={locale}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              {t('cups.ends')}
            </span>
            <DateField
              value={endsAt}
              onChange={setEndsAt}
              placeholder={t('cups.endDate')}
              locale={locale}
            />
          </label>
        </div>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            className={primaryButton}
            disabled={create.isPending || !name.trim() || !startsAt || !endsAt}
          >
            {create.isPending ? t('cups.creating') : t('cups.create')}
          </button>
          {create.isError ? (
            <span className="text-sm text-cancelled">{create.error.message}</span>
          ) : null}
        </div>
      </form>
    </Panel>
  );
}
