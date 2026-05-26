# Changelog

## [Unreleased]

### Added
- Added local-only `.secrets.env` pattern for API keys and provider secrets.
- Curated gameplay knowledge base under `docs/DOMAIN_KNOWLEDGE.md` and `docs/game-mechanics/`.
- Frontend War Archive UI tab with archive summary cards, recent events, planet archive browser, selected-planet history panel, campaign summaries, and order archive sections.
- Repository root `AGENTS.md` with domain and validation guardrails.
- Containerization assets: `Dockerfile`, `.dockerignore`, `docker-compose.yml`.
- Docker CI workflow at `.github/workflows/docker.yml`.
- Major Order task typing and planet linking when task data can be confidently decoded.

### Changed
- Removed unused `FIREWORKS_EXTRA_HEADERS_JSON` placeholder from secrets example and docs.
- Deployment docs and runtime guidance now center on self-hosted Docker and `/api/health`.
- README/agent-facing guidance updated for Docker-first, provider-agnostic operation.
- AI provider runtime now uses provider abstraction across Anthropic, Fireworks, and Cerebras.
- Removed Anthropic SDK coupling; Anthropic calls now use raw HTTP/fetch.
- Corrected analyzer provider `maxTokens` passthrough behavior.
- Hardened Docker Compose/runtime behavior for long-running self-hosting.
- Improved poller cache/stale fallback behavior during endpoint failures.
- Added graceful shutdown behavior for cleaner runtime termination.
- Unknown `/api/*` routes now return consistent JSON 404 responses.
- Poller concurrency protections prevent overlapping poll cycles.
- Updated strategic signal handling: gambit detection now uses actual attack source data.
- Expanded siege candidate coverage to include enemy-held non-campaign planets.

### Added
- Local War Chronicle structured logging foundation using better-sqlite3 with Docker-persisted /app/data volume.
- Chronicle schema/indexes are archive-oriented for future filtering by planet, campaign type, event type, major-order metadata, and timeline windows.

## Unreleased
- feat: add read-only War Archive API endpoints over local War Chronicle SQLite facts.

- Optional self-hosted auto-update polling via GitHub repo checks is documented in README.

- Minor Order archive section now renders from `minor_order_active` archive events when present, otherwise shows an explicit unavailable state.
- Added lightweight local SVG battle-history charts (liberation progress, efficiency, player concentration, HP remaining) for selected planet history.
- AI-written History Book generation remains intentionally unimplemented (future stage).
