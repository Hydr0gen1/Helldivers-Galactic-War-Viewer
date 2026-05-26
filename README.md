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
  -e FIREWORKS_MODEL=accounts/fireworks/models/deepseek-v3p1 \
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
