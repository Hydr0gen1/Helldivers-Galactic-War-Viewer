import { config } from '../config.js';
import { createChronicleDb } from '../chronicle/db.js';
import type { ArchiveSummary, CampaignProgressSample, WarArchiveEvent } from './types.js';

interface MajorOrderArchivePayload {
  majorOrderId?: unknown;
  title?: unknown;
  expiresAt?: unknown;
  hoursRemaining?: unknown;
  relevantPlanetIds?: unknown;
  progress?: unknown;
}

interface MajorOrderArchiveItem {
  majorOrderId: string;
  title: string;
  firstSeen: string;
  lastSeen: string;
  latestExpiresAt: string | null;
  latestHoursRemaining: number | null;
  relevantPlanetIds: number[];
  progress: unknown[];
}

const safeParse = (raw: unknown): unknown => {
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; }
};
const asString = (value: unknown): string | null => typeof value === 'string' ? value : null;
const asNumber = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;
const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const asNumberArray = (value: unknown): number[] => asArray(value).map(asNumber).filter((n): n is number => n !== null);

const mapEvent = (row: Record<string, unknown>): WarArchiveEvent => ({
  id: Number(row.id),
  timestamp: String(row.timestamp),
  eventType: String(row.event_type),
  severity: String(row.severity),
  planetId: row.planet_id == null ? null : Number(row.planet_id),
  planetName: row.planet_name == null ? null : String(row.planet_name),
  title: String(row.title),
  summary: String(row.summary),
  data: safeParse(row.data_json),
});


export interface ArchiveService {
  getSummary: () => ArchiveSummary;
  listEvents: (query: { from?: string; to?: string; eventType?: string; planetId?: number; limit: number; offset: number }) => WarArchiveEvent[];
  listPlanets: (query: { limit: number; offset: number }) => Array<{ planetId: number; planetName: string | null; latestTimestamp: string; campaignTypes: string[]; sampleCount: number; eventCount: number }>;
  getPlanetHistory: (query: { planetId: number; from?: string; to?: string; limit: number }) => { planetId: number; planetName: string | null; progress: CampaignProgressSample[]; events: WarArchiveEvent[]; summary: { firstSeen: string | null; lastSeen: string | null; sampleCount: number; eventCount: number; latestLiberationPercent: number | null; latestPlayerShare: number | null } };
  listCampaigns: (query: { campaignType?: string; planetId?: number; limit: number }) => Array<Record<string, unknown>>;
  listMajorOrders: (limit: number) => MajorOrderArchiveItem[];
}

export function createArchiveService(db = createChronicleDb(config.WAR_CHRONICLE_DB_PATH), enabled = config.WAR_CHRONICLE_ENABLED): ArchiveService {
  return {
    getSummary(): ArchiveSummary {
      if (!enabled) return { available: false, enabled: false, totals: { campaignSamples: 0, events: 0, planets: 0, majorOrders: 0 }, latest: { campaignSampleAt: null, eventAt: null }, recentEvents: [] };
      const summary = db.getArchiveSummary();
      if (!summary.available) return { available: false, enabled: true, totals: { campaignSamples: 0, events: 0, planets: 0, majorOrders: 0 }, latest: { campaignSampleAt: null, eventAt: null }, recentEvents: [] };
      const recentEvents = db.listEvents({ limit: 10, offset: 0 });
      return { available: true, enabled: true, totals: { campaignSamples: Number(summary.campaign_samples), events: Number(summary.events), planets: Number(summary.planets), majorOrders: Number(summary.major_orders) }, latest: { campaignSampleAt: (summary.campaign_sample_at as string | null) ?? null, eventAt: (summary.event_at as string | null) ?? null }, recentEvents: recentEvents.map(mapEvent) };
    },
    listEvents: (query: { from?: string; to?: string; eventType?: string; planetId?: number; limit: number; offset: number }) => db.listEvents(query).map(mapEvent),
    listPlanets: (query: { limit: number; offset: number }) => db.listPlanets(query).map((row) => ({ planetId: Number(row.planet_id), planetName: row.planet_name == null ? null : String(row.planet_name), latestTimestamp: String(row.latest_timestamp), campaignTypes: typeof row.campaign_types === 'string' ? row.campaign_types.split(',').filter(Boolean) : [], sampleCount: Number(row.sample_count), eventCount: Number(row.event_count) })),
    getPlanetHistory: (query: { planetId: number; from?: string; to?: string; limit: number }) => {
      const { progress, events } = db.getPlanetHistory(query);
      const progressRows = progress.map((row) => ({ timestamp: String(row.timestamp), planetId: Number(row.planet_id), planetName: String(row.planet_name), campaignType: String(row.campaign_type), faction: String(row.faction), healthCurrent: Number(row.health_current), healthMax: Number(row.health_max), liberationPercent: Number(row.liberation_percent), decayPerHourHp: row.decay_per_hour_hp == null ? null : Number(row.decay_per_hour_hp), playerShare: Number(row.player_share), playersOnPlanet: Number(row.players_on_planet), hoursRemaining: row.hours_remaining == null ? null : Number(row.hours_remaining), rampingUp: Number(row.ramping_up) === 1, isHighPriority: Number(row.is_high_priority) === 1, liberationDeltaPerHour: row.liberation_delta_per_hour == null ? null : Number(row.liberation_delta_per_hour), healthDeltaPerHour: row.health_delta_per_hour == null ? null : Number(row.health_delta_per_hour), playerShareDelta: Number(row.player_share_delta), playersDelta: Number(row.players_delta) })) as CampaignProgressSample[];
      const timestamps = [...progressRows.map((row) => row.timestamp), ...events.map((event) => String(event.timestamp))].sort();
      return { planetId: query.planetId, planetName: progressRows[0]?.planetName ?? (events[0]?.planet_name as string | undefined) ?? null, progress: progressRows, events: events.map(mapEvent), summary: { firstSeen: timestamps[0] ?? null, lastSeen: timestamps.length ? timestamps[timestamps.length - 1] : null, sampleCount: progressRows.length, eventCount: events.length, latestLiberationPercent: progressRows[0]?.liberationPercent ?? null, latestPlayerShare: progressRows[0]?.playerShare ?? null } };
    },
    // Campaign grouping is intentionally by (planet_id, campaign_type) for now.
    // Future campaign episode splitting can use time-gap windows once stable rules are finalized.
    listCampaigns: (query: { campaignType?: string; planetId?: number; limit: number }) => db.listCampaignGroups(query).map((row) => ({ planetId: Number(row.planet_id), planetName: String(row.planet_name), campaignType: String(row.campaign_type), firstSeen: String(row.first_seen), lastSeen: String(row.last_seen), sampleCount: Number(row.sample_count), minLiberationPercent: Number(row.min_liberation_percent), maxLiberationPercent: Number(row.max_liberation_percent), latestLiberationPercent: Number(row.latest_liberation_percent), maxPlayerShare: Number(row.max_player_share) })),
    listMajorOrders: (limit: number): MajorOrderArchiveItem[] => {
      const rawLimit = Math.min(Math.max(limit * 20, limit), 1000);
      const grouped = new Map<string, MajorOrderArchiveItem>();
      for (const row of db.listMajorOrders(rawLimit)) {
        const payload = safeParse(row.data_json) as MajorOrderArchivePayload | null;
        const majorOrderId = asString(payload?.majorOrderId);
        if (!majorOrderId) continue;
        const timestamp = String(row.timestamp);
        const current = grouped.get(majorOrderId);
        const entry: MajorOrderArchiveItem = current ?? {
          majorOrderId,
          title: asString(payload?.title) ?? String(row.title),
          firstSeen: timestamp,
          lastSeen: timestamp,
          latestExpiresAt: asString(payload?.expiresAt),
          latestHoursRemaining: asNumber(payload?.hoursRemaining),
          relevantPlanetIds: asNumberArray(payload?.relevantPlanetIds),
          progress: asArray(payload?.progress),
        };
        if (timestamp < entry.firstSeen) entry.firstSeen = timestamp;
        if (timestamp >= entry.lastSeen) {
          entry.lastSeen = timestamp;
          entry.title = asString(payload?.title) ?? entry.title;
          entry.latestExpiresAt = asString(payload?.expiresAt);
          entry.latestHoursRemaining = asNumber(payload?.hoursRemaining);
          entry.relevantPlanetIds = asNumberArray(payload?.relevantPlanetIds);
          entry.progress = asArray(payload?.progress);
        }
        grouped.set(majorOrderId, entry);
      }
      return [...grouped.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)).slice(0, limit);
    },
  };
}

export const archiveService = createArchiveService();
