# AGENTS.md

## Critical files
- `server/src/poller/snapshotBuilder.ts`
- `server/src/analyzer/prompt.ts`
- `server/src/poller/endpoints.ts`
- `server/src/poller/index.ts`
- `server/src/analyzer/providers/`

Read `docs/DOMAIN_KNOWLEDGE.md` and relevant `docs/game-mechanics/` files before touching strategic logic.

## Sensitive Logic
Do **not** casually modify:
- snapshot normalization math
- decay interpretation logic
- ramp-up suppression logic (`rampingUp`)
- strategic projection heuristics
- analyzer system prompts

If changes are required, review tests first and document reasoning in the PR.

## Secrets handling for agents
- Do not read, print, summarize, modify, or request contents of `.secrets.env` or any file matching `.secrets*.env`, except `.secrets.example.env`.
- Use `.secrets.example.env` for documentation and examples.
- Never include real API keys in commits, tests, logs, PR bodies, screenshots, or generated docs.
- If a task needs provider config, reference environment variable names only.

## Deployment/runtime guidance
- Primary deployment target is self-hosted Docker.
- Preferred self-host convenience startup command: `npm run dive`.
- Optional themed shutdown command: `npm run extract`.
- Explicit Docker Compose shutdown alias: `npm run dive:down`.
- All npm runtime aliases wrap Docker Compose; direct Docker Compose commands are still valid.
- Render is not required.
- Application listens on port `8080`.
- Health endpoint: `/api/health`.
- Unknown `/api/*` routes should remain JSON 404.
- Secrets and provider keys are runtime-only (never baked into images/bundles).

## Provider guidance
- Provider logic must remain provider-agnostic.
- Supported providers: `anthropic`, `fireworks`, `cerebras`.
- Anthropic support is optional and must not be treated as mandatory.
- Anthropic SDK should not be reintroduced without explicit justification.
- `AI_PROVIDER` determines which provider key is required.
- Preserve current `AI_PROVIDER` validation semantics.

## Critical domain logic constraints
- Preserve defense decay/resistance force-nulling behavior.
- Preserve raw HP-based strategic math and projection.
- Preserve ramp-up suppression behavior (`rampingUp`).
- Preserve High Priority Campaign early-decay caution.
- Preserve actual-attack-source gambit logic using `attacking[]`.
- Preserve siege candidate coverage for enemy-held non-campaign planets.
- Preserve Major Order task typing and relevant planet extraction logic; uncertain mappings must safely default to `other` / ignored behavior.

## Knowledge sources
- Preferred references: `docs/DOMAIN_KNOWLEDGE.md` and `docs/game-mechanics/`.
- Raw wiki archive location: `archive/wiki/Helldivers+Wiki-20260523235840.xml`.
- Consult XML only when curated docs are insufficient.

## Validation
Run before handoff:
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm test`
- `docker build -t helldivers-intel .` (when Docker is available)

## Repository scanning guidance
- Prefer targeted reads with `rg` + direct file opens.
- Avoid broad recursive crawling when possible.
- Prefer curated markdown docs before raw XML.
- Avoid broad recursive scans of raw XML.

## Large/raw data to avoid recursively scanning
- `archive/wiki/Helldivers+Wiki-20260523235840.xml`
- build artifacts (`client/dist`, `server/dist`)
- dependency trees (`node_modules`)


## War Chronicle note
- Chronicle storage is local-only SQLite at /app/data/helldivers-intel.sqlite with Docker volume persistence (helldivers-data).

- War Chronicle logging, War Archive API, and War Archive UI are implemented. AI-written History Book narrative generation remains future work.
- Any future narrative output must be derived from logged structured facts, not invented events.

## War Archive API
- `/api/archive/*` endpoints expose read-only historical facts from local Chronicle SQLite.
- Frontend War Archive UI is implemented and reads `/api/archive` endpoints. AI-written History Book remains future work.

- Optional self-hosted auto-update polling is acceptable for server deployments; preserve local .env secrets and volume-backed chronicle data.


## War Archive UI status
- Stage 3 (frontend War Archive UI) is now implemented in the client and reads `/api/archive` endpoints.
- Minor Order history may be unavailable from current upstream data; UI must keep showing a clean empty state when absent.
- AI-written History Book narrative generation remains future work and is intentionally not implemented.
