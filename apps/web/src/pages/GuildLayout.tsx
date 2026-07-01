import { Link, NavLink, Outlet, useParams } from 'react-router-dom';

const TABS = [
  { to: '', label: 'Standings', end: true },
  { to: 'teams', label: 'Teams', end: false },
  { to: 'scrimmages', label: 'Scrimmages', end: false },
];

export default function GuildLayout() {
  const { guildId = '' } = useParams();

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-8">
      <header className="rise flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-display text-3xl tracking-tight">
            SCRIMMAGE
          </Link>
          <span className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-[11px] text-muted">
            server {guildId}
          </span>
        </div>
        <nav className="flex items-center gap-1 rounded-xl border border-line bg-surface/60 p-1">
          {TABS.map((tab) => (
            <NavLink
              key={tab.label}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-bold transition ${
                  isActive ? 'bg-lime text-ink' : 'text-muted hover:text-fg'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="pt-8">
        <Outlet />
      </main>
    </div>
  );
}
