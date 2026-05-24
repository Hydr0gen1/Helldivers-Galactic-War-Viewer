import type { WarSnapshot } from '../api/types.js';
import type { Recommendation } from '../api/types.js';
import { timeAgo, formatNumber } from '../lib/format.js';

interface Props {
  snapshot: WarSnapshot;
  recommendation?: Recommendation;
}

export function WarStatusBanner({ snapshot, recommendation }: Props) {
  const hasApiError = Object.values(snapshot.apiHealth).some(s => s === 'error');
  const hasApiStale = Object.values(snapshot.apiHealth).some(s => s === 'stale');

  return (
    <div className="bg-gray-900 border-b border-gray-700 px-4 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-yellow-400 uppercase tracking-widest">
                Helldivers Intel
              </h1>
              <span className="text-gray-500 text-sm">War Day {snapshot.warDay}</span>
            </div>
            {recommendation?.overall_war_status && (
              <p className="text-gray-300 text-sm max-w-2xl">{recommendation.overall_war_status}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 text-sm">
            <span className="text-gray-400">
              {formatNumber(snapshot.totalActivePlayers)} active Helldivers
            </span>
            <span className="text-gray-500">
              Updated {timeAgo(snapshot.generatedAt)}
            </span>
            <div className="flex gap-2">
              {snapshot.staleSeconds > 90 && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded text-xs">
                  Live data delayed
                </span>
              )}
              {hasApiError && (
                <span
                  className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/50 rounded text-xs cursor-help"
                  title={`API issues: ${Object.entries(snapshot.apiHealth).filter(([,v]) => v === 'error').map(([k]) => k).join(', ')}`}
                >
                  Partial data
                </span>
              )}
              {!hasApiError && hasApiStale && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded text-xs">
                  Some data stale
                </span>
              )}
              {recommendation?.degraded && (
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/50 rounded text-xs">
                  Analysis degraded
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
