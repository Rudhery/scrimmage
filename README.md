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
- **Pre-game reminders** — the bot pings both teams before kickoff, in a configurable channel and via DM.
- **RSVP** — players confirm attendance (Going / Maybe / Can't) with live counts, via buttons.
- **Availability polls** — propose time slots, everyone taps the ones they can make, and the bot
  highlights the slot that works for the most players.
- **Standings & stats** — a league table (W/D/L, goal difference, points) from recorded results.
- **Player stats & MVP** — record per-player, per-match stats (configurable categories, volleyball
  preset) and get a weighted MVP leaderboard.
- **Multi-language** — English, Português (BR) and Español, chosen per server (`/config language`)
  or from each user's Discord locale.
- **Customizable** — per-server points system, brand color, scrim-admin role, and reminder lead time.
- **Server-scoped** — every team and match belongs to the guild it was created in.
- **Pluggable storage** — the default is SQLite via Drizzle ORM; the storage layer is an interface,
  so other backends (PostgreSQL, in-memory, …) can be added without touching the domain logic.
- **Reusable core** — the domain and business rules ship as a standalone, framework-agnostic SDK.
- **Typed domain events** — subscribe to team and scrimmage changes from the SDK; the bot's own
  notifications are just listeners.
- **Web dashboard** — a React dashboard (teams, scrimmages, live standings) served by a Hono API
  that reuses the same core — proof the SDK is genuinely front-end agnostic.

## 🧠 How it works

Scrimmage is split into clear layers so each piece has a single responsibility. Two independent
front-ends — the Discord bot and the web dashboard's API — reuse the exact same core:

```
┌────────────────────────────┐   ┌────────────────────────────┐
│  apps/bot   (discord.js)    │   │  apps/web   (React + Vite)  │
│  slash commands, buttons     │   │        ↓ fetch              │
│                              │   │  apps/api   (Hono)          │
└──────────────┬─────────────┘   └──────────────┬─────────────┘
               │        both import              │
               ▼                                 ▼
        ┌──────────────────────────────────────────────┐
        │  @scrimmage/core — domain + services (the SDK) │
        │  business rules only; defines storage *interfaces*
        └──────────────────────┬───────────────────────┘
                               ▼
        ┌──────────────────────────────────────────────┐
        │  @scrimmage/storage-sqlite — Drizzle + SQLite  │
        └──────────────────────────────────────────────┘
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
| `/team create`                        | Create a new team (opens a form / modal).    |
| `/team delete <team>`                 | Delete a team.                               |
| `/team list`                          | List every team in the server.               |
| `/team info <team>`                   | Show a team's details and roster.            |
| `/team stats <team>`                  | Show a team's win/draw/loss record.          |
| `/team rename <team> <name>`          | Rename a team.                               |
| `/team captain <team> <user>`         | Transfer captaincy to another member.        |
| `/team role <team> <user> <role>`     | Set a member as coach, assistant or player.  |
| `/team logo <team> [url]`             | Set or clear the team crest/logo.            |
| `/team link <team> <role>`            | Link a Discord role to the team.             |
| `/team unlink <team>`                 | Remove the team's linked role.               |
| `/team member add <team> <user>`      | Add a member to a team.                      |
| `/team member remove <team> <user>`   | Remove a member from a team.                 |
| `/scrim propose <home> <away> <when>` | Propose a friendly match between two teams.  |
| `/scrim info <id>`                    | Show a scrimmage's details.                  |
| `/scrim confirm <id>`                 | Confirm a proposed scrimmage.                |
| `/scrim cancel <id>`                  | Cancel a scrimmage.                          |
| `/scrim list [status]`                | List scrimmages, optionally filtered.        |
| `/scrim result <id> <home> <away>`    | Record the final score of a confirmed match. |
| `/scrim stat <id> <player> <cat> <n>` | Record a player's stat for a scrimmage.      |
| `/scrim sheet <id>`                   | Show a scrimmage's player stat sheet.        |
| `/scrim rsvp <id>`                    | Open the attendance (RSVP) panel.            |
| `/poll <title> <options>`             | Availability poll to find the best slot.     |
| `/standings`                          | Show the server league table.                |
| `/stats mvp`                          | Show the MVP leaderboard.                    |
| `/stats player <user>`                | Show a player's totals and MVP score.        |
| `/config view`                        | Show the server settings.                    |
| `/config announce [channel]`          | Set/clear the announcement channel.          |
| `/config language <lang>`             | Set the server language (or auto).           |
| `/config points <w> <d> <l>`          | Set points for win/draw/loss.                |
| `/config admin-role [role]`           | Set/clear a scrim-admin role.                |
| `/config reminder [minutes]`          | Set/clear the reminder lead time.            |
| `/config color [hex]`                 | Set/clear the embed brand color.             |

Teams have a **captain**, **coaches**, **assistants**, **players** and an optional **crest/logo**.
`/team create` opens a **modal form**, team and scrimmage options offer **autocomplete**, and a
freshly proposed scrimmage comes with **Confirm / Cancel buttons** so captains can act in one click. Long lists paginate with
**Prev / Next buttons**.
Renaming, deleting, role, logo and roster changes require the team captain or a member with the
**Manage Server** permission.

## 📦 Using the SDK

The matchmaking logic is published as `@scrimmage/core` and can be used on its own. It even emits
**typed domain events**, so you can react to what happens without any Discord dependency — the bot's
own DM notifications are just listeners on this bus:

```ts
import { TeamService, ScrimmageService, TypedEventBus } from '@scrimmage/core';
import { createSqliteStorage } from '@scrimmage/storage-sqlite';

const storage = createSqliteStorage({ path: './scrimmage.sqlite', migrate: true });

// Subscribe to domain events (fully typed).
const events = new TypedEventBus();
events.on('scrimmage.confirmed', ({ scrimmage }) => {
  console.log(`Scrimmage ${scrimmage.id} is confirmed!`);
});

const teams = new TeamService(storage.teams, { events });
const scrimmages = new ScrimmageService(storage.scrimmages, storage.teams, { events });

const redDragons = await teams.createTeam({
  guildId: '123',
  name: 'Red Dragons',
  tag: 'RDG',
  captainId: '456',
});
```

## 🖥️ Web dashboard

A read-only React dashboard shows a server's teams, scrimmages and live standings. It talks to a
small Hono API that reuses `@scrimmage/core` — the same core the bot runs on. Run both alongside
the bot:

```bash
npm run dev:api   # Hono API on http://localhost:3001 (reads the same SQLite file)
npm run dev:web   # Vite dev server on http://localhost:5173
```

Open <http://localhost:5173>, enter your Discord **server ID**, and you'll see teams, scrimmages and
the league table update as the bot is used.

### Login with Discord (optional)

Set `DISCORD_CLIENT_SECRET` and add `OAUTH_REDIRECT_URI` (e.g.
`http://localhost:5173/api/auth/callback`) to your app's **OAuth2 → Redirects** in the Developer
Portal. The dashboard then requires **Login with Discord** and only shows the servers you're in —
each guild's data is guarded server-side by your session. Without these variables the dashboard
stays open and you pick a server by ID.

## 🗂️ Project structure

```
scrimmage/
├── apps/
│   ├── bot/                  # @scrimmage/bot — the Discord application (discord.js)
│   ├── api/                  # @scrimmage/api — read-only Hono API over the core
│   └── web/                  # @scrimmage/web — React + Vite + Tailwind dashboard
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
