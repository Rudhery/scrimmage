# Contributing to Scrimmage

Thanks for taking the time to contribute! 🎉 This project is meant to be approachable, so whether
you're fixing a typo or adding a whole storage backend, you're welcome here.

## Code of Conduct

This project follows a [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected
to uphold it. Please report unacceptable behavior to the maintainers.

## Getting started

1. **Fork** the repository and clone your fork.
2. Make sure you're on **Node.js 20+** (`nvm use` picks up the version from `.nvmrc`).
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your work:
   ```bash
   git checkout -b feat/short-description
   ```

## Project layout

This is an npm-workspaces monorepo:

- `packages/core` — `@scrimmage/core`, the framework-agnostic domain & services (the SDK).
- `packages/storage-sqlite` — `@scrimmage/storage-sqlite`, the Drizzle + SQLite adapter.
- `apps/bot` — `@scrimmage/bot`, the discord.js front-end.

**Rule of thumb:** business rules go in `core`, database code goes in a `storage-*` package, and
Discord-specific code stays in `apps/bot`. The core must never import Discord or a database driver.

## Useful scripts

Run these from the repository root:

| Script                | What it does                              |
| --------------------- | ----------------------------------------- |
| `npm run dev`         | Run the bot in watch mode.                |
| `npm run build`       | Build every package.                      |
| `npm run typecheck`   | Type-check the whole monorepo.            |
| `npm run lint`        | Lint with ESLint.                         |
| `npm run format`      | Format with Prettier.                     |
| `npm test`            | Run the test suite (Vitest).              |
| `npm run db:generate` | Generate a new migration from the schema. |
| `npm run db:migrate`  | Apply pending migrations.                 |

## Before you open a pull request

Please make sure the following all pass locally:

```bash
npm run lint
npm run typecheck
npm test
```

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/). A few examples:

- `feat(core): add scrimmage result recording`
- `fix(bot): handle missing team in /scrim propose`
- `docs: clarify self-hosting steps`

## Changesets

If your change affects a **published** package (`@scrimmage/core` or `@scrimmage/storage-sqlite`),
add a changeset so it gets versioned and shows up in the changelog:

```bash
npm run changeset
```

Commit the generated file in `.changeset/` alongside your code. Changes that only touch the bot,
docs, or CI don't need a changeset.

## Reporting bugs & requesting features

Use the [issue templates](https://github.com/Rudhery/scrimmage/issues/new/choose). The more detail
you give (steps to reproduce, expected vs. actual behavior, environment), the faster we can help.

Happy hacking! 💜
