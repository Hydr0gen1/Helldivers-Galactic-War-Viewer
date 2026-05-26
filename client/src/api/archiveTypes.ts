export interface ArchiveSummaryResponse {
  available: boolean;
  enabled: boolean;
  totals: {
    campaignSamples: number;
    events: number;
    planets: number;
    majorOrders: number;
  };
  latest: { campaignSampleAt: string | null; eventAt: string | null };
}

export interface ArchiveEvent {
  id: number;
  timestamp: string;
  eventType: string;
  severity: string;
  planetId: number | null;
  planetName: string | null;
  title: string;
  summary: string;
  data?: unknown;
}

export interface ArchivePlanetSummary {
  planetId: number;
  planetName: string | null;
  latestTimestamp: string;
  campaignTypes: string[];
  sampleCount: number;
  eventCount: number;
}

export interface CampaignProgressSample {
  timestamp: string;
  campaignType: string;
  healthCurrent: number;
  healthMax: number;
  liberationPercent: number;
  liberationDeltaPerHour: number | null;
  healthDeltaPerHour: number | null;
  playerShare: number;
  playersOnPlanet: number;
  rampingUp: boolean;
  isHighPriority: boolean;
}

export interface PlanetHistoryResponse {
  planetId: number;
  planetName: string | null;
  progress: CampaignProgressSample[];
  events: ArchiveEvent[];
  summary: {
    firstSeen: string | null;
    lastSeen: string | null;
    sampleCount: number;
    eventCount: number;
    latestLiberationPercent: number | null;
    latestPlayerShare: number | null;
  };
}

export interface ArchiveCampaignSummary {
  planetId: number;
  planetName: string;
  campaignType: string;
  firstSeen: string;
  lastSeen: string;
  sampleCount: number;
  minLiberationPercent: number;
  maxLiberationPercent: number;
  latestLiberationPercent: number;
  maxPlayerShare: number;
}

export interface MajorOrderArchiveItem {
  majorOrderId: string;
  title: string;
  firstSeen: string;
  lastSeen: string;
  latestExpiresAt: string | null;
  latestHoursRemaining: number | null;
  relevantPlanetIds: number[];
  progress: unknown[];
}
