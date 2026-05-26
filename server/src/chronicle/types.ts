import type { NormalizedCampaign, WarSnapshot } from '../domain/types.js';

export type WarEventType =
  | 'campaign_started'
  | 'campaign_ended'
  | 'planet_liberated'
  | 'planet_lost'
  | 'defense_critical'
  | 'defense_won'
  | 'defense_lost'
  | 'gambit_opened'
  | 'siege_opportunity'
  | 'major_order_active'
  | 'player_surge'
  | 'campaign_stalled';

// Historical campaign grouping is intentionally derived by (planet_id, campaign_type, timestamp windows)
// until a stable upstream campaign identifier is available for durable archive episodes.
export interface CampaignProgressRow {
  timestamp: string;
  planet_id: number;
  planet_name: string;
  campaign_type: string;
  faction: string;
  health_current: number;
  health_max: number;
  liberation_percent: number;
  decay_per_hour_hp: number | null;
  player_share: number;
  players_on_planet: number;
  hours_remaining: number | null;
  ramping_up: number;
  is_high_priority: number;
  liberation_delta_per_hour: number | null;
  health_delta_per_hour: number | null;
  player_share_delta: number;
  players_delta: number;
}

export interface WarEventRow {
  timestamp: string;
  event_type: WarEventType;
  severity: 'low' | 'medium' | 'high';
  planet_id: number | null;
  planet_name: string | null;
  title: string;
  summary: string;
  data_json: string;
}

export interface PreviousCampaignSample {
  timestamp: string;
  liberation_percent: number;
  health_current: number;
  player_share: number;
  players_on_planet: number;
}

export interface ChronicleEventDetectionContext {
  snapshot: WarSnapshot;
  previousByPlanetId: Map<number, PreviousCampaignSample>;
  currentRows: CampaignProgressRow[];
}

export interface ChronicleConfig {
  enabled: boolean;
  dbPath: string;
  retentionDays: number;
}

export interface ChronicleDb {
  ensureReady: () => boolean;
  close: () => void;
  getLatestCampaignRows: (planetIds: number[]) => Map<number, PreviousCampaignSample>;
  insertCampaignProgressRows: (rows: CampaignProgressRow[]) => void;
  insertWarEvents: (events: WarEventRow[]) => void;
  pruneOldRows: (retentionDays: number, nowIso: string) => void;
}

export function toCampaignProgressRow(timestamp: string, campaign: NormalizedCampaign, previous?: PreviousCampaignSample): CampaignProgressRow {
  const elapsedHours = previous
    ? (Date.parse(timestamp) - Date.parse(previous.timestamp)) / (1000 * 60 * 60)
    : null;

  const liberationDelta = previous ? campaign.liberationPercent - previous.liberation_percent : 0;
  const healthDelta = previous ? campaign.healthCurrent - previous.health_current : 0;

  return {
    timestamp,
    planet_id: campaign.planetId,
    planet_name: campaign.planetName,
    campaign_type: campaign.campaignType,
    faction: campaign.faction,
    health_current: campaign.healthCurrent,
    health_max: campaign.healthMax,
    liberation_percent: campaign.liberationPercent,
    decay_per_hour_hp: campaign.decayPerHourHp,
    player_share: campaign.playerShare,
    players_on_planet: campaign.playersOnPlanet,
    hours_remaining: campaign.hoursRemaining,
    ramping_up: campaign.rampingUp ? 1 : 0,
    is_high_priority: campaign.isHighPriority ? 1 : 0,
    liberation_delta_per_hour: elapsedHours && elapsedHours > 0 ? liberationDelta / elapsedHours : null,
    health_delta_per_hour: elapsedHours && elapsedHours > 0 ? healthDelta / elapsedHours : null,
    player_share_delta: previous ? campaign.playerShare - previous.player_share : 0,
    players_delta: previous ? campaign.playersOnPlanet - previous.players_on_planet : 0,
  };
}
