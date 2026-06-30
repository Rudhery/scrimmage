# Scrimmage — production container image.
# Runs the discord.js bot directly from TypeScript via tsx (no build step needed).
FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production

# Install dependencies first for better layer caching. All workspace manifests
# must be present so npm can resolve the workspace graph.
COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/storage-sqlite/package.json ./packages/storage-sqlite/
COPY apps/bot/package.json ./apps/bot/
RUN npm ci

# Copy the rest of the source (including committed migrations).
COPY . .

# Keep the SQLite database on a mountable volume so data survives restarts.
ENV DATABASE_PATH=/data/scrimmage.sqlite
VOLUME ["/data"]

# Apply migrations, then start the bot.
CMD ["sh", "-c", "npm run db:migrate && npm start"]
