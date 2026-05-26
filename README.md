# Helldivers Intel — Galactic War Intelligence Dashboard

Helldivers Intel is a **Helldivers 2 Galactic War intelligence dashboard** for self-hosted use. It polls the Helldivers community API, normalizes live war state into strategic signals, and uses a configurable AI provider to generate operational recommendations. The app serves both the React frontend and Express API from one Docker container.

## Current stack

- Node.js 20
- Express
- TypeScript
- React + Vite
- Tailwind CSS
- TanStack Query
- Docker self-hosting (single container)
- AI providers: Anthropic, Fireworks, Cerebras

## Quick start (local development)

```bash
npm ci
cp .env.example .env
npm run dev
```

Set `AI_PROVIDER` in `.env` and provide the matching provider API key for that selected provider.

## Self-hosted Docker

Build:

```bash
docker build -t helldivers-intel .
```

Run (Anthropic):

```bash
docker run --rm -p 8080:8080 \
  -e AI_PROVIDER=anthropic \
  -e ANTHROPIC_API_KEY=your-key \
  -e ANTHROPIC_MODEL=claude-haiku-4-5-20251001 \
  -e HELLDIVERS_USER_AGENT="helldivers-intel/1.0 (self-host)" \
  helldivers-intel
```

Run (Fireworks):

```bash
docker run --rm -p 8080:8080 \
  -e AI_PROVIDER=fireworks \
  -e FIREWORKS_API_KEY=your-key \
  -e FIREWORKS_MODEL=accounts/fireworks/models/deepseek-v4-flash \
  -e HELLDIVERS_USER_AGENT="helldivers-intel/1.0 (self-host)" \
  helldivers-intel
```

Run (Cerebras):

```bash
docker run --rm -p 8080:8080 \
  -e AI_PROVIDER=cerebras \
  -e CEREBRAS_API_KEY=your-key \
  -e CEREBRAS_MODEL=llama-4-scout-17b-16e-instruct \
  -e HELLDIVERS_USER_AGENT="helldivers-intel/1.0 (self-host)" \
  helldivers-intel
```

## Docker Compose

Basic flow:

```bash
cp .env.example .env
npm run dive
```

Detached/server mode:

```bash
npm run dive:detached
npm run dive:logs
```

Shutdown options:

```bash
npm run dive:down
# or, themed:
npm run extract
```

These npm scripts are convenience aliases around Docker Compose commands, and direct Docker Compose commands remain valid (for example, `docker compose up --build` and `docker compose down`).

`docker-compose.yml` reads provider/runtime environment variables from `.env`.

Notes:
- Runtime policy is `restart: unless-stopped`.
- App listens on port `8080`.
- The provider key you set must match `AI_PROVIDER`.

## Runtime endpoints

- `GET /api/health`
- `GET /api/snapshot`
- `GET /api/recommendation`

Behavior notes:
- `/api/health` can briefly report warming/unhealthy while the first snapshot is built.
- Docker healthcheck includes a cold-start grace period.
- Unknown `/api/*` routes return JSON 404.

## Configuration

- `AI_PROVIDER`
- `ANTHROPIC_API_KEY`
- `FIREWORKS_API_KEY`
- `CEREBRAS_API_KEY`
- `ANTHROPIC_MODEL`
- `FIREWORKS_MODEL`
- `FIREWORKS_BASE_URL`
- `CEREBRAS_MODEL`
- `ANALYZER_MAX_TOKENS`
- `ANALYZER_TIMEOUT_MS`
- `ANALYZER_INTERVAL_MS`
- `POLL_INTERVAL_MS`
- `HELLDIVERS_API_BASE`
- `HELLDIVERS_USER_AGENT`
- `HELLDIVERS_MIN_REQUEST_GAP_MS`
- `LOG_LEVEL`
- `PORT`

Fireworks `.env` example:

```bash
AI_PROVIDER=fireworks
FIREWORKS_API_KEY=...
FIREWORKS_BASE_URL=https://api.fireworks.ai/inference/v1
FIREWORKS_MODEL=accounts/fireworks/models/deepseek-v4-flash
```

Choose the Fireworks model you want to run and set FIREWORKS_MODEL yourself.

Normal Fireworks runtime inference uses API key + base URL + model path. No separate user ID or partner key is required for normal inference. Service-account user IDs are used to create/manage service accounts, while runtime inference uses the API key. Model choice is intentionally user-controlled.

Run AI provider diagnostics:

```bash
npm run check:ai
```

Important rules:
- Only the selected provider API key is required.
- Secrets are runtime-only.
- Never bake keys into images.
- Never expose provider keys to the client.

## Domain logic summary

- Defense campaign decay/resistance values are cosmetic and are nullified for strategy logic.
- Raw HP and HP deltas are more important than displayed liberation percentages.
- Ramp-up behavior suppresses false failure alerts immediately after player migration.
- High Priority Campaign early decay signals can be deceptive.
- Gambit detection uses actual attack source (`attacking[]`) data, not only adjacency.
- Siege candidates include enemy-held non-campaign planets when strategically relevant.
- Major Orders can expose typed tasks and relevant planet IDs when confidently decoded.

## Validation

```bash
npm run typecheck
npm run lint
npm run build
npm test
docker build -t helldivers-intel .
```

## Development guardrails

Before changing strategic logic, read:
- `AGENTS.md`
- `docs/DOMAIN_KNOWLEDGE.md`
- `docs/game-mechanics/`

Raw wiki XML exists at:
- `archive/wiki/Helldivers+Wiki-20260523235840.xml`

Prefer curated markdown docs first; use raw XML only when needed.

## War Chronicle
- Local-only SQLite chronicle storage at /app/data/helldivers-intel.sqlite.
- Docker Compose persists chronicle DB in helldivers-data volume.
- This release logs structured campaign/event facts only (no AI narrative, no frontend UI yet).
- This is the foundation for a future player-facing War Archive (planet/campaign/Major Order/event/timeline/efficiency views).
- Future AI-written history chapters must be grounded in these logged facts (no invented history).

## War Archive API

Read-only endpoints under `/api/archive`: `summary`, `events`, `planets`, `planets/:planetId`, `campaigns`, and `major-orders` expose locally logged Chronicle facts.

## War Archive UI (Stage 3)

- The app now includes a player-facing **War Archive** tab that reads local `/api/archive` data.
- Sections include archive overview, event timeline, planet list, planet history, progress charts, campaign summaries, and order archives.
- Major Orders are shown from `/api/archive/major-orders`.
- Minor Orders are shown when present in archive events (`minor_order_active`); otherwise a clear unavailable empty state is displayed.
- Planet history graphs visualize liberation progress, efficiency, player concentration, and HP movement over time.
- Archive views require local data collection first; empty/sparse states are shown until enough polling cycles accumulate.
- AI-written History Book narrative generation remains future work.


## Optional self-hosted auto-update polling

For a self-hosted server, you can optionally poll GitHub every ~5 minutes and only restart after a successful build:

`poll GitHub → detect new commit → pull/reset → build → restart only if build succeeds`

Example `/opt/helldivers-intel/update.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/helldivers-intel"
BRANCH="main"

cd "$APP_DIR"

git fetch origin "$BRANCH"

LOCAL_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse origin/$BRANCH)"

if [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
  echo "No update available."
  exit 0
fi

echo "Update available: $LOCAL_SHA -> $REMOTE_SHA"

git reset --hard "origin/$BRANCH"

echo "Building image..."
docker compose build

echo "Starting updated container..."
docker compose up -d

echo "Pruning old images..."
docker image prune -f

echo "Update complete."
```

```bash
chmod +x /opt/helldivers-intel/update.sh
```

Example cron (every 5 minutes):

```cron
*/5 * * * * /opt/helldivers-intel/update.sh >> /opt/helldivers-intel/update.log 2>&1
```

Safety notes:
- Keep `.env` only on the server (never commit secrets/API keys).
- The script only restarts after `docker compose build` succeeds.
- The `helldivers-data` volume preserves War Chronicle SQLite history.
- `docker compose down` is usually unnecessary for routine updates.
- A future GHCR image-pull deployment path may be cleaner; repo polling is acceptable for now.
