import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { logger } from '../logger.js';
import { campaignLookupKey, type CampaignProgressRow, type ChronicleDb, type PreviousCampaignSample, type WarEventRow } from './types.js';

const require = createRequire(import.meta.url);

type ChronicleDatabase = {
  pragma: (sql: string) => void;
  exec: (sql: string) => void;
  prepare: (sql: string) => { run: (params?: unknown) => unknown; get: (params?: unknown) => unknown };
  transaction: <T>(fn: (value: T) => void) => (value: T) => void;
  close: () => void;
};

type ChronicleDatabaseCtor = new (dbPath: string) => ChronicleDatabase;

function loadDatabaseCtor(): ChronicleDatabaseCtor {
  return require('better-sqlite3') as ChronicleDatabaseCtor;
}

export function createChronicleDb(dbPath: string, databaseCtor?: ChronicleDatabaseCtor): ChronicleDb {
  let db: ChronicleDatabase | null = null;
  let initFailed = false;

  function ensureReady(): boolean {
    if (db) return true;
    if (initFailed) return false;

    try {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      const ctor = databaseCtor ?? loadDatabaseCtor();
      db = new ctor(dbPath);
      db.pragma('journal_mode = WAL');
      db.exec(`
CREATE TABLE IF NOT EXISTS campaign_progress_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  planet_id INTEGER NOT NULL,
  planet_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  faction TEXT NOT NULL,
  health_current INTEGER NOT NULL,
  health_max INTEGER NOT NULL,
  liberation_percent REAL NOT NULL,
  decay_per_hour_hp REAL,
  player_share REAL NOT NULL,
  players_on_planet INTEGER NOT NULL,
  hours_remaining REAL,
  ramping_up INTEGER NOT NULL,
  is_high_priority INTEGER NOT NULL,
  liberation_delta_per_hour REAL,
  health_delta_per_hour REAL,
  player_share_delta REAL,
  players_delta INTEGER
);
CREATE TABLE IF NOT EXISTS war_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  planet_id INTEGER,
  planet_name TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_log_timestamp ON campaign_progress_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_log_planet_id ON campaign_progress_log(planet_id);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_log_campaign_type ON campaign_progress_log(campaign_type);
CREATE INDEX IF NOT EXISTS idx_war_events_timestamp ON war_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_war_events_event_type ON war_events(event_type);
CREATE INDEX IF NOT EXISTS idx_war_events_planet_id ON war_events(planet_id);
      `);
      return true;
    } catch (error) {
      initFailed = true;
      logger.warn({ err: error, dbPath }, 'War chronicle DB initialization failed; continuing without chronicle persistence');
      return false;
    }
  }

  return {
    ensureReady,
    close: () => { db?.close(); db = null; },
    getLatestCampaignRows: (campaignKeys) => {
      const rows = new Map<string, PreviousCampaignSample>();
      if (!campaignKeys.length || !ensureReady() || !db) return rows;
      const stmt = db.prepare('SELECT timestamp, liberation_percent, health_current, player_share, players_on_planet FROM campaign_progress_log WHERE planet_id = ? AND campaign_type = ? ORDER BY timestamp DESC LIMIT 1');
      for (const key of campaignKeys) {
        const row = stmt.get([key.planetId, key.campaignType]) as PreviousCampaignSample | undefined;
        if (row) rows.set(campaignLookupKey(key.planetId, key.campaignType), row);
      }
      return rows;
    },
    insertCampaignProgressRows: (rows) => {
      if (!rows.length || !ensureReady() || !db) return;
      const stmt = db.prepare('INSERT INTO campaign_progress_log (timestamp,planet_id,planet_name,campaign_type,faction,health_current,health_max,liberation_percent,decay_per_hour_hp,player_share,players_on_planet,hours_remaining,ramping_up,is_high_priority,liberation_delta_per_hour,health_delta_per_hour,player_share_delta,players_delta) VALUES (@timestamp,@planet_id,@planet_name,@campaign_type,@faction,@health_current,@health_max,@liberation_percent,@decay_per_hour_hp,@player_share,@players_on_planet,@hours_remaining,@ramping_up,@is_high_priority,@liberation_delta_per_hour,@health_delta_per_hour,@player_share_delta,@players_delta)');
      db.transaction((batch: CampaignProgressRow[]) => batch.forEach((row) => stmt.run(row)))(rows);
    },
    insertWarEvents: (events) => {
      if (!events.length || !ensureReady() || !db) return;
      const stmt = db.prepare('INSERT INTO war_events (timestamp,event_type,severity,planet_id,planet_name,title,summary,data_json) VALUES (@timestamp,@event_type,@severity,@planet_id,@planet_name,@title,@summary,@data_json)');
      db.transaction((batch: WarEventRow[]) => batch.forEach((event) => stmt.run(event)))(events);
    },
    pruneOldRows: (retentionDays, nowIso) => {
      if (retentionDays <= 0 || !ensureReady() || !db) return;
      const cutoffIso = new Date(Date.parse(nowIso) - retentionDays * 24 * 60 * 60 * 1000).toISOString();
      db.prepare('DELETE FROM campaign_progress_log WHERE timestamp < ?').run(cutoffIso);
      db.prepare('DELETE FROM war_events WHERE timestamp < ?').run(cutoffIso);
    },
  };
}
