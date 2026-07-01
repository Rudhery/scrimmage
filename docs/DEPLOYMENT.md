# Deployment

This guide covers running Scrimmage in production. For local development see the
[README](../README.md).

## Environment variables

| Variable                | Required | Default              | Description                                                  |
| ----------------------- | -------- | -------------------- | ------------------------------------------------------------ |
| `DISCORD_TOKEN`         | ✅       | —                    | Your bot token from the Discord Developer Portal.            |
| `DISCORD_CLIENT_ID`     | ✅       | —                    | Your application (client) ID.                                |
| `DISCORD_GUILD_ID`      | ❌       | —                    | If set, commands register to this guild instantly on boot.   |
| `DATABASE_PATH`         | ❌       | `./scrimmage.sqlite` | Path to the SQLite database file.                            |
| `LOG_LEVEL`             | ❌       | `info`               | `trace` \| `debug` \| `info` \| `warn` \| `error` \| `fatal` |
| `REMINDER_LEAD_MINUTES` | ❌       | `15`                 | Minutes before kickoff to send the pre-game reminder.        |
| `REMINDER_POLL_SECONDS` | ❌       | `60`                 | How often the reminder loop checks for due scrimmages.       |

The database file is created and migrated automatically on first start.

## Inviting the bot

Generate an invite URL with the `bot` and `applications.commands` scopes. The bot only needs to
read channels and post messages/embeds — **no privileged intents are required**.

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot%20applications.commands&permissions=84992
```

`permissions=84992` grants View Channel, Send Messages, Embed Links and Read Message History.

## Registering commands

- With `DISCORD_GUILD_ID` set, the bot registers its slash commands to that guild on startup
  (instant — ideal for a single server).
- For a **global** deployment, run the registration once: `npm run register`. Global commands can
  take up to ~1 hour to propagate.

## Running with Docker

A production `Dockerfile` is included. Build and run with a mounted volume so the database persists:

```bash
docker build -t scrimmage .

docker run -d --name scrimmage \
  --restart unless-stopped \
  -e DISCORD_TOKEN=your-token \
  -e DISCORD_CLIENT_ID=your-client-id \
  -e DISCORD_GUILD_ID=your-guild-id \
  -v scrimmage-data:/data \
  scrimmage
```

The container applies migrations and then starts the bot. The SQLite file lives at `/data` inside
the container, mapped to the named volume `scrimmage-data`.

## Running with Node directly

```bash
npm ci
npm run db:migrate   # optional — the bot also migrates on startup
npm start
```

Use a process supervisor (systemd, PM2, etc.) to keep the bot running and restart it on failure.

## Updating

```bash
git pull
npm ci
npm run db:migrate
# restart the bot / container
```
