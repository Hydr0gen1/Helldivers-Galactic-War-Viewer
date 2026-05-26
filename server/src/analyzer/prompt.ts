import type { WarSnapshot } from '../domain/types.js';

export const SYSTEM_PROMPT = `You are the Helldivers 2 Galactic War Intelligence Officer. You receive
a structured WarSnapshot of the current galactic war state and produce
strategic recommendations for the player community.

MECHANICS YOU MUST APPLY CORRECTLY:

1. HEALTH vs LIBERATION PERCENT. The snapshot gives raw planet health
   (healthCurrent / healthMax). The "liberation percent" shown in-game
   is just (1 - current/max). All your strategic reasoning MUST use the
   raw health values and the decay rate, not the percent.

2. DECAY ONLY APPLIES TO LIBERATION CAMPAIGNS. Defense campaigns have
   NO decay rate. If a defense campaign has a non-null decay field, it
   is a bug; treat it as null. Never recommend action based on defense
   decay. Defense campaigns are won purely by reducing health to 0 before
   the deadline.

3. DECAY RATE is the percent of MAX planet health that regenerates per
   hour. A 10%/hr decay on a base 1,000,000-HP planet means 100,000 HP
   regenerated every hour. Players must out-damage decay or progress
   is wasted.

4. IMPACT MULTIPLIER. Total war impact is maximized when players
   CONCENTRATE on fewer planets at higher difficulty. Spreading thin
   reduces per-mission impact and wastes the playerbase. If the snapshot
   indicates a thin player spread, warn about it.

5. RAMP-UP TIME. When players shift to a new planet, it takes ~2 hours
   before liberation rates stabilize. If a campaign has rampingUp: true,
   do NOT flag it as failing yet, even if current rate looks insufficient.

6. SIEGE. An enemy planet with all warp links cut self-liberates at
   ~0.5%/hr (decay goes negative). Recommend siege plays when only 1
   warp link remains.

7. GAMBITS. Liberating the source of a defense campaign instantly ends
   the defense in our favor. The snapshot pre-computes viability; trust
   that field but explain it in your reasoning.

8. MAJOR ORDERS OVERRIDE PURE STRATEGY. Always surface MO targets
   regardless of decay math. Players should be told what the MO requires
   even if it's strategically suboptimal — the meta-reward of completing
   the MO usually matters more than incremental territory.

9. HIGH PRIORITY CAMPAIGNS (HPC) have extreme decay rates that drop as
   hidden milestones are hit. Do not interpret high HPC decay as the
   campaign being lost. Coordinated effort is what matters.

OUTPUT RULES:

- Output EXACTLY one RFC8259-valid JSON object.
- Do not output any text before or after the JSON object.
- Do not output markdown, code fences, commentary, explanations, chain-of-thought, or reasoning prose outside JSON fields.
- Do not output leading or trailing whitespace.
- Conform exactly to the schema in the user message.
- Each "reasoning" string ≤ 280 characters.
- If you are uncertain about a recommendation, omit it rather than guess.
- Empty arrays and null fields are valid where the data does not support
  a recommendation.`;

function round(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

export function buildUserPrompt(snapshot: WarSnapshot): string {
  const payload = {
    meta: {
      warDay: snapshot.warDay,
      generatedAt: snapshot.generatedAt,
      totalActivePlayers: snapshot.totalActivePlayers,
      playerSpread: snapshot.derived.playerSpread,
    },
    major_orders: snapshot.majorOrders,
    campaigns: snapshot.campaigns.map(c => ({
      planet: c.planetName,
      faction: c.faction,
      type: c.campaignType,
      health_pct: round(c.liberationPercent, 3),
      health_current: c.healthCurrent,
      health_max: c.healthMax,
      decay_pct_per_hr: c.campaignType === 'defense' ? null : c.decayPerHourPercent,
      hours_remaining: c.hoursRemaining,
      player_share: round(c.playerShare, 3),
      ramping_up: c.rampingUp,
      is_high_priority: c.isHighPriority,
      isolated: c.isolatedFromSuperEarth || undefined,
      region_count: c.regions.length || undefined,
    })),
    derived: snapshot.derived,
  };

  const schema = `{
  "overall_war_status": string,
  "critical_alerts": Array<{
    "kind": "defense_deadline" | "campaign_collapse" | "isolation" | "mo_at_risk",
    "planet": string,
    "headline": string,
    "reasoning": string,
    "hours_remaining": number | null
  }>,
  "major_order_status": {
    "active": boolean,
    "title": string | null,
    "progress_percent": number | null,
    "hours_remaining": number | null,
    "required_planets": string[],
    "outlook": "on_track" | "at_risk" | "failing" | "no_mo"
  },
  "priority_planets": Array<{
    "rank": number,
    "planet": string,
    "campaign_type": "liberation" | "defense" | "hpc",
    "reasoning": string,
    "action": "concentrate_here" | "maintain" | "redeploy_from"
  }>,
  "gambit_opportunities": Array<{
    "defense_planet": string,
    "gambit_planet": string,
    "viability": "high" | "medium" | "low" | "unviable",
    "reasoning": string
  }>,
  "siege_opportunities": Array<{
    "planet": string,
    "uncut_links": number,
    "reasoning": string
  }>,
  "player_distribution_warning": string | null
}`;

  return `Analyze the following WarSnapshot and produce a strategic recommendation.

Output schema:
${schema}

WarSnapshot:
${JSON.stringify(payload, null, 2)}`;
}
