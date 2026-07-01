import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [guildId, setGuildId] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    const id = guildId.trim();
    if (id) {
      navigate(`/g/${encodeURIComponent(id)}`);
    }
  }

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

      <form
        onSubmit={submit}
        className="rise mt-10 flex w-full max-w-md items-center gap-2"
        style={{ animationDelay: '180ms' }}
      >
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

      <p className="mt-6 max-w-md font-mono text-xs text-muted">
        Enable Developer Mode in Discord, then right-click your server → Copy Server ID.
      </p>
    </main>
  );
}
