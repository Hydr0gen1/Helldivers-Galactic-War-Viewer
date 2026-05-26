import { describe, expect, it } from 'vitest';
import { createArchiveService } from '../src/archive/archiveService.js';
import { createApiRouter } from '../src/api/routes.js';
import express from 'express';
import request from 'supertest';
import type { ChronicleDb } from '../src/chronicle/types.js';

function fakeDb(): ChronicleDb {
  return {
    ensureReady: () => true, close: () => undefined, getLatestCampaignRows: () => new Map(), insertCampaignProgressRows: () => undefined, insertWarEvents: () => undefined, pruneOldRows: () => undefined,
    listEvents: () => [{ id: 1, timestamp: '2026-01-01T00:00:00.000Z', event_type: 'major_order_active', severity: 'low', planet_id: 1, planet_name: 'Veld', title: 't', summary: 's', data_json: '{"ok":true}' }, { id: 2, timestamp: '2026-01-01T00:00:01.000Z', event_type: 'x', severity: 'low', planet_id: null, planet_name: null, title: 't', summary: 's', data_json: 'not-json' }],
    listPlanets: () => [{ planet_id: 1, planet_name: 'Veld', latest_timestamp: '2026-01-01T00:00:00.000Z', campaign_types: 'defense,liberation', sample_count: 2, event_count: 1 }],
    getPlanetHistory: () => ({ progress: [{ timestamp: '2026-01-01T00:00:00.000Z', planet_id: 1, planet_name: 'Veld', campaign_type: 'defense', faction: 'Terminids', health_current: 1, health_max: 2, liberation_percent: 50, decay_per_hour_hp: null, player_share: 0.1, players_on_planet: 100, hours_remaining: 2, ramping_up: 0, is_high_priority: 0, liberation_delta_per_hour: null, health_delta_per_hour: null, player_share_delta: 0, players_delta: 0 }], events: [{ id: 1, timestamp: '2026-01-01T00:00:00.000Z', event_type: 'x', severity: 'low', planet_id: 1, planet_name: 'Veld', title: 't', summary: 's', data_json: '{}' }] }),
    listCampaignGroups: () => [{ planet_id: 1, planet_name: 'Veld', campaign_type: 'defense', first_seen: 'a', last_seen: 'b', sample_count: 1, min_liberation_percent: 1, max_liberation_percent: 2, latest_liberation_percent: 2, max_player_share: 0.1 }],
    listMajorOrders: () => [{ data_json: '{"majorOrderId":"mo-1","title":"MO","relevantPlanetIds":[1],"progress":[],"expiresAt":"x","hoursRemaining":2}', title: 'MO', timestamp: '2026-01-01T00:00:00.000Z' }],
    getArchiveSummary: () => ({ available: true, campaign_samples: 1, events: 2, planets: 1, major_orders: 1, campaign_sample_at: null, event_at: null }),
  };
}

describe('archive service', () => {
  it('parses events and tolerates bad json', () => {
    const svc = createArchiveService(fakeDb(), true);
    const events = svc.listEvents({ limit: 100, offset: 0 });
    expect(events[0].data).toEqual({ ok: true });
    expect(events[1].data).toBeNull();
  });
  it('returns planet history and summary', () => {
    const svc = createArchiveService(fakeDb(), true);
    const history = svc.getPlanetHistory({ planetId: 1, limit: 200 });
    expect(history.progress.length).toBe(1);
    expect(history.events.length).toBe(1);
  });
  it('groups major orders from events', () => {
    const svc = createArchiveService(fakeDb(), true);
    expect(svc.listMajorOrders(10)[0].majorOrderId).toBe('mo-1');
  });

  it('summary handles empty db', () => {
    const db = fakeDb();
    db.getArchiveSummary = () => ({ available: true, campaign_samples: 0, events: 0, planets: 0, major_orders: 0, campaign_sample_at: null, event_at: null });
    db.listEvents = () => [];
    const svc = createArchiveService(db, true);
    const summary = svc.getSummary();
    expect(summary.available).toBe(true);
    expect(summary.totals.events).toBe(0);
    expect(summary.recentEvents).toEqual([]);
  });

  it('summary handles unavailable db', () => {
    const db = fakeDb(); db.getArchiveSummary = () => ({ available: false });
    const svc = createArchiveService(db, true);
    expect(svc.getSummary().available).toBe(false);
  });
});

describe('archive router validation', () => {
  it('clamps limit and validates query', async () => {
    const app = express(); app.use('/api', createApiRouter());
    const res = await request(app).get('/api/archive/events?limit=9000&offset=-3');
    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(500);
    expect(res.body.offset).toBe(0);
    const bad = await request(app).get('/api/archive/events?from=bad');
    expect(bad.status).toBe(400);
  });

  it('keeps existing routes working', async () => {
    const app = express(); app.use('/api', createApiRouter());
    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
  });
});
