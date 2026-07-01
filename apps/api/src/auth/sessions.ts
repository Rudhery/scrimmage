import { randomUUID } from 'node:crypto';

export interface SessionUser {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
}

export interface SessionGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface Session {
  user: SessionUser;
  guilds: SessionGuild[];
  expiresAt: number;
}

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * In-memory session store keyed by an opaque random id (kept in an httpOnly
 * cookie). Sessions are lost on restart — users simply log in again. A
 * production deployment could swap this for a persistent store.
 */
export class SessionStore {
  private readonly sessions = new Map<string, Session>();

  constructor(private readonly ttlMs: number = DEFAULT_TTL_MS) {}

  create(data: Omit<Session, 'expiresAt'>): string {
    const id = randomUUID();
    this.sessions.set(id, { ...data, expiresAt: Date.now() + this.ttlMs });
    return id;
  }

  get(id: string | undefined): Session | null {
    if (!id) {
      return null;
    }
    const session = this.sessions.get(id);
    if (!session) {
      return null;
    }
    if (session.expiresAt < Date.now()) {
      this.sessions.delete(id);
      return null;
    }
    return session;
  }

  delete(id: string | undefined): void {
    if (id) {
      this.sessions.delete(id);
    }
  }
}
