import { describe, expect, it } from 'vitest';
import { buildSnapshot, majorOrderTaskTypeFromInt, extractRelevantPlanetIds } from '../src/poller/snapshotBuilder.js';
import type { Assignment, Campaign, Planet, WarStatus } from '../src/poller/endpoints.js';

const baseWarStatus: WarStatus = { started: new Date(Date.now() - 86400000).toISOString(), factions: [], impactMultiplier: 1 };
const basePlanet: Planet = {
  index: 1,
  name: 'Test',
  faction: 'Terminids',
  players: 100,
  health: 500000,
  maxHealth: 1000000,
  regenPerSecond: 0,
  attacking: [],
  waypoints: [],
  active: true,
  regions: [],
  disabled: false,
};
const baseCampaign: Campaign = { id: 1, planet: basePlanet, type: 0, count: 0 };

function buildWithAssignment(assignment: Assignment) {
  return buildSnapshot(baseWarStatus, [basePlanet], [baseCampaign], [assignment], 0, {
    warStatus: 'ok', planets: 'ok', campaigns: 'ok', assignments: 'ok'
  });
}

describe('major order normalization', () => {
  it('maps liberation task and extracts planet id', () => {
    const snapshot = buildWithAssignment({
      id: 100,
      tasks: [{ type: 11, values: [1, 200000], valueTypes: [12, 3] }],
      progress: [50000],
      expiration: new Date(Date.now() + 3600000).toISOString(),
    });
    expect(snapshot.majorOrders[0].progress[0].type).toBe('liberation');
    expect(snapshot.majorOrders[0].relevantPlanetIds).toEqual([1]);
  });

  it('maps defense task and deduplicates planet ids', () => {
    const ids = extractRelevantPlanetIds([
      { type: 12, values: [5, 5], valueTypes: [12, 12] },
      { type: 12, values: [5], valueTypes: [12] },
    ]);
    expect(ids).toEqual([5]);
    expect(majorOrderTaskTypeFromInt(12)).toBe('defense');
  });

  it('maps kill-count and does not invent planet ids', () => {
    const snapshot = buildWithAssignment({
      id: 101,
      tasks: [{ type: 2, values: [1000000], valueTypes: [5] }],
      progress: [100],
    });
    expect(snapshot.majorOrders[0].progress[0].type).toBe('kill_count');
    expect(snapshot.majorOrders[0].relevantPlanetIds).toEqual([]);
  });

  it('maps unknown type to other', () => {
    expect(majorOrderTaskTypeFromInt(9999)).toBe('other');
  });
});
