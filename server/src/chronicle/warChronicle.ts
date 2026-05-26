import { logger } from '../logger.js';
import { config } from '../config.js';
import type { WarSnapshot } from '../domain/types.js';
import { createChronicleDb } from './db.js';
import { detectWarEvents } from './eventDetector.js';
import type { ChronicleDb } from './types.js';
import { toCampaignProgressRow } from './types.js';

export interface WarChronicle {
  logWarSnapshot: (snapshot: WarSnapshot) => void;
  close: () => void;
}

export function createWarChronicle(opts?: {
  enabled?: boolean;
  retentionDays?: number;
  db?: ChronicleDb;
}): WarChronicle {
  const enabled = opts?.enabled ?? config.WAR_CHRONICLE_ENABLED;
  const retentionDays = opts?.retentionDays ?? config.WAR_CHRONICLE_RETENTION_DAYS;
  const db = opts?.db ?? createChronicleDb(config.WAR_CHRONICLE_DB_PATH);

  return {
    logWarSnapshot: (snapshot: WarSnapshot) => {
      if (!enabled) return;

      try {
        if (!db.ensureReady()) return;

        const previousByPlanetId = db.getLatestCampaignRows(snapshot.campaigns.map((campaign) => campaign.planetId));
        const rows = snapshot.campaigns.map((campaign) =>
          toCampaignProgressRow(snapshot.generatedAt, campaign, previousByPlanetId.get(campaign.planetId))
        );
        const events = detectWarEvents({ snapshot, previousByPlanetId, currentRows: rows });

        db.insertCampaignProgressRows(rows);
        db.insertWarEvents(events);
        db.pruneOldRows(retentionDays, snapshot.generatedAt);
      } catch (error) {
        logger.warn({ err: error }, 'War chronicle logging failed; continuing poller');
      }
    },
    close: () => db.close(),
  };
}

const defaultChronicle = createWarChronicle();

export const logWarSnapshot = defaultChronicle.logWarSnapshot;
export const closeWarChronicle = defaultChronicle.close;
