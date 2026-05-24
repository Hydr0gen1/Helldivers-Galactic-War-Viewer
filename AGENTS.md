# AGENTS.md

## Critical files
- `server/src/poller/snapshotBuilder.ts`
- `server/src/analyzer/prompt.ts`
- `server/src/poller/endpoints.ts`

Read `SPEC.md`, `docs/DOMAIN_KNOWLEDGE.md`, and relevant `docs/game-mechanics/` files before touching strategic logic.

## Sensitive Logic
Do **not** casually modify:
- snapshot normalization math
- decay interpretation logic
- ramp-up suppression logic (`rampingUp`)
- strategic projection heuristics
- analyzer system prompts

If changes are required, review tests first and document reasoning in the PR.

## Domain constraints
- Defense decay values are cosmetic; preserve force-null behavior.
- Use raw HP/deltas for projection, not display liberation percentages.
- Preserve ramp-up suppression behavior (`rampingUp`).
- Treat High Priority Campaign early decay as potentially deceptive.

## Knowledge sources
- Preferred references: `docs/DOMAIN_KNOWLEDGE.md` and `docs/game-mechanics/`.
- Raw wiki archive location: `archive/wiki/HelldiversWiki.xml`.
- Consult the XML only when curated docs are insufficient.

## Docker Runtime Expectations
- Application listens on port `8080`.
- Health endpoint: `/api/health`.
- Runtime container must use a non-root user.
- Secrets are runtime-only (never baked into images/bundles).
- Deployment target: Render Docker web service.

## Validation
Run before handoff:
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `docker build -t helldivers-intel .`

## Repository scanning guidance
- Prefer targeted reads with `rg` + direct file opens.
- Avoid broad recursive crawling when possible.
- Prefer curated markdown docs before raw XML.

## Large/raw data to avoid recursively scanning
- `archive/wiki/HelldiversWiki.xml`
- build artifacts (`client/dist`, `server/dist`)
- dependency trees (`node_modules`)
