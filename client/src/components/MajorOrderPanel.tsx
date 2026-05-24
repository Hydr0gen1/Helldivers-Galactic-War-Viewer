import type { MajorOrder, Recommendation } from '../api/types.js';
import { formatHours, formatPercent } from '../lib/format.js';

const outlookStyles = {
  on_track: 'bg-green-500/20 text-green-400 border-green-500/50',
  at_risk: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  failing: 'bg-red-500/20 text-red-400 border-red-500/50',
  no_mo: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
};

interface Props {
  majorOrders: MajorOrder[];
  moStatus: Recommendation['major_order_status'];
}

export function MajorOrderPanel({ majorOrders, moStatus }: Props) {
  if (!moStatus.active || majorOrders.length === 0) return null;

  const mo = majorOrders[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="bg-yellow-950/20 border border-yellow-500/50 rounded p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-400 font-bold uppercase text-sm tracking-widest">
                Major Order
              </span>
              <span className={`px-2 py-0.5 text-xs border rounded ${outlookStyles[moStatus.outlook]}`}>
                {moStatus.outlook.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{mo.title}</h2>
          </div>
          {moStatus.hours_remaining !== null && (
            <div className="text-right shrink-0">
              <div className="text-lg font-mono font-bold text-yellow-400">
                {formatHours(moStatus.hours_remaining)}
              </div>
              <div className="text-xs text-gray-500">remaining</div>
            </div>
          )}
        </div>

        <p className="text-gray-300 text-sm mb-4">{mo.briefing}</p>

        {mo.progress.length > 0 && (
          <div className="space-y-2 mb-4">
            {mo.progress.map((p, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{p.planetName ?? `Objective ${i + 1}`}</span>
                  <span>{formatPercent(p.percent)}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all"
                    style={{ width: `${Math.min(100, p.percent * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {moStatus.required_planets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Required planets:</span>
            {moStatus.required_planets.map(planet => (
              <button
                key={planet}
                onClick={() => {
                  document.getElementById(`planet-${planet}`)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded text-xs hover:bg-yellow-500/30 transition-colors"
              >
                {planet}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
