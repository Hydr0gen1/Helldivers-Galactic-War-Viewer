import { describe, it, expect } from 'vitest';
import { computeGambitViability } from '../src/domain/gambit.js';

describe('gambit viability', () => {
  it('returns high viability when liberation >= 60% and decay <= 5%', () => {
    const result = computeGambitViability({
      defensePlanetName: 'Draupnir',
      defenseHoursRemaining: 8,
      gambitPlanetName: 'Menkent',
      gambitLiberationPercent: 0.70,
      gambitDecayPerHourPercent: 4,
      gambitPlayerShare: 0.15,
    });
    expect(result.viability).toBe('high');
  });

  it('returns unviable when decay > 15%', () => {
    const result = computeGambitViability({
      defensePlanetName: 'Draupnir',
      defenseHoursRemaining: 8,
      gambitPlanetName: 'Menkent',
      gambitLiberationPercent: 0.25,
      gambitDecayPerHourPercent: 20,
      gambitPlayerShare: 0.05,
    });
    expect(result.viability).toBe('unviable');
  });

  it('returns unviable when player share < 2%', () => {
    const result = computeGambitViability({
      defensePlanetName: 'Draupnir',
      defenseHoursRemaining: 8,
      gambitPlanetName: 'Menkent',
      gambitLiberationPercent: 0.70,
      gambitDecayPerHourPercent: 3,
      gambitPlayerShare: 0.01,
    });
    expect(result.viability).toBe('unviable');
  });
});
