import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createChronicleDb } from '../src/chronicle/db.js';
import type { CampaignProgressRow, WarEventRow } from '../src/chronicle/types.js';

describe('chronicle db query methods', () => {
  it('supports archive query filtering and aggregation', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chronicle-db-'));
    const dbPath = path.join(dir, 'test.sqlite');
    const db = createChronicleDb(dbPath);
    expect(db.ensureReady()).toBe(true);

    const progressRows: CampaignProgressRow[] = [
      { timestamp: '2026-01-01T00:00:00.000Z', planet_id: 1, planet_name: 'Veld', campaign_type: 'defense', faction: 'Terminids', health_current: 10, health_max: 100, liberation_percent: 10, decay_per_hour_hp: null, player_share: 0.1, players_on_planet: 100, hours_remaining: 2, ramping_up: 0, is_high_priority: 0, liberation_delta_per_hour: null, health_delta_per_hour: null, player_share_delta: 0, players_delta: 0 },
      { timestamp: '2026-01-01T01:00:00.000Z', planet_id: 1, planet_name: 'Veld', campaign_type: 'defense', faction: 'Terminids', health_current: 20, health_max: 100, liberation_percent: 20, decay_per_hour_hp: null, player_share: 0.2, players_on_planet: 200, hours_remaining: 1, ramping_up: 0, is_high_priority: 0, liberation_delta_per_hour: 10, health_delta_per_hour: 10, player_share_delta: 0.1, players_delta: 100 },
      { timestamp: '2026-01-01T01:00:00.000Z', planet_id: 2, planet_name: 'Malevelon', campaign_type: 'liberation', faction: 'Automatons', health_current: 30, health_max: 100, liberation_percent: 30, decay_per_hour_hp: null, player_share: 0.3, players_on_planet: 300, hours_remaining: null, ramping_up: 0, is_high_priority: 0, liberation_delta_per_hour: null, health_delta_per_hour: null, player_share_delta: 0, players_delta: 0 },
    ];
    const events: WarEventRow[] = [
      { timestamp: '2026-01-01T00:00:00.000Z', event_type: 'major_order_active', severity: 'low', planet_id: 1, planet_name: 'Veld', title: 'MO1', summary: 's', data_json: '{"majorOrderId":"mo-1"}' },
      { timestamp: '2026-01-01T00:30:00.000Z', event_type: 'major_order_active', severity: 'low', planet_id: 1, planet_name: 'Veld', title: 'MO1', summary: 's', data_json: '{"majorOrderId":"mo-1"}' },
      { timestamp: '2026-01-01T02:00:00.000Z', event_type: 'player_surge', severity: 'low', planet_id: 1, planet_name: 'Veld', title: 'Surge', summary: 's', data_json: '{}' },
      { timestamp: '2026-01-01T03:00:00.000Z', event_type: 'player_surge', severity: 'low', planet_id: 2, planet_name: 'Malevelon', title: 'Surge2', summary: 's', data_json: '{}' },
    ];

    db.insertCampaignProgressRows(progressRows);
    db.insertWarEvents(events);

    const filteredEvents = db.listEvents({ eventType: 'player_surge', planetId: 1, from: '2026-01-01T00:00:00.000Z', to: '2026-01-01T02:30:00.000Z', limit: 100, offset: 0 });
    expect(filteredEvents).toHaveLength(1);

    const planets = db.listPlanets({ limit: 100, offset: 0 });
    const veld = planets.find((p) => Number(p.planet_id) === 1);
    expect(Number(veld?.sample_count)).toBe(2);
    expect(Number(veld?.event_count)).toBe(3);

    const history = db.getPlanetHistory({ planetId: 1, limit: 100 });
    expect(history.progress.length).toBe(2);
    expect(history.events.length).toBe(3);

    const campaigns = db.listCampaignGroups({ limit: 100 });
    expect(campaigns.some((c) => Number(c.planet_id) === 1 && String(c.campaign_type) === 'defense')).toBe(true);

    const summary = db.getArchiveSummary();
    expect(summary.available).toBe(true);
    expect(Number(summary.campaign_samples)).toBe(3);
    expect(Number(summary.events)).toBe(4);
    expect(Number(summary.planets)).toBe(2);
    expect(Number(summary.major_orders)).toBe(2);

    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
