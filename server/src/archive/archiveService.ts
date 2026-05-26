import { config } from '../config.js';
import { createChronicleDb } from '../chronicle/db.js';
import type { ArchiveSummary, CampaignProgressSample, WarArchiveEvent } from './types.js';

const safeParse = (raw: unknown) => { try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; } };
const mapEvent = (row: Record<string, unknown>): WarArchiveEvent => ({ id: Number(row.id), timestamp: String(row.timestamp), eventType: String(row.event_type), severity: String(row.severity), planetId: row.planet_id == null ? null : Number(row.planet_id), planetName: row.planet_name == null ? null : String(row.planet_name), title: String(row.title), summary: String(row.summary), data: safeParse(row.data_json) });

export function createArchiveService(db = createChronicleDb(config.WAR_CHRONICLE_DB_PATH), enabled = config.WAR_CHRONICLE_ENABLED) {
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
      return { planetId: query.planetId, planetName: progressRows[0]?.planetName ?? (events[0]?.planet_name as string | undefined) ?? null, progress: progressRows, events: events.map(mapEvent), summary: { firstSeen: progressRows.length ? progressRows[progressRows.length - 1].timestamp : null, lastSeen: progressRows[0]?.timestamp ?? null, sampleCount: progressRows.length, eventCount: events.length, latestLiberationPercent: progressRows[0]?.liberationPercent ?? null, latestPlayerShare: progressRows[0]?.playerShare ?? null } };
    },
    listCampaigns: (query: { campaignType?: string; planetId?: number; limit: number }) => db.listCampaignGroups(query).map((row) => ({ planetId: Number(row.planet_id), planetName: String(row.planet_name), campaignType: String(row.campaign_type), firstSeen: String(row.first_seen), lastSeen: String(row.last_seen), sampleCount: Number(row.sample_count), minLiberationPercent: Number(row.min_liberation_percent), maxLiberationPercent: Number(row.max_liberation_percent), latestLiberationPercent: Number(row.latest_liberation_percent), maxPlayerShare: Number(row.max_player_share) })),
    listMajorOrders: (limit: number) => {
      const grouped = new Map<string, any>();
      for (const row of db.listMajorOrders(limit)) {
        const payload = safeParse(row.data_json) as any;
        const key = String(payload?.majorOrderId ?? 'unknown');
        const entry = grouped.get(key) ?? { majorOrderId: key, title: String(payload?.title ?? row.title), firstSeen: String(row.timestamp), lastSeen: String(row.timestamp), latestExpiresAt: payload?.expiresAt ?? null, latestHoursRemaining: payload?.hoursRemaining ?? null, relevantPlanetIds: payload?.relevantPlanetIds ?? [], progress: payload?.progress ?? [] };
        entry.firstSeen = entry.firstSeen < String(row.timestamp) ? entry.firstSeen : String(row.timestamp);
        entry.lastSeen = entry.lastSeen > String(row.timestamp) ? entry.lastSeen : String(row.timestamp);
        entry.latestExpiresAt = payload?.expiresAt ?? entry.latestExpiresAt;
        entry.latestHoursRemaining = payload?.hoursRemaining ?? entry.latestHoursRemaining;
        entry.relevantPlanetIds = payload?.relevantPlanetIds ?? entry.relevantPlanetIds;
        entry.progress = payload?.progress ?? entry.progress;
        grouped.set(key, entry);
      }
      return [...grouped.values()];
    },
  };
}

export const archiveService = createArchiveService();
