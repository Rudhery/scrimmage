# Architecture

Scrimmage is a small monorepo deliberately split into layers so that the domain logic is
independent of both Discord and the database.

## Packages

| Package                     | Responsibility                                                          | Depends on          |
| --------------------------- | ----------------------------------------------------------------------- | ------------------- |
| `@scrimmage/core`           | Domain entities, services (business rules), and storage **interfaces**. | _nothing_           |
| `@scrimmage/storage-sqlite` | A SQLite implementation of the storage interfaces (Drizzle ORM).        | `@scrimmage/core`   |
| `@scrimmage/bot`            | The Discord front-end (discord.js): commands, formatting, wiring.       | both packages above |

The dependency arrows only ever point **inward**, toward the core. The core has no idea Discord
or SQLite exist.

## The dependency-inversion seam

The core defines what it needs from storage:

```ts
// @scrimmage/core
export interface TeamRepository {
  create(team: Team): Promise<Team>;
  findById(guildId: string, id: string): Promise<Team | null>;
  // …
}
```

Storage packages implement that interface:

```ts
// @scrimmage/storage-sqlite
export class DrizzleTeamRepository implements TeamRepository {
  /* … Drizzle queries … */
}
```

And the bot wires a concrete implementation into the services at startup:

```ts
// @scrimmage/bot
const storage = createSqliteStorage({ path: config.databasePath, migrate: true });
const teams = new TeamService(storage.teams);
```

Because the seam is an interface, you can:

- **Swap the database** by writing a new `@scrimmage/storage-*` package (PostgreSQL, etc.).
- **Build a different front-end** (REST API, web dashboard, CLI) on top of the same services.
- **Test the rules in isolation** with the in-memory storage used by the core's own test suite.

## Domain model

- **Team** — belongs to a guild, has a name, a tag and a captain.
- **TeamMember** — links a Discord user to a team.
- **Scrimmage** — a friendly match between two teams with a lifecycle:

  ```
  proposed → confirmed → played
       └────────┴────────→ cancelled
  ```

Each state transition is guarded by the `ScrimmageService` so invalid moves (e.g. recording a
result before a match is confirmed) raise a domain error instead of corrupting data.

## Error handling

The core throws typed errors (`NotFoundError`, `ConflictError`, `ValidationError`,
`InvalidStateError`) that all extend `ScrimmageError`. The bot translates these into friendly,
user-facing messages in `lib/errors.ts`, so the transport layer owns presentation while the core
owns meaning.
