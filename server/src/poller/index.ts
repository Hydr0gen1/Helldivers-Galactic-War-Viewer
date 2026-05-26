import { config } from '../config.js';
import { logger } from '../logger.js';
import { memoryStore } from '../cache/memoryStore.js';
import { CACHE_KEYS } from '../cache/keys.js';
import { helldiversFetch } from './helldiversClient.js';
import { buildSnapshot } from './snapshotBuilder.js';
import {
  WarStatusSchema, PlanetSchema, CampaignSchema, AssignmentSchema,
  ENDPOINTS
} from './endpoints.js';
import { z } from 'zod';
import type { WarSnapshot } from '../domain/types.js';
import { logWarSnapshot } from '../chronicle/warChronicle.js';

const FRESH_MS = 75_000;
const GRACE_MS = 120_000;
const ASSIGN_FRESH_MS = 6 * 60_000;
const ASSIGN_GRACE_MS = 10 * 60_000;

let running = false;
let pollCount = 0;

export function startPoller(onSnapshot?: (s: WarSnapshot) => void): void {
  logger.info('Starting poller');
  poll(onSnapshot).catch(e => logger.error(e, 'Poll cycle error'));
  setInterval(() => {
    if (running) {
      logger.warn('Previous poll still running, skipping cycle');
      return;
    }
    poll(onSnapshot).catch(e => logger.error(e, 'Poll cycle error'));
  }, config.POLL_INTERVAL_MS);
}

async function poll(onSnapshot?: (s: WarSnapshot) => void) {
  running = true;
  try {
    pollCount++;
    const cycleId = pollCount;
    logger.debug({ cycleId }, 'Poll cycle start');

    const apiHealth: WarSnapshot['apiHealth'] = {
      warStatus: 'ok',
      planets: 'ok',
      campaigns: 'ok',
      assignments: 'ok',
    };
    let maxStaleAgeMs = 0;

    // Fetch war status
    const warStatusResult = await helldiversFetch(ENDPOINTS.WAR_STATUS, WarStatusSchema);
    let warStatus: z.infer<typeof WarStatusSchema>;
    if (warStatusResult.ok) {
      memoryStore.setWithGrace(CACHE_KEYS.WAR_STATUS, warStatusResult.value, FRESH_MS, GRACE_MS);
      warStatus = warStatusResult.value;
    } else {
      logger.warn({ err: warStatusResult.error.message }, 'War status fetch failed');
      const cached = memoryStore.get<z.infer<typeof WarStatusSchema>>(CACHE_KEYS.WAR_STATUS);
      if (!cached) { apiHealth.warStatus = 'error'; return; }
      apiHealth.warStatus = cached.stale ? 'stale' : 'ok';
      maxStaleAgeMs = Math.max(maxStaleAgeMs, cached.ageMs);
      warStatus = cached.value;
    }

    // Fetch planets
    const planetsResult = await helldiversFetch(ENDPOINTS.PLANETS, z.array(PlanetSchema));
    let planets: z.infer<typeof PlanetSchema>[];
    if (planetsResult.ok) {
      memoryStore.setWithGrace(CACHE_KEYS.PLANETS, planetsResult.value, FRESH_MS, GRACE_MS);
      planets = planetsResult.value;
    } else {
      logger.warn({ err: planetsResult.error.message }, 'Planets fetch failed');
      const cached = memoryStore.get<z.infer<typeof PlanetSchema>[]>(CACHE_KEYS.PLANETS);
      if (!cached) { apiHealth.planets = 'error'; return; }
      apiHealth.planets = cached.stale ? 'stale' : 'ok';
      maxStaleAgeMs = Math.max(maxStaleAgeMs, cached.ageMs);
      planets = cached.value;
    }

    // Fetch campaigns
    const campaignsResult = await helldiversFetch(ENDPOINTS.CAMPAIGNS, z.array(CampaignSchema));
    let campaigns: z.infer<typeof CampaignSchema>[];
    if (campaignsResult.ok) {
      memoryStore.setWithGrace(CACHE_KEYS.CAMPAIGNS, campaignsResult.value, FRESH_MS, GRACE_MS);
      campaigns = campaignsResult.value;
    } else {
      logger.warn({ err: campaignsResult.error.message }, 'Campaigns fetch failed');
      const cached = memoryStore.get<z.infer<typeof CampaignSchema>[]>(CACHE_KEYS.CAMPAIGNS);
      if (!cached) { apiHealth.campaigns = 'error'; return; }
      apiHealth.campaigns = cached.stale ? 'stale' : 'ok';
      maxStaleAgeMs = Math.max(maxStaleAgeMs, cached.ageMs);
      campaigns = cached.value;
    }

    // Fetch assignments (lower frequency — reuse cache more aggressively)
    const assignCached = memoryStore.get<z.infer<typeof AssignmentSchema>[]>(CACHE_KEYS.ASSIGNMENTS);
    let assignments: z.infer<typeof AssignmentSchema>[];
    if (assignCached && !assignCached.stale) {
      assignments = assignCached.value;
      apiHealth.assignments = 'ok';
    } else {
      const assignResult = await helldiversFetch(ENDPOINTS.ASSIGNMENTS, z.array(AssignmentSchema));
      if (assignResult.ok) {
        memoryStore.setWithGrace(CACHE_KEYS.ASSIGNMENTS, assignResult.value, ASSIGN_FRESH_MS, ASSIGN_GRACE_MS);
        assignments = assignResult.value;
      } else {
        logger.warn({ err: assignResult.error.message }, 'Assignments fetch failed');
        if (!assignCached) { apiHealth.assignments = 'error'; assignments = []; }
        else {
          apiHealth.assignments = 'stale';
          maxStaleAgeMs = Math.max(maxStaleAgeMs, assignCached.ageMs);
          assignments = assignCached.value;
        }
      }
    }

    const staleSeconds = maxStaleAgeMs > 0 ? Math.floor(maxStaleAgeMs / 1000) : 0;

    try {
      const snapshot = buildSnapshot(warStatus, planets, campaigns, assignments, staleSeconds, apiHealth);
      memoryStore.setWithGrace(CACHE_KEYS.SNAPSHOT, snapshot, FRESH_MS, GRACE_MS * 2);
      logger.info({ cycleId, campaigns: campaigns.length }, 'Snapshot built');
      onSnapshot?.(snapshot);
      logWarSnapshot(snapshot);
    } catch (e) {
      logger.error(e, 'Snapshot build failed');
    }
  } finally {
    running = false;
  }
}
