# Architecture

See the full technical specification in the project spec document. Key sections:

## Data flow

1. **Poller** fetches `/war/status`, `/planets`, `/campaigns`, `/assignments` sequentially with a 10s minimum gap between requests
2. **SnapshotBuilder** normalizes raw API data into `WarSnapshot`, computing: decay rates (liberation only), gambit viability, siege candidates, isolation flags, ramp-up state, player spread classification
3. **Analyzer** sends a stripped snapshot projection to Claude Haiku every 5 minutes and caches the `Recommendation` JSON
4. **API** serves `/api/snapshot`, `/api/recommendation`, `/api/health` to the React SPA

## Critical invariants

- Defense campaigns MUST have `decayPerHourPercent: null` — community API value is cosmetic
- All strategic reasoning uses raw `healthCurrent`/`healthMax`, not `liberationPercent`
- The Anthropic key never reaches the client bundle
- All player traffic goes to our `/api/*`, never directly to `helldivers2.dev`

## Caching

All data uses stale-while-revalidate: values stay fresh for the poll interval, then stale for a grace period. The UI shows amber/red badges when data is stale/errored.

## Error handling

- Per-endpoint failures fall back to cached values
- Haiku failures keep the previous recommendation with `degraded: true`
- Bad Haiku JSON goes through `repair.ts` before keeping previous
- Cold start: 503 `{ status: 'warming_up' }` for up to 3 polls (~3 min)
