/**
 * A team belongs to a single Discord guild (server) and groups a set of members
 * around a captain. Teams are the entities that face each other in scrimmages.
 */
export interface Team {
  /** Stable unique identifier. */
  readonly id: string;
  /** Discord guild (server) this team belongs to. */
  readonly guildId: string;
  /** Human-readable team name, unique within a guild. */
  readonly name: string;
  /** Short tag/abbreviation, e.g. "RDG". */
  readonly tag: string;
  /** Discord user id of the team captain. */
  readonly captainId: string;
  /** When the team was created. */
  readonly createdAt: Date;
}

/** Membership link between a Discord user and a team. */
export interface TeamMember {
  readonly teamId: string;
  /** Discord user id of the member. */
  readonly userId: string;
  readonly joinedAt: Date;
}
