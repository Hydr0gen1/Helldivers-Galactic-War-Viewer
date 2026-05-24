import { describe, it, expect } from 'vitest';
import { computeSiegeCandidate } from '../src/domain/siege.js';

describe('siege detection', () => {
  it('returns uncutLinks 0 and estimatedHoursToSiege 0 when all SE neighbors', () => {
    const result = computeSiegeCandidate({
      planetName: 'Meridia',
      faction: 'Terminids',
      warpLinkNeighbors: [
        { name: 'Fenrir III', controlledBySuperEarth: true },
        { name: 'Klen Dahth II', controlledBySuperEarth: true },
      ],
    });
    expect(result).not.toBeNull();
    expect(result!.uncutLinks).toBe(0);
    expect(result!.estimatedHoursToSiege).toBe(0);
  });

  it('returns null when planet has 2 uncut links', () => {
    const result = computeSiegeCandidate({
      planetName: 'Target',
      faction: 'Automatons',
      warpLinkNeighbors: [
        { name: 'A', controlledBySuperEarth: false },
        { name: 'B', controlledBySuperEarth: false },
      ],
    });
    expect(result).toBeNull();
  });
});
