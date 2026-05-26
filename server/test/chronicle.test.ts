import { describe, expect, it } from 'vitest';
import { createChronicleDb } from '../src/chronicle/db.js';
import { detectWarEvents } from '../src/chronicle/eventDetector.js';
import { toCampaignProgressRow, type ChronicleDb, type CampaignProgressRow, type WarEventRow } from '../src/chronicle/types.js';
import { createWarChronicle } from '../src/chronicle/warChronicle.js';
import type { WarSnapshot } from '../src/domain/types.js';

class FakeDb {
  public createdSql = '';
  public campaignRows: CampaignProgressRow[] = [];
  public eventRows: WarEventRow[] = [];
  public latestByCampaignKey = new Map<string, unknown>();

  pragma(): void {}
  exec(sql: string): void { this.createdSql = sql; }
  prepare(sql: string): { run: (params?: unknown) => unknown; get: (params?: unknown) => unknown; all: (params?: unknown) => unknown[] } {
    if (sql.startsWith('SELECT timestamp')) {
      return { run: () => undefined, get: (params) => { const [planetId, campaignType] = params as [number, string]; return this.latestByCampaignKey.get(`${planetId}:${campaignType}`); }, all: () => [] };
    }
    if (sql.startsWith('INSERT INTO campaign_progress_log')) {
      return { run: (params) => { this.campaignRows.push(params as CampaignProgressRow); return undefined; }, get: () => undefined, all: () => [] };
    }
    if (sql.startsWith('INSERT INTO war_events')) {
      return { run: (params) => { this.eventRows.push(params as WarEventRow); return undefined; }, get: () => undefined, all: () => [] };
    }
    return { run: () => undefined, get: () => undefined, all: () => [] };
  }
  transaction<T>(fn: (value: T) => void): (value: T) => void { return (value) => fn(value); }
  close(): void {}
}

function snapshot(at: string): WarSnapshot {
  return {
    generatedAt: at,
    warDay: 1,
    staleSeconds: 0,
    apiHealth: { warStatus: 'ok', planets: 'ok', campaigns: 'ok', assignments: 'ok' },
    totalActivePlayers: 10000,
    topPlanetsByPlayers: [{ planet: 'Veld', players: 2000, share: 0.2 }],
    majorOrders: [{ id: 'mo-1', title: 'Defend Worlds', briefing: '', expiresAt: at, hoursRemaining: 24, progress: [], relevantPlanetIds: [] }],
    campaigns: [{
      planetId: 101, planetName: 'Veld', faction: 'Terminids', campaignType: 'defense', healthCurrent: 800000, healthMax: 1000000,
      liberationPercent: 0.80, decayPerHourPercent: null, decayPerHourHp: null, defenseDeadline: null, hoursRemaining: 2,
      playersOnPlanet: 2000, playerShare: 0.2, regions: [], warpLinks: [], warpLinkPlanetNames: [], isolatedFromSuperEarth: false,
      rampingUp: false, rampUpUntil: null, isHighPriority: false,
    }],
    derived: {
      defensesEndingSoon: [{ planetName: 'Veld', faction: 'Terminids', hoursRemaining: 2, healthPercent: 80, playerShare: 0.2, outcomeRisk: 'critical' }],
      viableGambits: [{ defensePlanetName: 'Veld', defenseHoursRemaining: 2, gambitPlanetName: 'Gatria', gambitDecayPerHourPercent: 3, gambitHealthPercent: 55, gambitPlayerShare: 0.08, viability: 'high', viabilityReason: 'test' }],
      siegeCandidates: [{ planetName: 'Aesir Pass', faction: 'Automatons', warpLinkNeighbors: [], uncutLinks: 1, estimatedHoursToSiege: 3 }],
      playerSpread: 'balanced',
    },
  };
}

describe('chronicle', () => {
  it('initializes schema and index SQL', () => {
    const fake = new FakeDb();
    const db = createChronicleDb('/tmp/chronicle.sqlite', function Ctor() { return fake; } as unknown as new (dbPath: string) => FakeDb);
    expect(db.ensureReady()).toBe(true);
    expect(fake.createdSql).toContain('CREATE TABLE IF NOT EXISTS campaign_progress_log');
    expect(fake.createdSql).toContain('CREATE TABLE IF NOT EXISTS war_events');
    expect(fake.createdSql).toContain('idx_campaign_progress_log_timestamp');
    expect(fake.createdSql).toContain('idx_war_events_planet_id');
  });

  it('logs campaign progress and computes efficiency deltas', () => {
    const fake = new FakeDb();
    fake.latestByCampaignKey.set('101:defense', { timestamp: '2026-05-26T00:00:00.000Z', liberation_percent: 0.78, health_current: 900000, player_share: 0.12, players_on_planet: 1200 });
    const db = createChronicleDb('/tmp/chronicle.sqlite', function Ctor() { return fake; } as unknown as new (dbPath: string) => FakeDb);
    const chronicle = createWarChronicle({ enabled: true, retentionDays: 30, db });

    chronicle.logWarSnapshot(snapshot('2026-05-26T01:00:00.000Z'));

    expect(fake.campaignRows).toHaveLength(1);
    expect(fake.campaignRows[0].liberation_delta_per_hour).toBeCloseTo(0.02);
    expect(fake.campaignRows[0].health_delta_per_hour).toBeCloseTo(-100000);
    expect(fake.campaignRows[0].player_share_delta).toBeCloseTo(0.08);
    expect(fake.campaignRows[0].players_delta).toBe(800);
    expect(fake.campaignRows[0].planet_id).toBe(101);
    expect(fake.campaignRows[0].campaign_type).toBe('defense');

    expect(fake.eventRows.length).toBeGreaterThan(0);
    const defenseEvent = fake.eventRows.find((event) => event.event_type === 'defense_critical');
    expect(defenseEvent).toBeDefined();
    expect(defenseEvent?.timestamp).toBe('2026-05-26T01:00:00.000Z');
    expect(defenseEvent?.planet_id).toBe(101);
  });

  it('detects requested safe subset events', () => {
    const rows = [{
      timestamp: '2026-05-26T01:00:00.000Z', planet_id: 101, planet_name: 'Veld', campaign_type: 'defense', faction: 'Terminids',
      health_current: 800000, health_max: 1000000, liberation_percent: 0.80, decay_per_hour_hp: null, player_share: 0.2, players_on_planet: 2000,
      hours_remaining: 2, ramping_up: 0, is_high_priority: 0, liberation_delta_per_hour: 0.03, health_delta_per_hour: -1000, player_share_delta: 0.1, players_delta: 7000,
    }];
    const events = detectWarEvents({ snapshot: snapshot('2026-05-26T01:00:00.000Z'), currentRows: rows, previousByCampaignKey: new Map([['101:defense', { timestamp: '2026-05-26T00:00:00.000Z', liberation_percent: 0.79, health_current: 810000, player_share: 0.1, players_on_planet: 1000 }]]) });
    expect(events.map((e) => e.event_type)).toEqual(expect.arrayContaining(['defense_critical', 'gambit_opened', 'siege_opportunity', 'major_order_active', 'player_surge', 'campaign_stalled']));

    const majorOrderEvent = events.find((event) => event.event_type === 'major_order_active');
    expect(majorOrderEvent).toBeDefined();
    const majorOrderPayload = JSON.parse(majorOrderEvent!.data_json) as {
      majorOrderId: string;
      title: string;
      relevantPlanetIds: number[];
      progress: Array<{ type: string; current: number; target: number; percent: number }>;
      expiresAt: string;
      hoursRemaining: number;
    };
    expect(majorOrderPayload.majorOrderId).toBe('mo-1');
    expect(Array.isArray(majorOrderPayload.relevantPlanetIds)).toBe(true);
    expect(Array.isArray(majorOrderPayload.progress)).toBe(true);
  });

  it('deduplicates identical major_order_active events within a snapshot', () => {
    const base = snapshot('2026-05-26T01:00:00.000Z');
    base.majorOrders = [
      { id: 'mo-1', title: 'Defend Worlds', briefing: '', expiresAt: '2026-05-27T01:00:00.000Z', hoursRemaining: 24, relevantPlanetIds: [101], progress: [{ type: 'defense', current: 10, target: 100, percent: 0.1 }] },
      { id: 'mo-1', title: 'Defend Worlds duplicate', briefing: '', expiresAt: '2026-05-27T01:00:00.000Z', hoursRemaining: 24, relevantPlanetIds: [101], progress: [{ type: 'defense', current: 10, target: 100, percent: 0.1 }] },
    ];

    const events = detectWarEvents({ snapshot: base, currentRows: [], previousByCampaignKey: new Map() });
    expect(events.filter((e) => e.event_type === 'major_order_active')).toHaveLength(1);
  });

  it('keeps major_order_active events when progress differs', () => {
    const base = snapshot('2026-05-26T01:00:00.000Z');
    base.majorOrders = [
      { id: 'mo-1', title: 'Defend Worlds', briefing: '', expiresAt: '2026-05-27T01:00:00.000Z', hoursRemaining: 24, relevantPlanetIds: [101], progress: [{ type: 'defense', current: 10, target: 100, percent: 0.1 }] },
      { id: 'mo-1', title: 'Defend Worlds updated', briefing: '', expiresAt: '2026-05-27T01:00:00.000Z', hoursRemaining: 24, relevantPlanetIds: [101], progress: [{ type: 'defense', current: 20, target: 100, percent: 0.2 }] },
    ];

    const events = detectWarEvents({ snapshot: base, currentRows: [], previousByCampaignKey: new Map() });
    expect(events.filter((e) => e.event_type === 'major_order_active')).toHaveLength(2);
  });

  it('prunes older rows by retention cutoff', () => {
    let pruneCutoff: string | null = null;
    const db: ChronicleDb = {
      ensureReady: () => true,
      close: () => undefined,
      getLatestCampaignRows: () => new Map(),
      insertCampaignProgressRows: () => undefined,
      insertWarEvents: () => undefined,
      pruneOldRows: (_, nowIso) => { pruneCutoff = nowIso; },
    };
    const chronicle = createWarChronicle({ enabled: true, retentionDays: 30, db });
    chronicle.logWarSnapshot(snapshot('2026-05-26T01:00:00.000Z'));
    expect(pruneCutoff).toBe('2026-05-26T01:00:00.000Z');
  });

  it('does not throw when db initialization fails', () => {
    const db: ChronicleDb = {
      ensureReady: () => false,
      close: () => undefined,
      getLatestCampaignRows: () => new Map(),
      insertCampaignProgressRows: () => undefined,
      insertWarEvents: () => undefined,
      pruneOldRows: () => undefined,
    };
    const chronicle = createWarChronicle({ enabled: true, retentionDays: 30, db });
    expect(() => chronicle.logWarSnapshot(snapshot('2026-05-26T01:00:00.000Z'))).not.toThrow();
  });


  it('ignores previous sample from different campaign type', () => {
    const fake = new FakeDb();
    fake.latestByCampaignKey.set('101:liberation', { timestamp: '2026-05-26T00:00:00.000Z', liberation_percent: 10, health_current: 900000, player_share: 0.3, players_on_planet: 3000 });
    const db = createChronicleDb('/tmp/chronicle.sqlite', function Ctor() { return fake; } as unknown as new (dbPath: string) => FakeDb);
    const chronicle = createWarChronicle({ enabled: true, retentionDays: 30, db });

    chronicle.logWarSnapshot(snapshot('2026-05-26T01:00:00.000Z'));

    expect(fake.campaignRows).toHaveLength(1);
    expect(fake.campaignRows[0].liberation_delta_per_hour).toBeNull();
    expect(fake.campaignRows[0].health_delta_per_hour).toBeNull();
  });

  it('uses previous sample from same planet and campaign type', () => {
    const fake = new FakeDb();
    fake.latestByCampaignKey.set('101:defense', { timestamp: '2026-05-26T00:00:00.000Z', liberation_percent: 0.78, health_current: 900000, player_share: 0.12, players_on_planet: 1200 });
    const db = createChronicleDb('/tmp/chronicle.sqlite', function Ctor() { return fake; } as unknown as new (dbPath: string) => FakeDb);
    const chronicle = createWarChronicle({ enabled: true, retentionDays: 30, db });

    chronicle.logWarSnapshot(snapshot('2026-05-26T01:00:00.000Z'));

    expect(fake.campaignRows[0].liberation_delta_per_hour).toBeCloseTo(0.02);
    expect(fake.campaignRows[0].health_delta_per_hour).toBeCloseTo(-100000);
  });

  it('returns null per-hour deltas with no previous sample', () => {
    const row = toCampaignProgressRow('2026-05-26T01:00:00.000Z', snapshot('2026-05-26T01:00:00.000Z').campaigns[0]);
    expect(row.liberation_delta_per_hour).toBeNull();
    expect(row.health_delta_per_hour).toBeNull();
  });
});
