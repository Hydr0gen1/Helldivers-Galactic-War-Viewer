# AGENTS.md

## Critical files
- `server/src/poller/snapshotBuilder.ts`
- `server/src/analyzer/prompt.ts`
- `server/src/poller/endpoints.ts`

Read `SPEC.md` and `docs/DOMAIN_KNOWLEDGE.md` before touching critical strategic logic.

## Domain constraints
- Defense decay values are cosmetic; preserve force-null behavior.
- Use raw HP/deltas for projection, not display liberation percentages.
- Preserve ramp-up suppression behavior (`rampingUp`).
- Treat High Priority Campaign early decay as potentially deceptive.

## Validation requirements
Run before handoff:
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `grep -r "sk-ant\|ANTHROPIC" client/dist/` (expect no matches)

## Repository scanning guidance
- Prefer targeted reads with `rg` + direct file opens.
- Avoid broad recursive crawling when possible.
- Prefer curated markdown under `docs/` over raw XML under `archive/wiki/`.

## Large/raw data to avoid recursively scanning
- `archive/wiki/HelldiversWiki.xml`
- build artifacts (`client/dist`, `server/dist`)
- dependency trees (`node_modules`)
