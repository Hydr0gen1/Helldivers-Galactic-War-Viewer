import type { SiegeCandidate } from '../api/types.js';

interface Props {
  siegeCandidates: SiegeCandidate[];
}

export function SiegeMap({ siegeCandidates }: Props) {
  return (
    <div>
      <h2 className="text-gray-400 font-bold uppercase text-sm tracking-widest mb-3">Siege Opportunities</h2>
      {siegeCandidates.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded p-4 text-sm text-gray-500">
          <p className="mb-2">No siege candidates detected.</p>
          <p className="text-xs">
            A siege occurs when all warp links to an enemy planet are cut by Super Earth.
            Sieged planets self-liberate at ~0.5%/hr.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {siegeCandidates.map((s, i) => (
            <div key={i} className="border border-gray-600 bg-gray-900 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-sm">{s.planetName}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  s.uncutLinks === 0
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {s.uncutLinks === 0 ? 'SIEGED' : `${s.uncutLinks} link${s.uncutLinks !== 1 ? 's' : ''} remaining`}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {s.warpLinkNeighbors.map(n => (
                  <span
                    key={n.name}
                    className={`text-xs px-2 py-0.5 rounded border ${
                      n.controlledBySuperEarth
                        ? 'border-yellow-500/50 text-yellow-400'
                        : 'border-red-500/50 text-red-400'
                    }`}
                  >
                    {n.name} {n.controlledBySuperEarth ? '✓' : '✗'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
