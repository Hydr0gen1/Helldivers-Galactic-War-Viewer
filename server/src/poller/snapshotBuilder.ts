import type { Planet, Campaign, WarStatus, Assignment } from './endpoints.js';
import type {
  WarSnapshot, NormalizedCampaign, MajorOrder, DefenseAlert,
  GambitOpportunity, SiegeCandidate
} from '../domain/types.js';
import { computeRegionBonus } from '../domain/decay.js';
import { computeGambitViability } from '../domain/gambit.js';
import { computeSiegeCandidate } from '../domain/siege.js';
import { hoursUntil, addHours } from '../util/time.js';
import { memoryStore } from '../cache/memoryStore.js';
import { CACHE_KEYS } from '../cache/keys.js';
import { logger } from '../logger.js';

type AssignmentTask = Assignment['tasks'][number];

const UNKNOWN_MO_TASK_TYPES = new Set<number>();
const UNKNOWN_MO_VALUE_TYPES = new Set<number>();

const MAJOR_ORDER_TASK_TYPE_MAP: Record<number, MajorOrder['progress'][number]['type']> = {
  11: 'liberation',
  12: 'defense',
  2: 'kill_count',
  3: 'item_gather',
};

const MAJOR_ORDER_PLANET_VALUE_TYPE = 12;

// planet ID -> array of {ts, players}
interface PlayerHistoryEntry {
  ts: number;
  players: number;
  share: number;
}

const REGION_TIER_MAP: Record<number, 'Settlement' | 'Town' | 'City' | 'MegaCity'> = {
  1: 'Settlement',
  2: 'Town',
  3: 'City',
  4: 'MegaCity',
};

function tierFromIndex(n: number): 'Settlement' | 'Town' | 'City' | 'MegaCity' {
  return REGION_TIER_MAP[n] ?? 'Settlement';
}

function updatePlayerHistory(planetId: number, players: number, share: number): PlayerHistoryEntry[] {
  const key = CACHE_KEYS.PLAYER_HISTORY(planetId);
  const cached = memoryStore.get<PlayerHistoryEntry[]>(key);
  const history = cached?.value ?? [];
  const now = Date.now();
  const entry: PlayerHistoryEntry = { ts: now, players, share };
  const trimmed = [...history.filter(e => now - e.ts < 3 * 60 * 60 * 1000), entry];
  memoryStore.setWithGrace(key, trimmed, 3 * 60 * 60 * 1000, 60 * 60 * 1000);
  return trimmed;
}

function detectRampUp(planetId: number, history: PlayerHistoryEntry[]): { rampingUp: boolean; rampUpUntil: string | null } {
  if (history.length < 3) return { rampingUp: false, rampUpUntil: null };
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  const oldEntries = history.filter(e => e.ts <= twoHoursAgo);
  if (oldEntries.length === 0) return { rampingUp: false, rampUpUntil: null };
  const oldShare = oldEntries[oldEntries.length - 1].share;
  const current = history[history.length - 1];
  const prev = history[history.length - 2];
  const rising = current.share > prev.share;
  const doubled = oldShare > 0 && current.share >= oldShare * 2;
  if (doubled && rising) {
    return {
      rampingUp: true,
      rampUpUntil: addHours(new Date(), 2).toISOString(),
    };
  }
  return { rampingUp: false, rampUpUntil: null };
}

function classifySpread(campaigns: NormalizedCampaign[]): 'concentrated' | 'balanced' | 'thin' {
  if (campaigns.length === 0) return 'balanced';
  const topShare = Math.max(...campaigns.map(c => c.playerShare));
  if (topShare >= 0.40) return 'concentrated';
  if (campaigns.length > 5 && campaigns.every(c => c.playerShare < 0.15)) return 'thin';
  return 'balanced';
}

// Campaign types: 0=liberation, 1=defense, 2=hpc per community docs (approximate)
function campaignTypeFromInt(type: number): 'liberation' | 'defense' | 'hpc' {
  if (type === 1) return 'defense';
  if (type === 2) return 'hpc';
  return 'liberation';
}

function factionFromString(s: string | undefined): NormalizedCampaign['faction'] {
  if (!s) return 'Humans';
  const lower = s.toLowerCase();
  if (lower.includes('terminid') || lower.includes('bug')) return 'Terminids';
  if (lower.includes('automaton') || lower.includes('bot')) return 'Automatons';
  if (lower.includes('illuminate') || lower.includes('squid')) return 'Illuminate';
  return 'Humans';
}

export function majorOrderTaskTypeFromInt(type: number | null | undefined): MajorOrder['progress'][number]['type'] {
  if (typeof type !== 'number') return 'other';
  const mapped = MAJOR_ORDER_TASK_TYPE_MAP[type];
  if (mapped) return mapped;
  if (!UNKNOWN_MO_TASK_TYPES.has(type)) {
    UNKNOWN_MO_TASK_TYPES.add(type);
    logger.warn({ type }, 'Unknown major-order task.type; defaulting to other');
  }
  return 'other';
}

export function extractRelevantPlanetIds(tasks: AssignmentTask[]): number[] {
  const ids = new Set<number>();

  for (const task of tasks) {
    const values = task.values ?? [];
    const valueTypes = task.valueTypes ?? [];

    for (let i = 0; i < Math.min(values.length, valueTypes.length); i += 1) {
      const value = values[i];
      const valueType = valueTypes[i];
      if (valueType === MAJOR_ORDER_PLANET_VALUE_TYPE) {
        ids.add(value);
      } else if (!UNKNOWN_MO_VALUE_TYPES.has(valueType)) {
        UNKNOWN_MO_VALUE_TYPES.add(valueType);
        logger.warn({ valueType }, 'Unknown major-order task.valueType encountered');
      }
    }
  }

  return [...ids];
}

export function buildSnapshot(
  warStatus: WarStatus,
  planets: Planet[],
  campaigns: Campaign[],
  assignments: Assignment[],
  staleSeconds: number,
  apiHealth: WarSnapshot['apiHealth'],
): WarSnapshot {
  const now = new Date();
  const warStartMs = warStatus.started ? new Date(warStatus.started).getTime() : Date.now();
  const warDay = Math.floor((Date.now() - warStartMs) / (1000 * 60 * 60 * 24));

  const planetById = new Map<number, Planet>(planets.map(p => [p.index, p]));
  const attackersByDefendedPlanet = new Map<number, number[]>();
  for (const planet of planets) {
    for (const defendedPlanetId of planet.attacking ?? []) {
      const attackers = attackersByDefendedPlanet.get(defendedPlanetId) ?? [];
      attackers.push(planet.index);
      attackersByDefendedPlanet.set(defendedPlanetId, attackers);
    }
  }

  const totalActivePlayers = campaigns.reduce((s, c) => s + (c.planet.players ?? 0), 0);

  const normalizedCampaigns: NormalizedCampaign[] = campaigns.map(campaign => {
    const planet = campaign.planet;
    const campaignType = campaignTypeFromInt(campaign.type);
    const faction = factionFromString(planet.faction);

    // Region processing
    const regions = (planet.regions ?? []).map(r => {
      const tier = tierFromIndex(r.regionTier ?? 1);
      const regionHealthMax = 1_000_000; // each region has its own max; use API if available
      return {
        name: r.name,
        tier,
        healthCurrent: r.health ?? 0,
        healthMax: r.maxHealth ?? regionHealthMax,
        captured: (r.faction ?? '') === 'Humans' || (r.health ?? 0) <= 0,
      };
    });

    // HP max: 1,000,000 base + region bonuses
    const computedMax = 1_000_000 + regions.reduce((s, r) => s + computeRegionBonus(r.tier), 0);
    const apiMax = planet.maxHealth ?? 1_000_000;
    if (Math.abs(computedMax - apiMax) / apiMax > 0.05) {
      logger.warn({ planet: planet.name, computedMax, apiMax }, 'HP max diverges >5% from API');
    }
    const healthMax = apiMax; // trust API as authoritative
    const healthCurrent = planet.health ?? healthMax;
    const liberationPercent = Math.max(0, Math.min(1, 1 - healthCurrent / healthMax));

    // Decay: only for liberation/hpc, NEVER for defense
    let decayPerHourPercent: number | null = null;
    let decayPerHourHp: number | null = null;
    if (campaignType !== 'defense') {
      const regenPerSecond = planet.regenPerSecond ?? 0;
      if (regenPerSecond > 0) {
        decayPerHourHp = regenPerSecond * 3600;
        decayPerHourPercent = (decayPerHourHp / healthMax) * 100;
      }
    }
    // Defense campaigns — force null decay (CRITICAL: see spec §2.3 rule 2)
    if (campaignType === 'defense') {
      decayPerHourPercent = null;
      decayPerHourHp = null;
    }

    // Defense deadline — look it up from assignment progress if possible
    let defenseDeadline: string | null = null;
    let hoursRemaining: number | null = null;
    if (campaignType === 'defense') {
      // Find matching assignment that references this planet
      for (const a of assignments) {
        if (a.expiration) {
          const hrs = hoursUntil(a.expiration);
          if (hrs > 0 && (hoursRemaining === null || hrs < hoursRemaining)) {
            defenseDeadline = a.expiration;
            hoursRemaining = hrs;
          }
        }
      }
    }

    const playerShare = totalActivePlayers > 0 ? (planet.players ?? 0) / totalActivePlayers : 0;
    const history = updatePlayerHistory(planet.index, planet.players ?? 0, playerShare);
    const { rampingUp, rampUpUntil } = detectRampUp(planet.index, history);

    // Warp links
    const warpLinks = planet.waypoints ?? [];
    const warpLinkPlanetNames = warpLinks.map(id => planetById.get(id)?.name ?? `Planet ${id}`);

    // Isolation: no warp link neighbor controlled by Super Earth
    const isolatedFromSuperEarth = campaignType !== 'defense' && warpLinks.length > 0 &&
      warpLinks.every(id => {
        const neighbor = planetById.get(id);
        return !neighbor || factionFromString(neighbor.faction) !== 'Humans';
      });

    return {
      planetId: planet.index,
      planetName: planet.name,
      faction,
      campaignType,
      healthCurrent,
      healthMax,
      liberationPercent,
      decayPerHourPercent,
      decayPerHourHp,
      defenseDeadline,
      hoursRemaining,
      playersOnPlanet: planet.players ?? 0,
      playerShare,
      regions,
      warpLinks,
      warpLinkPlanetNames,
      isolatedFromSuperEarth,
      rampingUp,
      rampUpUntil,
      isHighPriority: campaignType === 'hpc',
    };
  });

  // Top planets by players
  const topPlanetsByPlayers = [...normalizedCampaigns]
    .sort((a, b) => b.playersOnPlanet - a.playersOnPlanet)
    .slice(0, 5)
    .map(c => ({ planet: c.planetName, players: c.playersOnPlanet, share: c.playerShare }));

  // Defense alerts
  const defensesEndingSoon: DefenseAlert[] = normalizedCampaigns
    .filter(c => c.campaignType === 'defense' && c.hoursRemaining !== null && c.hoursRemaining < 12)
    .map(c => {
      const healthPercent = c.healthCurrent / c.healthMax;
      let outcomeRisk: DefenseAlert['outcomeRisk'];
      if (c.hoursRemaining! < 3 && healthPercent > 0.5) outcomeRisk = 'critical';
      else if (c.hoursRemaining! < 6) outcomeRisk = 'at_risk';
      else outcomeRisk = 'on_track';
      return {
        planetName: c.planetName,
        faction: c.faction,
        hoursRemaining: c.hoursRemaining!,
        healthPercent,
        playerShare: c.playerShare,
        outcomeRisk,
      };
    });

  // Gambits
  const defenseCampaigns = normalizedCampaigns.filter(c => c.campaignType === 'defense');
  const liberationByPlanetId = new Map(
    normalizedCampaigns
      .filter(c => c.campaignType === 'liberation' || c.campaignType === 'hpc')
      .map(c => [c.planetId, c])
  );

  const viableGambits: GambitOpportunity[] = [];
  for (const defense of defenseCampaigns) {
    const attackingPlanetIds = attackersByDefendedPlanet.get(defense.planetId) ?? [];
    for (const attackingPlanetId of attackingPlanetIds) {
      const libCampaign = liberationByPlanetId.get(attackingPlanetId);
      if (!libCampaign) continue;
      const gambit = computeGambitViability({
        defensePlanetName: defense.planetName,
        defenseHoursRemaining: defense.hoursRemaining ?? 999,
        gambitPlanetName: libCampaign.planetName,
        gambitLiberationPercent: libCampaign.liberationPercent,
        gambitDecayPerHourPercent: libCampaign.decayPerHourPercent ?? 0,
        gambitPlayerShare: libCampaign.playerShare,
      });
      viableGambits.push(gambit);
    }
  }

  // Siege candidates
  const siegeCandidates: SiegeCandidate[] = [];
  const activeDefensePlanetIds = new Set(
    normalizedCampaigns
      .filter(c => c.campaignType === 'defense')
      .map(c => c.planetId)
  );

  for (const planet of planets) {
    const faction = factionFromString(planet.faction);
    if (faction === 'Humans') continue;
    if (activeDefensePlanetIds.has(planet.index)) continue;

    const neighbors = (planet.waypoints ?? []).map(id => {
      const neighbor = planetById.get(id);
      return {
        name: neighbor?.name ?? `Planet ${id}`,
        controlledBySuperEarth: neighbor ? factionFromString(neighbor.faction) === 'Humans' : false,
      };
    });
    const candidate = computeSiegeCandidate({
      planetName: planet.name,
      faction,
      warpLinkNeighbors: neighbors,
    });
    if (candidate) siegeCandidates.push(candidate);
  }

  // Major orders
  const majorOrders: MajorOrder[] = assignments.map(a => ({
    id: String(a.id),
    title: a.title ?? 'Major Order',
    briefing: a.briefing ?? a.description ?? '',
    expiresAt: a.expiration ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    hoursRemaining: a.expiration ? hoursUntil(a.expiration) : 24,
    progress: a.tasks.map((task, i) => {
      const current = a.progress[i] ?? 0;
      const target = task.values[0] ?? 1;
      return {
        type: majorOrderTaskTypeFromInt(task.type),
        current,
        target,
        percent: target > 0 ? current / target : 0,
      };
    }),
    relevantPlanetIds: extractRelevantPlanetIds(a.tasks),
  }));

  return {
    generatedAt: now.toISOString(),
    warDay,
    staleSeconds,
    apiHealth,
    majorOrders,
    campaigns: normalizedCampaigns,
    totalActivePlayers,
    topPlanetsByPlayers,
    derived: {
      defensesEndingSoon,
      viableGambits,
      siegeCandidates,
      playerSpread: classifySpread(normalizedCampaigns),
    },
  };
}
