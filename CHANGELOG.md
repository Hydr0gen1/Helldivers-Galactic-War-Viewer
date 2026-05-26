# Changelog

## [Unreleased]

### Added
- Curated gameplay knowledge base under `docs/DOMAIN_KNOWLEDGE.md` and `docs/game-mechanics/`.
- Repository root `AGENTS.md` with domain and validation guardrails.
- Containerization assets: `Dockerfile`, `.dockerignore`, `docker-compose.yml`.
- Docker CI workflow at `.github/workflows/docker.yml`.
- Major Order task typing and planet linking when task data can be confidently decoded.

### Changed
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
