# Changelog

## [Unreleased]

### Added
- Curated gameplay knowledge base under `docs/DOMAIN_KNOWLEDGE.md` and `docs/game-mechanics/`.
- Repository root `AGENTS.md` with domain and validation guardrails.
- Containerization assets: `Dockerfile`, `.dockerignore`, `docker-compose.yml`.
- Docker CI workflow at `.github/workflows/docker.yml`.

### Changed
- Deployment docs and runtime guidance now center on self-hosted Docker and `/api/health`.
- Updated README with Docker build/run instructions.
- AI provider runtime now uses provider-agnostic abstraction with configurable model routing.
- Removed Anthropic SDK coupling from server runtime dependencies.
- Hardened self-host Docker runtime behavior (healthcheck startup tolerance, poller overlap protection, and CI ordering).
- Corrected analyzer provider `maxTokens` passthrough behavior.
- Updated strategic derived signal handling for gambit source selection and siege candidate coverage.
