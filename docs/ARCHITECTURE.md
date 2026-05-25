# Architecture

Helldivers Intel is a self-hosted, Docker-first application that serves a React frontend and Express API from a single Node.js 20 runtime container.

## Runtime topology

- Single container process hosts:
  - Express API (`/api/*`)
  - Built React SPA static assets
- Default listener: `0.0.0.0:8080`
- Health endpoint: `GET /api/health`
- Unknown `/api/*` routes return JSON 404

## Data flow

1. **Poller** fetches Helldivers community API endpoints and updates a cached normalized snapshot.
2. **SnapshotBuilder** computes strategic derived data (gambits, siege candidates, ramp-up state, player spread, campaign projections).
3. **Analyzer** sends a compact projection payload to the selected AI provider (`anthropic`, `fireworks`, or `cerebras`) on interval and caches recommendation output.
4. **API** serves snapshot/recommendation/health for the SPA and external consumers.

## AI provider model

Provider selection is controlled by `AI_PROVIDER`:

- `anthropic`
- `fireworks`
- `cerebras`

Only the selected provider’s API key is required at runtime. Keys are server-side only and must never be exposed to client assets or baked into images.

Anthropic support is optional and provider logic remains provider-agnostic.

## Domain invariants

- Defense campaign decay/resistance values are cosmetic and force-nulled for strategy.
- Strategic projections prioritize raw HP and HP deltas, not display liberation percentages.
- Ramp-up suppression (`rampingUp`) prevents false immediate-failure alerts after player migration.
- High Priority Campaign early decay can be deceptive and should be interpreted cautiously.
- Gambit detection uses actual attack-source (`attacking[]`) data.
- Siege detection includes enemy-held non-campaign planets when strategically relevant.

## Reliability behavior

- Poller concurrency is guarded to prevent overlapping poll runs.
- Snapshot/recommendation cache behavior uses stale-aware fallback for transient failures.
- Graceful shutdown drains runtime services predictably.
- Docker healthcheck supports cold-start grace while first snapshot is being built.

## Deployment model

Primary target is self-hosted Docker (home server, VPS, or private infra). Render-specific deployment assumptions are intentionally removed.
