import type { Recommendation } from '../api/types.js';

type Gambit = Recommendation['gambit_opportunities'][number];

const viabilityStyles: Record<Gambit['viability'], string> = {
  high: 'text-green-400 border-green-500 bg-green-950/40',
  medium: 'text-yellow-400 border-yellow-500 bg-yellow-950/40',
  low: 'text-orange-400 border-orange-500 bg-orange-950/40',
  unviable: 'text-gray-500 border-gray-600 bg-gray-900/40',
};

interface Props {
  gambits: Gambit[];
}

export function GambitPanel({ gambits }: Props) {
  return (
    <div>
      <h2 className="text-gray-400 font-bold uppercase text-sm tracking-widest mb-3">Gambit Opportunities</h2>
      {gambits.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded p-4 text-center text-gray-500 text-sm">
          No gambits detected
        </div>
      ) : (
        <div className="space-y-3">
          {gambits.map((g, i) => (
            <div key={i} className={`border rounded p-3 ${viabilityStyles[g.viability]}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-bold">{g.viability}</span>
              </div>
              <div className="text-sm font-mono text-white">
                {g.gambit_planet}
                <span className="text-gray-500 mx-2">→</span>
                {g.defense_planet}
              </div>
              <div className="text-xs text-gray-400 mt-1">{g.reasoning}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
