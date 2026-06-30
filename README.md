<div align="center">

# ⚽ Scrimmage

**Schedule and manage friendly matches (scrims) between teams — right from Discord.**

[![CI](https://github.com/Rudhery/scrimmage/actions/workflows/ci.yml/badge.svg)](https://github.com/Rudhery/scrimmage/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-green.svg)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

</div>

Scrimmage is an open-source Discord bot that lets a community **create teams, manage their
rosters, and schedule friendly matches between them** without leaving Discord. It is built as a
small, well-layered TypeScript monorepo so the matchmaking logic lives in a reusable SDK
(`@scrimmage/core`) that does not depend on Discord at all — the bot is just one of many
possible front-ends.

> **Status:** early development. The architecture and public surface may still change.

---

## ✨ Features

- **Teams** — create, delete, list and inspect teams, each scoped to a Discord server.
- **Rosters** — add and remove members, assign a captain.
- **Scrimmages** — propose a match between two teams, confirm it, cancel it, and record the result.
- **Server-scoped** — every team and match belongs to the guild it was created in.
- **Pluggable storage** — the default is SQLite via Drizzle ORM; the storage layer is an interface,
  so other backends (PostgreSQL, in-memory, …) can be added without touching the domain logic.
- **Reusable core** — the domain and business rules ship as a standalone, framework-agnostic SDK.

## 🧠 How it works

Scrimmage is split into clear layers so each piece has a single responsibility:

```
┌─────────────────────────────────────────────────────────────┐
│  apps/bot            discord.js front-end (slash commands)    │
│                      knows about Discord, not the database     │
├─────────────────────────────────────────────────────────────┤
│  @scrimmage/core     domain entities + services (the SDK)      │
│                      knows about business rules, nothing else  │
│                      defines storage *interfaces*              │
├─────────────────────────────────────────────────────────────┤
│  @scrimmage/storage-sqlite   Drizzle + SQLite implementation   │
│                      implements the storage interfaces          │
└─────────────────────────────────────────────────────────────┘
```

The **core never imports Discord or SQLite**. It only depends on interfaces it defines itself
(`TeamRepository`, `ScrimmageRepository`). Swapping the database — or building a REST API or a
web dashboard on top of the same rules — means writing a new adapter, not rewriting the logic.

## 🚀 Quick start (self-hosting the bot)

### Prerequisites

- [Node.js](https://nodejs.org) **20 or newer**
- A Discord application & bot token — create one at the
  [Discord Developer Portal](https://discord.com/developers/applications)

### 1. Clone & install

```bash
git clone https://github.com/Rudhery/scrimmage.git
cd scrimmage
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Open `.env` and fill in your `DISCORD_TOKEN` and `DISCORD_CLIENT_ID`. During development, set
`DISCORD_GUILD_ID` to your test server so command changes show up instantly.

### 3. Run the bot

```bash
npm run dev
```

The database is created and migrated automatically on first run. When `DISCORD_GUILD_ID` is set,
the bot also registers its slash commands to that guild on startup, so they appear instantly.

### 4. Invite the bot

Open this URL (replace `YOUR_CLIENT_ID`) to add the bot to your server. It needs the `bot` and
`applications.commands` scopes — **no privileged intents required**:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot%20applications.commands&permissions=84992
```

> To register commands **globally** (for production), run `npm run register` once. Global commands
> can take up to ~1 hour to propagate.

For Docker and production deployment, see the [deployment guide](./docs/DEPLOYMENT.md).

## 💬 Commands

| Command                               | Description                                  |
| ------------------------------------- | -------------------------------------------- |
| `/team create <name> <tag>`           | Create a new team.                           |
| `/team delete <team>`                 | Delete a team.                               |
| `/team list`                          | List every team in the server.               |
| `/team info <team>`                   | Show a team's details and roster.            |
| `/team rename <team> <name>`          | Rename a team.                               |
| `/team captain <team> <user>`         | Transfer captaincy to another member.        |
| `/team member add <team> <user>`      | Add a member to a team.                      |
| `/team member remove <team> <user>`   | Remove a member from a team.                 |
| `/scrim propose <home> <away> <when>` | Propose a friendly match between two teams.  |
| `/scrim confirm <id>`                 | Confirm a proposed scrimmage.                |
| `/scrim cancel <id>`                  | Cancel a scrimmage.                          |
| `/scrim list [status]`                | List scrimmages, optionally filtered.        |
| `/scrim result <id> <home> <away>`    | Record the final score of a confirmed match. |

Team and scrimmage options offer **autocomplete**, and a freshly proposed scrimmage comes with
**Confirm / Cancel buttons** so captains can act in one click. Renaming, deleting and roster changes
require the team captain or a member with the **Manage Server** permission.

## 📦 Using the SDK

The matchmaking logic is published as `@scrimmage/core` and can be used on its own:

```ts
import { TeamService, ScrimmageService } from '@scrimmage/core';
import { createSqliteStorage } from '@scrimmage/storage-sqlite';

const storage = createSqliteStorage({ path: './scrimmage.sqlite', migrate: true });
const teams = new TeamService(storage.teams);

const redDragons = await teams.createTeam({
  guildId: '123',
  name: 'Red Dragons',
  tag: 'RDG',
  captainId: '456',
});
```

## 🗂️ Project structure

```
scrimmage/
├── apps/
│   └── bot/                  # @scrimmage/bot — the Discord application (discord.js)
├── packages/
│   ├── core/                 # @scrimmage/core — domain, services, storage interfaces (the SDK)
│   └── storage-sqlite/       # @scrimmage/storage-sqlite — Drizzle + SQLite adapter
├── docs/                     # additional documentation
└── .github/                  # CI workflows and issue/PR templates
```

## 🤝 Contributing

Contributions are very welcome — this project is meant to be easy to learn from and build on.
Please read the [contributing guide](./CONTRIBUTING.md) and our
[code of conduct](./CODE_OF_CONDUCT.md) before opening a pull request.

## 📄 License

[MIT](./LICENSE) © Rudhery Hotz
