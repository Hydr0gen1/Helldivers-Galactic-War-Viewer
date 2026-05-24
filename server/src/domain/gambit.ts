import type { GambitOpportunity } from './types.js';

export interface GambitInput {
  defensePlanetName: string;
  defenseHoursRemaining: number;
  gambitPlanetName: string;
  gambitLiberationPercent: number;  // 0..1
  gambitDecayPerHourPercent: number;
  gambitPlayerShare: number;        // 0..1
}

export function computeGambitViability(input: GambitInput): GambitOpportunity {
  const { gambitLiberationPercent, gambitDecayPerHourPercent, gambitPlayerShare } = input;
  const libPct = gambitLiberationPercent;
  const decayPct = gambitDecayPerHourPercent;

  let viability: GambitOpportunity['viability'];
  let viabilityReason: string;

  if (decayPct > 15 || gambitPlayerShare < 0.02) {
    viability = 'unviable';
    viabilityReason = decayPct > 15
      ? `Decay too high at ${decayPct.toFixed(1)}%/hr — gambit not achievable`
      : `Insufficient player presence (${(gambitPlayerShare * 100).toFixed(1)}%) to execute gambit`;
  } else if (libPct >= 0.6 && decayPct <= 5) {
    viability = 'high';
    viabilityReason = `${(libPct * 100).toFixed(0)}% liberated, low decay (${decayPct.toFixed(1)}%/hr) — strong gambit candidate`;
  } else if (libPct >= 0.3 && decayPct <= 10) {
    viability = 'medium';
    viabilityReason = `${(libPct * 100).toFixed(0)}% liberated, manageable decay (${decayPct.toFixed(1)}%/hr)`;
  } else {
    viability = 'low';
    viabilityReason = `${(libPct * 100).toFixed(0)}% liberated — in progress but uncertain`;
  }

  return {
    defensePlanetName: input.defensePlanetName,
    defenseHoursRemaining: input.defenseHoursRemaining,
    gambitPlanetName: input.gambitPlanetName,
    gambitDecayPerHourPercent: gambitDecayPerHourPercent,
    gambitHealthPercent: gambitLiberationPercent,
    gambitPlayerShare: gambitPlayerShare,
    viability,
    viabilityReason,
  };
}
