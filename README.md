# Helldivers Intel — Galactic War Intelligence Agent

A strategic dashboard for Helldivers 2's Galactic War, with pluggable AI providers (Anthropic, Fireworks, or Cerebras).

## What it does

- Polls the community Helldivers 2 API every 60 seconds
- Builds a normalized `WarSnapshot` with pre-computed strategic context (gambits, siege candidates, player spread, ramp-up detection)
- Sends the snapshot to the configured AI provider every 5 minutes for strategic recommendations
- Serves a React dashboard showing critical alerts, priority planets, gambit opportunities, and siege maps

## Stack

- **Backend:** Node.js 20 + Express + TypeScript
- **Frontend:** React 18 + Vite + Tailwind CSS + TanStack Query
- **AI:** Provider-configurable (Anthropic, Fireworks, or Cerebras)
- **Deployment:** Render (single web service — API + static frontend from one origin)

## Local development

```bash
# 1. Install dependencies
npm ci

# 2. Copy env and configure your provider
cp .env.example .env
# Edit .env: set AI_PROVIDER and the matching API key/model vars

# 3. Run server + client dev servers concurrently
npm run dev
```

The client dev server proxies `/api` to `localhost:8080`.

## Deployment (Render)

1. Connect your GitHub repo to Render
2. Render reads `render.yaml` and creates a Web Service
3. Set `AI_PROVIDER` and the matching provider API key in Render dashboard → Environment
4. Add `RENDER_DEPLOY_HOOK_URL` as a GitHub repo secret for the deploy workflow
5. Push to `main` — CI runs, then the deploy workflow triggers Render

### Cold start note

Render's free tier sleeps after 15 minutes idle. The first request after sleep returns a "warming up" state — the React client retries for up to 60 seconds. Upgrade to Render Starter ($7/mo) to eliminate sleep.

## Key design decisions

**Defense decay is null:** The community API surfaces a cosmetic "resistance %" for defense campaigns. This is meaningless and is force-nulled before any analysis. Defense campaigns are won only by reducing enemy health to 0 before the deadline.

**Raw HP, not percent:** Two planets at "50% liberation" can differ by 600,000+ HP depending on region count. All strategic reasoning uses `healthCurrent`/`healthMax` and `decayPerHourHp` — never liberation percent alone.

**Ramp-up detection:** When players shift to a new planet, liberation looks failing for ~2 hours while the playerbase stabilizes. The `rampingUp` flag suppresses false collapse alerts during this window.

**Impact multiplier:** Concentrating players on fewer planets at high difficulty is more effective than spreading thin. The agent warns about thin spread explicitly.

## Architecture

```
Poller (60s) → WarSnapshot cache → Analyzer (5min) → Recommendation cache
                      ↓                                       ↓
              GET /api/snapshot                  GET /api/recommendation
                      ↑                                       ↑
                  React SPA (polls every 60s, served from same origin)
```

See `docs/ARCHITECTURE.md` for full details.

## Docker

Build the image:

```bash
docker build -t helldivers-intel .
```

Run the container:

```bash
docker run --rm -p 8080:8080 \
  -e AI_PROVIDER=anthropic \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e HELLDIVERS_USER_AGENT="helldivers-intel/1.0 (docker)" \
  helldivers-intel

# Fireworks example
docker run --rm -p 8080:8080 \
  -e AI_PROVIDER=fireworks \
  -e FIREWORKS_API_KEY=... \
  -e FIREWORKS_MODEL=accounts/fireworks/models/deepseek-v3p1 \
  helldivers-intel

# Cerebras example
docker run --rm -p 8080:8080 \
  -e AI_PROVIDER=cerebras \
  -e CEREBRAS_API_KEY=... \
  -e CEREBRAS_MODEL=llama-4-scout-17b-16e-instruct \
  helldivers-intel
```

Health endpoint:

```bash
curl http://localhost:8080/api/health
```
