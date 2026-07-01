import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type AuthGuild } from '../api';

export default function Home() {
  const navigate = useNavigate();
  const { data, isLoading } = useAuth();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="rise mb-4 font-mono text-xs uppercase tracking-[0.35em] text-lime">
        Matchday control
      </p>
      <h1
        className="rise font-display text-7xl leading-[0.9] tracking-tight sm:text-8xl"
        style={{ animationDelay: '60ms' }}
      >
        SCRIMMAGE
      </h1>
      <p className="rise mt-5 max-w-md text-muted" style={{ animationDelay: '120ms' }}>
        The live dashboard for your teams, scrimmages and standings — powered by the very same core
        the bot runs on.
      </p>

      <div className="rise mt-10 w-full max-w-md" style={{ animationDelay: '180ms' }}>
        {isLoading ? (
          <p className="font-mono text-sm text-muted">Loading…</p>
        ) : data?.oauthConfigured ? (
          data.authenticated ? (
            <GuildPicker guilds={data.guilds} onPick={(id) => navigate(`/g/${id}`)} />
          ) : (
            <a
              href="/api/auth/login"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-lime px-6 font-bold text-ink transition hover:brightness-110 active:scale-95"
            >
              Login with Discord →
            </a>
          )
        ) : (
          <GuildIdForm onSubmit={(id) => navigate(`/g/${encodeURIComponent(id)}`)} />
        )}
      </div>
    </main>
  );
}

function GuildPicker({ guilds, onPick }: { guilds: AuthGuild[]; onPick: (id: string) => void }) {
  if (guilds.length === 0) {
    return <p className="text-sm text-muted">You are not in any servers the bot can see yet.</p>;
  }
  return (
    <div className="space-y-2 text-left">
      <p className="mb-3 text-center font-mono text-xs uppercase tracking-widest text-muted">
        Choose a server
      </p>
      {guilds.map((guild) => (
        <button
          key={guild.id}
          onClick={() => onPick(guild.id)}
          className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left transition hover:border-lime/40 hover:bg-surface2"
        >
          <GuildIcon guild={guild} />
          <span className="truncate font-semibold">{guild.name}</span>
          {guild.owner ? (
            <span className="ml-auto rounded-md border border-line px-2 py-0.5 font-mono text-[10px] uppercase text-muted">
              owner
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function GuildIcon({ guild }: { guild: AuthGuild }) {
  if (guild.icon) {
    return (
      <img
        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`}
        alt=""
        className="h-9 w-9 shrink-0 rounded-lg object-cover"
      />
    );
  }
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface2 font-display text-xs text-lime">
      {guild.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function GuildIdForm({ onSubmit }: { onSubmit: (id: string) => void }) {
  const [guildId, setGuildId] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    const id = guildId.trim();
    if (id) {
      onSubmit(id);
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        value={guildId}
        onChange={(event) => setGuildId(event.target.value)}
        placeholder="Enter your Discord server ID"
        className="h-12 flex-1 rounded-xl border border-line bg-surface px-4 font-mono text-sm outline-none placeholder:text-muted focus:border-lime"
      />
      <button
        type="submit"
        className="h-12 rounded-xl bg-lime px-5 font-bold text-ink transition hover:brightness-110 active:scale-95"
      >
        Open →
      </button>
    </form>
  );
}
