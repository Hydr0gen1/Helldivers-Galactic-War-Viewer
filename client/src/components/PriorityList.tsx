import type { NormalizedCampaign, Recommendation } from '../api/types.js';
import { PriorityCard } from './PriorityCard.js';

interface Props {
  priorities: Recommendation['priority_planets'];
  campaigns: NormalizedCampaign[];
}

export function PriorityList({ priorities, campaigns }: Props) {
  if (priorities.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded p-6 text-center text-gray-500">
        No priority planets identified
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-gray-400 font-bold uppercase text-sm tracking-widest">Priority Planets</h2>
      {priorities.map(p => {
        const campaign = campaigns.find(c => c.planetName === p.planet);
        return <PriorityCard key={p.planet} priority={p} campaign={campaign} />;
      })}
    </div>
  );
}
