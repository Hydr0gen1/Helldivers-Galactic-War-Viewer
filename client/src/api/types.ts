export interface WarSnapshot {
  generatedAt: string;
  warDay: number;
  staleSeconds: number;
  apiHealth: {
    warStatus: 'ok' | 'stale' | 'error';
    planets: 'ok' | 'stale' | 'error';
    campaigns: 'ok' | 'stale' | 'error';
    assignments: 'ok' | 'stale' | 'error';
  };
  majorOrders: MajorOrder[];
  campaigns: NormalizedCampaign[];
  totalActivePlayers: number;
  topPlanetsByPlayers: Array<{ planet: string; players: number; share: number }>;
  derived: {
    defensesEndingSoon: DefenseAlert[];
    viableGambits: GambitOpportunity[];
    siegeCandidates: SiegeCandidate[];
    playerSpread: 'concentrated' | 'balanced' | 'thin';
  };
}

export interface NormalizedCampaign {
  planetId: number;
  planetName: string;
  faction: 'Terminids' | 'Automatons' | 'Illuminate' | 'Humans';
  campaignType: 'liberation' | 'defense' | 'hpc';
  healthCurrent: number;
  healthMax: number;
  liberationPercent: number;
  decayPerHourPercent: number | null;
  decayPerHourHp: number | null;
  defenseDeadline: string | null;
  hoursRemaining: number | null;
  playersOnPlanet: number;
  playerShare: number;
  regions: Array<{
    name: string;
    tier: string;
    healthCurrent: number;
    healthMax: number;
    captured: boolean;
  }>;
  warpLinks: number[];
  warpLinkPlanetNames: string[];
  isolatedFromSuperEarth: boolean;
  rampingUp: boolean;
  rampUpUntil: string | null;
  isHighPriority: boolean;
}

export interface MajorOrder {
  id: string;
  title: string;
  briefing: string;
  expiresAt: string;
  hoursRemaining: number;
  progress: Array<{
    planetName?: string;
    type: string;
    current: number;
    target: number;
    percent: number;
  }>;
  relevantPlanetIds: number[];
}

export interface DefenseAlert {
  planetName: string;
  faction: string;
  hoursRemaining: number;
  healthPercent: number;
  playerShare: number;
  outcomeRisk: 'critical' | 'at_risk' | 'on_track';
}

export interface GambitOpportunity {
  defensePlanetName: string;
  defenseHoursRemaining: number;
  gambitPlanetName: string;
  gambitDecayPerHourPercent: number;
  gambitHealthPercent: number;
  gambitPlayerShare: number;
  viability: 'high' | 'medium' | 'low' | 'unviable';
  viabilityReason: string;
}

export interface SiegeCandidate {
  planetName: string;
  faction: string;
  warpLinkNeighbors: Array<{ name: string; controlledBySuperEarth: boolean }>;
  uncutLinks: number;
  estimatedHoursToSiege: number | null;
}

export interface Recommendation {
  overall_war_status: string;
  critical_alerts: Array<{
    kind: 'defense_deadline' | 'campaign_collapse' | 'isolation' | 'mo_at_risk';
    planet: string;
    headline: string;
    reasoning: string;
    hours_remaining: number | null;
  }>;
  major_order_status: {
    active: boolean;
    title: string | null;
    progress_percent: number | null;
    hours_remaining: number | null;
    required_planets: string[];
    outlook: 'on_track' | 'at_risk' | 'failing' | 'no_mo';
  };
  priority_planets: Array<{
    rank: number;
    planet: string;
    campaign_type: 'liberation' | 'defense' | 'hpc';
    reasoning: string;
    action: 'concentrate_here' | 'maintain' | 'redeploy_from';
  }>;
  gambit_opportunities: Array<{
    defense_planet: string;
    gambit_planet: string;
    viability: 'high' | 'medium' | 'low' | 'unviable';
    reasoning: string;
  }>;
  siege_opportunities: Array<{
    planet: string;
    uncut_links: number;
    reasoning: string;
  }>;
  player_distribution_warning: string | null;
  generatedAt?: string;
  degraded?: boolean;
}
