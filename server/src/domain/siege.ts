import type { SiegeCandidate } from './types.js';

export interface SiegeInput {
  planetName: string;
  faction: string;
  warpLinkNeighbors: Array<{ name: string; controlledBySuperEarth: boolean }>;
}

export function computeSiegeCandidate(input: SiegeInput): SiegeCandidate | null {
  const uncutLinks = input.warpLinkNeighbors.filter(n => !n.controlledBySuperEarth).length;
  // Only eligible if uncutLinks <= 1
  if (uncutLinks > 1) return null;
  return {
    planetName: input.planetName,
    faction: input.faction,
    warpLinkNeighbors: input.warpLinkNeighbors,
    uncutLinks,
    estimatedHoursToSiege: uncutLinks === 0 ? 0 : null,
  };
}
