import { describe, it, expect } from 'vitest';
import { buildSnapshot } from '../src/poller/snapshotBuilder.js';
import type { WarStatus, Campaign, Planet } from '../src/poller/endpoints.js';

const baseWarStatus: WarStatus = { started: new Date(Date.now() - 10 * 86400000).toISOString(), factions: [], impactMultiplier: 1 };

const basePlanet = (overrides: Partial<Planet> = {}): Planet => ({
  index: 1,
  name: 'Test Planet',
  faction: 'Terminids',
  players: 1000,
  health: 500000,
  maxHealth: 1000000,
  regenPerSecond: 0,
  attacking: [],
  waypoints: [],
  active: true,
  regions: [],
  disabled: false,
  ...overrides,
});

const baseCampaign = (planet: Planet, type: number): Campaign => ({
  id: 1,
  planet,
  type,
  count: 0,
});

// Test 1: Defense campaign must have null decay
describe('snapshotBuilder', () => {
  it('forces decayPerHourPercent to null for defense campaigns', () => {
    const planet = basePlanet({ regenPerSecond: 100, faction: 'Terminids' });
    const campaign = baseCampaign(planet, 1); // type 1 = defense
    const snapshot = buildSnapshot(baseWarStatus, [planet], [campaign], [], 0, {
      warStatus: 'ok', planets: 'ok', campaigns: 'ok', assignments: 'ok'
    });
    const c = snapshot.campaigns[0];
    expect(c.campaignType).toBe('defense');
    expect(c.decayPerHourPercent).toBeNull();
    expect(c.decayPerHourHp).toBeNull();
  });

  // Test 2: Liberation campaign on regionless planet has healthMax 1,000,000
  it('sets healthMax to 1,000,000 for regionless liberation planet', () => {
    const planet = basePlanet({ maxHealth: 1000000, regions: [] });
    const campaign = baseCampaign(planet, 0); // type 0 = liberation
    const snapshot = buildSnapshot(baseWarStatus, [planet], [campaign], [], 0, {
      warStatus: 'ok', planets: 'ok', campaigns: 'ok', assignments: 'ok'
    });
    expect(snapshot.campaigns[0].healthMax).toBe(1_000_000);
  });

  // Test 3: Planet with no SE-controlled warp neighbors → isolatedFromSuperEarth: true
  it('sets isolatedFromSuperEarth true when all warp neighbors are enemy-held', () => {
    const neighbor: Planet = basePlanet({ index: 2, name: 'Enemy Planet', faction: 'Terminids', waypoints: [] });
    const planet = basePlanet({ index: 1, waypoints: [2], faction: 'Terminids' });
    const campaign = baseCampaign(planet, 0); // liberation
    const snapshot = buildSnapshot(baseWarStatus, [planet, neighbor], [campaign], [], 0, {
      warStatus: 'ok', planets: 'ok', campaigns: 'ok', assignments: 'ok'
    });
    expect(snapshot.campaigns[0].isolatedFromSuperEarth).toBe(true);
  });
});
