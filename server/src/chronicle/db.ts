import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { logger } from '../logger.js';
import { campaignLookupKey, type ArchiveEventQuery, type CampaignGroupQuery, type CampaignProgressRow, type ChronicleDb, type PlanetHistoryQuery, type PlanetQuery, type PreviousCampaignSample, type WarEventRow } from './types.js';

const require = createRequire(import.meta.url);

type ChronicleDatabase = {
  pragma: (sql: string) => void;
  exec: (sql: string) => void;
  prepare: (sql: string) => { run: (params?: unknown) => unknown; get: (params?: unknown) => unknown; all: (params?: unknown) => unknown[] };
  transaction: <T>(fn: (value: T) => void) => (value: T) => void;
  close: () => void;
};
type ChronicleDatabaseCtor = new (dbPath: string) => ChronicleDatabase;
function loadDatabaseCtor(): ChronicleDatabaseCtor { return require('better-sqlite3') as ChronicleDatabaseCtor; }

export function createChronicleDb(dbPath: string, databaseCtor?: ChronicleDatabaseCtor): ChronicleDb {
  let db: ChronicleDatabase | null = null; let initFailed = false;
  function ensureReady(): boolean {
    if (db) return true; if (initFailed) return false;
    try {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      const ctor = databaseCtor ?? loadDatabaseCtor(); db = new ctor(dbPath); db.pragma('journal_mode = WAL');
      db.exec(`
CREATE TABLE IF NOT EXISTS campaign_progress_log (id INTEGER PRIMARY KEY AUTOINCREMENT,timestamp TEXT NOT NULL,planet_id INTEGER NOT NULL,planet_name TEXT NOT NULL,campaign_type TEXT NOT NULL,faction TEXT NOT NULL,health_current INTEGER NOT NULL,health_max INTEGER NOT NULL,liberation_percent REAL NOT NULL,decay_per_hour_hp REAL,player_share REAL NOT NULL,players_on_planet INTEGER NOT NULL,hours_remaining REAL,ramping_up INTEGER NOT NULL,is_high_priority INTEGER NOT NULL,liberation_delta_per_hour REAL,health_delta_per_hour REAL,player_share_delta REAL,players_delta INTEGER);
CREATE TABLE IF NOT EXISTS war_events (id INTEGER PRIMARY KEY AUTOINCREMENT,timestamp TEXT NOT NULL,event_type TEXT NOT NULL,severity TEXT NOT NULL,planet_id INTEGER,planet_name TEXT,title TEXT NOT NULL,summary TEXT NOT NULL,data_json TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_log_timestamp ON campaign_progress_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_log_planet_id ON campaign_progress_log(planet_id);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_log_campaign_type ON campaign_progress_log(campaign_type);
CREATE INDEX IF NOT EXISTS idx_war_events_timestamp ON war_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_war_events_event_type ON war_events(event_type);
CREATE INDEX IF NOT EXISTS idx_war_events_planet_id ON war_events(planet_id);
      `); return true;
    } catch (error) { initFailed = true; logger.warn({ err: error, dbPath }, 'War chronicle DB initialization failed; continuing without chronicle persistence'); return false; }
  }

  return {
    ensureReady,
    close: () => { db?.close(); db = null; },
    getLatestCampaignRows: (campaignKeys) => {
      const rows = new Map<string, PreviousCampaignSample>(); if (!campaignKeys.length || !ensureReady() || !db) return rows;
      const stmt = db.prepare('SELECT timestamp, liberation_percent, health_current, player_share, players_on_planet FROM campaign_progress_log WHERE planet_id = ? AND campaign_type = ? ORDER BY timestamp DESC LIMIT 1');
      for (const key of campaignKeys) { const row = stmt.get([key.planetId, key.campaignType]) as PreviousCampaignSample | undefined; if (row) rows.set(campaignLookupKey(key.planetId, key.campaignType), row); }
      return rows;
    },
    insertCampaignProgressRows: (rows) => { if (!rows.length || !ensureReady() || !db) return; const stmt = db.prepare('INSERT INTO campaign_progress_log (timestamp,planet_id,planet_name,campaign_type,faction,health_current,health_max,liberation_percent,decay_per_hour_hp,player_share,players_on_planet,hours_remaining,ramping_up,is_high_priority,liberation_delta_per_hour,health_delta_per_hour,player_share_delta,players_delta) VALUES (@timestamp,@planet_id,@planet_name,@campaign_type,@faction,@health_current,@health_max,@liberation_percent,@decay_per_hour_hp,@player_share,@players_on_planet,@hours_remaining,@ramping_up,@is_high_priority,@liberation_delta_per_hour,@health_delta_per_hour,@player_share_delta,@players_delta)'); db.transaction((batch: CampaignProgressRow[]) => batch.forEach((row) => stmt.run(row)))(rows); },
    insertWarEvents: (events) => { if (!events.length || !ensureReady() || !db) return; const stmt = db.prepare('INSERT INTO war_events (timestamp,event_type,severity,planet_id,planet_name,title,summary,data_json) VALUES (@timestamp,@event_type,@severity,@planet_id,@planet_name,@title,@summary,@data_json)'); db.transaction((batch: WarEventRow[]) => batch.forEach((event) => stmt.run(event)))(events); },
    pruneOldRows: (retentionDays, nowIso) => { if (retentionDays <= 0 || !ensureReady() || !db) return; const cutoffIso = new Date(Date.parse(nowIso) - retentionDays * 24 * 60 * 60 * 1000).toISOString(); db.prepare('DELETE FROM campaign_progress_log WHERE timestamp < ?').run(cutoffIso); db.prepare('DELETE FROM war_events WHERE timestamp < ?').run(cutoffIso); },
    listEvents: (q: ArchiveEventQuery) => { if (!ensureReady() || !db) return []; return db.prepare(`SELECT id,timestamp,event_type,severity,planet_id,planet_name,title,summary,data_json FROM war_events WHERE (? IS NULL OR timestamp >= ?) AND (? IS NULL OR timestamp <= ?) AND (? IS NULL OR event_type = ?) AND (? IS NULL OR planet_id = ?) ORDER BY timestamp DESC LIMIT ? OFFSET ?`).all([q.from ?? null, q.from ?? null, q.to ?? null, q.to ?? null, q.eventType ?? null, q.eventType ?? null, q.planetId ?? null, q.planetId ?? null, q.limit, q.offset]) as Array<Record<string, unknown>>; },
    listPlanets: (q: PlanetQuery) => { if (!ensureReady() || !db) return []; return db.prepare(`SELECT p.planet_id,MAX(p.planet_name) planet_name,MAX(p.timestamp) latest_timestamp,GROUP_CONCAT(DISTINCT p.campaign_type) campaign_types,COUNT(DISTINCT p.id) sample_count,(SELECT COUNT(*) FROM war_events we WHERE we.planet_id=p.planet_id) event_count FROM campaign_progress_log p GROUP BY p.planet_id ORDER BY latest_timestamp DESC LIMIT ? OFFSET ?`).all([q.limit,q.offset]) as Array<Record<string, unknown>>; },
    getPlanetHistory: (q: PlanetHistoryQuery) => { if (!ensureReady() || !db) return { progress: [], events: [] }; const progress = db.prepare(`SELECT timestamp,planet_id,planet_name,campaign_type,faction,health_current,health_max,liberation_percent,decay_per_hour_hp,player_share,players_on_planet,hours_remaining,ramping_up,is_high_priority,liberation_delta_per_hour,health_delta_per_hour,player_share_delta,players_delta FROM campaign_progress_log WHERE planet_id=? AND (? IS NULL OR timestamp>=?) AND (? IS NULL OR timestamp<=?) ORDER BY timestamp DESC LIMIT ?`).all([q.planetId,q.from??null,q.from??null,q.to??null,q.to??null,q.limit]); const events = db.prepare(`SELECT id,timestamp,event_type,severity,planet_id,planet_name,title,summary,data_json FROM war_events WHERE planet_id=? AND (? IS NULL OR timestamp>=?) AND (? IS NULL OR timestamp<=?) ORDER BY timestamp DESC LIMIT ?`).all([q.planetId,q.from??null,q.from??null,q.to??null,q.to??null,q.limit]); return { progress: progress as Array<Record<string, unknown>>, events: events as Array<Record<string, unknown>> }; },
    listCampaignGroups: (q: CampaignGroupQuery) => { if (!ensureReady() || !db) return []; return db.prepare(`SELECT planet_id,MAX(planet_name) planet_name,campaign_type,MIN(timestamp) first_seen,MAX(timestamp) last_seen,COUNT(*) sample_count,MIN(liberation_percent) min_liberation_percent,MAX(liberation_percent) max_liberation_percent,(SELECT liberation_percent FROM campaign_progress_log p2 WHERE p2.planet_id=p.planet_id AND p2.campaign_type=p.campaign_type ORDER BY p2.timestamp DESC LIMIT 1) latest_liberation_percent,MAX(player_share) max_player_share FROM campaign_progress_log p WHERE (? IS NULL OR campaign_type=?) AND (? IS NULL OR planet_id=?) GROUP BY planet_id,campaign_type ORDER BY last_seen DESC LIMIT ?`).all([q.campaignType??null,q.campaignType??null,q.planetId??null,q.planetId??null,q.limit]) as Array<Record<string, unknown>>; },
    listMajorOrders: (limit: number) => { if (!ensureReady() || !db) return []; return db.prepare(`SELECT data_json,title,timestamp FROM war_events WHERE event_type='major_order_active' ORDER BY timestamp DESC LIMIT ?`).all([limit]) as Array<Record<string, unknown>>; },
    getArchiveSummary: () => { if (!ensureReady() || !db) return { available: false }; const counts = db.prepare(`SELECT (SELECT COUNT(*) FROM campaign_progress_log) campaign_samples,(SELECT COUNT(*) FROM war_events) events,(SELECT COUNT(DISTINCT planet_id) FROM campaign_progress_log) planets,(SELECT COUNT(*) FROM war_events WHERE event_type='major_order_active') major_orders,(SELECT MAX(timestamp) FROM campaign_progress_log) campaign_sample_at,(SELECT MAX(timestamp) FROM war_events) event_at`).get() as Record<string, unknown>; return { available: true, ...counts }; },
  };
}
