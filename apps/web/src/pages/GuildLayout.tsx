import { Link, NavLink, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { logout, useAuth, TEST_GUILD, type AuthUser } from '../api';

const TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'standings', label: 'Standings', end: false },
  { to: 'teams', label: 'Teams', end: false },
  { to: 'scrimmages', label: 'Scrimmages', end: false },
  { to: 'championships', label: 'Cups', end: false },
];

export default function GuildLayout() {
  const { guildId = '' } = useParams();
  const { data } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const testMode = guildId === TEST_GUILD;

  // When login is required but the user is signed out, send them home — unless
  // this is the sandbox test guild, which is always open.
  if (data?.oauthConfigured && !data.authenticated && !testMode) {
    return <Navigate to="/" replace />;
  }

  async function handleLogout() {
    await logout();
    await queryClient.invalidateQueries();
    navigate('/');
  }

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
          {testMode ? (
            <span className="rounded-md border border-lime/40 bg-lime/10 px-2 py-1 font-mono text-[11px] font-bold text-lime">
              🧪 test mode
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
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

          {data?.authenticated && data.user ? (
            <div className="flex items-center gap-2">
              <Avatar user={data.user} />
              <button
                onClick={handleLogout}
                className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted transition hover:text-fg"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="pt-8">
        <Outlet />
      </main>
    </div>
  );
}

function Avatar({ user }: { user: AuthUser }) {
  if (user.avatar) {
    return (
      <img
        src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`}
        alt=""
        className="h-9 w-9 rounded-full border border-line object-cover"
        title={user.globalName ?? user.username}
      />
    );
  }
  return (
    <span
      className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface2 font-display text-xs text-lime"
      title={user.globalName ?? user.username}
    >
      {(user.globalName ?? user.username).slice(0, 2).toUpperCase()}
    </span>
  );
}
