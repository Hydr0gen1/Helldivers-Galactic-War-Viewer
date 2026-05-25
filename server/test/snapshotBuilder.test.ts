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
  id: planet.index,
  planet,
  type,
  count: 0,
});

describe('snapshotBuilder', () => {
  it('forces decayPerHourPercent to null for defense campaigns', () => {
    const planet = basePlanet({ regenPerSecond: 100, faction: 'Terminids' });
    const campaign = baseCampaign(planet, 1);
    const snapshot = buildSnapshot(baseWarStatus, [planet], [campaign], [], 0, {
      warStatus: 'ok', planets: 'ok', campaigns: 'ok', assignments: 'ok'
    });
    const c = snapshot.campaigns[0];
    expect(c.campaignType).toBe('defense');
    expect(c.decayPerHourPercent).toBeNull();
    expect(c.decayPerHourHp).toBeNull();
  });

  it('sets healthMax to 1,000,000 for regionless liberation planet', () => {
    const planet = basePlanet({ maxHealth: 1000000, regions: [] });
    const campaign = baseCampaign(planet, 0);
    const snapshot = buildSnapshot(baseWarStatus, [planet], [campaign], [], 0, {
      warStatus: 'ok', planets: 'ok', campaigns: 'ok', assignments: 'ok'
    });
    expect(snapshot.campaigns[0].healthMax).toBe(1_000_000);
  });

  it('sets isolatedFromSuperEarth true when all warp neighbors are enemy-held', () => {
    const neighbor: Planet = basePlanet({ index: 2, name: 'Enemy Planet', faction: 'Terminids', waypoints: [] });
    const planet = basePlanet({ index: 1, waypoints: [2], faction: 'Terminids' });
    const campaign = baseCampaign(planet, 0);
    const snapshot = buildSnapshot(baseWarStatus, [planet, neighbor], [campaign], [], 0, {
      warStatus: 'ok', planets: 'ok', campaigns: 'ok', assignments: 'ok'
    });
    expect(snapshot.campaigns[0].isolatedFromSuperEarth).toBe(true);
  });

  it('uses attacking[] source data for gambit candidates', () => {
    const defended = basePlanet({ index: 1, name: 'Aegis', faction: 'Humans', waypoints: [2, 3] });
    const attacker = basePlanet({ index: 2, name: 'Boreal', faction: 'Terminids', attacking: [1], waypoints: [1], players: 500 });
    const warpOnly = basePlanet({ index: 3, name: 'Cygnus', faction: 'Terminids', attacking: [], waypoints: [1], players: 400 });

    const campaigns = [
      baseCampaign(defended, 1),
      baseCampaign(attacker, 0),
      baseCampaign(warpOnly, 0),
    ];

    const snapshot = buildSnapshot(baseWarStatus, [defended, attacker, warpOnly], campaigns, [], 0, {
      warStatus: 'ok', planets: 'ok', campaigns: 'ok', assignments: 'ok'
    });

    const gambitSources = snapshot.derived.viableGambits.map(g => g.gambitPlanetName);
    expect(gambitSources).toContain('Boreal');
    expect(gambitSources).not.toContain('Cygnus');
  });

  it('includes enemy-held non-campaign planets in siege candidates', () => {
    const target = basePlanet({ index: 10, name: 'Cutoff', faction: 'Automatons', waypoints: [11, 12] });
    const ally1 = basePlanet({ index: 11, name: 'Ally One', faction: 'Humans', waypoints: [10] });
    const ally2 = basePlanet({ index: 12, name: 'Ally Two', faction: 'Humans', waypoints: [10] });

    const activeCampaignPlanet = basePlanet({ index: 20, name: 'Active Front', faction: 'Terminids' });
    const snapshot = buildSnapshot(
      baseWarStatus,
      [target, ally1, ally2, activeCampaignPlanet],
      [baseCampaign(activeCampaignPlanet, 0)],
      [],
      0,
      { warStatus: 'ok', planets: 'ok', campaigns: 'ok', assignments: 'ok' }
    );

    expect(snapshot.derived.siegeCandidates.some(c => c.planetName === 'Cutoff')).toBe(true);
  });
});
