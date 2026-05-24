# Domain Knowledge: Helldivers 2 Galactic War (Engineering Notes)

This project depends on mechanic-aware interpretation of community API data.

## Load-bearing rules

- Defense campaign decay values are cosmetic and must not drive projections.
- Displayed liberation % is a UI abstraction; strategic math must use raw HP and HP deltas.
- Planet liberation has a ramp-up stabilization window (~2 hours) after player migration.
- High Priority Campaign early decay values are often misleading until hidden thresholds are crossed.

## Implementation guardrails

- Preserve normalization assumptions in `server/src/poller/snapshotBuilder.ts`.
- Preserve analyzer prompt constraints in `server/src/analyzer/prompt.ts`.
- Read topical mechanic docs under `docs/game-mechanics/` before changing campaign logic.


## Source snapshot

- Curated gameplay docs in `docs/game-mechanics/` are aligned to the wiki export at `archive/wiki/Helldivers+Wiki-20260523235840.xml` (page: `Second Galactic War Mechanics`).
