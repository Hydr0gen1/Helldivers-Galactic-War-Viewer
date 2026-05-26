import type { ChronicleEventDetectionContext, WarEventRow } from './types.js';


function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function detectWarEvents(context: ChronicleEventDetectionContext): WarEventRow[] {
  const { snapshot, currentRows, previousByCampaignKey } = context;
  const events: WarEventRow[] = [];
  const timestamp = snapshot.generatedAt;

  for (const alert of snapshot.derived.defensesEndingSoon) {
    if (alert.outcomeRisk !== 'critical') continue;
    const campaign = snapshot.campaigns.find((c) => c.planetName === alert.planetName && c.campaignType === 'defense');
    if (!campaign) continue;
    events.push({
      timestamp,
      event_type: 'defense_critical',
      severity: 'high',
      planet_id: campaign.planetId,
      planet_name: campaign.planetName,
      title: `Defense critical on ${campaign.planetName}`,
      summary: `${campaign.planetName} defense is at critical risk with ${alert.hoursRemaining.toFixed(1)}h remaining.`,
      data_json: JSON.stringify(alert),
    });
  }

  for (const gambit of snapshot.derived.viableGambits) {
    const campaign = snapshot.campaigns.find((c) => c.planetName === gambit.gambitPlanetName);
    events.push({
      timestamp,
      event_type: 'gambit_opened',
      severity: gambit.viability === 'high' ? 'high' : 'medium',
      planet_id: campaign?.planetId ?? null,
      planet_name: gambit.gambitPlanetName,
      title: `Gambit window opened: ${gambit.gambitPlanetName}`,
      summary: `A gambit can relieve pressure on ${gambit.defensePlanetName}.`,
      data_json: JSON.stringify(gambit),
    });
  }

  for (const siege of snapshot.derived.siegeCandidates) {
    const campaign = snapshot.campaigns.find((c) => c.planetName === siege.planetName);
    events.push({
      timestamp,
      event_type: 'siege_opportunity',
      severity: siege.uncutLinks <= 1 ? 'medium' : 'low',
      planet_id: campaign?.planetId ?? null,
      planet_name: siege.planetName,
      title: `Siege opportunity: ${siege.planetName}`,
      summary: `${siege.planetName} can be sieged by cutting ${siege.uncutLinks} remaining links.`,
      data_json: JSON.stringify(siege),
    });
  }

  if (snapshot.majorOrders.length > 0) {
    const seenMajorOrderActiveKeys = new Set<string>();
    for (const order of snapshot.majorOrders) {
      const dedupeKey = `${order.id}::${order.expiresAt}::${stableStringify(order.progress)}`;
      if (seenMajorOrderActiveKeys.has(dedupeKey)) continue;
      seenMajorOrderActiveKeys.add(dedupeKey);
      events.push({
        timestamp,
        event_type: 'major_order_active',
        severity: 'medium',
        planet_id: null,
        planet_name: null,
        title: `Major Order active: ${order.title}`,
        summary: `Major Order has ${order.hoursRemaining.toFixed(1)}h remaining.`,
        data_json: JSON.stringify({
          majorOrderId: order.id,
          title: order.title,
          relevantPlanetIds: order.relevantPlanetIds,
          progress: order.progress.map((item) => ({
            type: item.type,
            planetName: item.planetName ?? null,
            current: item.current,
            target: item.target,
            percent: item.percent,
          })),
          expiresAt: order.expiresAt,
          hoursRemaining: order.hoursRemaining,
        }),
      });
    }
  }

  // NOTE: Event coalescing/deduplication (e.g., repeated stalled signals) is intentionally
  // deferred to future War Archive API/UI layers where timeline views can aggregate events.
  for (const row of currentRows) {
    const previous = previousByCampaignKey.get(`${row.planet_id}:${row.campaign_type}`);
    if (previous) {
      const shareDelta = row.player_share - previous.player_share;
      if (shareDelta >= 0.05 || row.players_delta >= 5000) {
        events.push({
          timestamp,
          event_type: 'player_surge',
          severity: 'medium',
          planet_id: row.planet_id,
          planet_name: row.planet_name,
          title: `Player surge on ${row.planet_name}`,
          summary: `Player concentration surged by ${(shareDelta * 100).toFixed(1)}pp.`,
          data_json: JSON.stringify({ shareDelta, playersDelta: row.players_delta }),
        });
      }
    }

    if (
      row.liberation_delta_per_hour !== null
      && row.liberation_delta_per_hour <= 0.05
      && row.player_share >= 0.05
      && row.ramping_up === 0
    ) {
      events.push({
        timestamp,
        event_type: 'campaign_stalled',
        severity: 'medium',
        planet_id: row.planet_id,
        planet_name: row.planet_name,
        title: `Campaign stalled on ${row.planet_name}`,
        summary: `Liberation pace is low despite meaningful player allocation.`,
        data_json: JSON.stringify({ liberationDeltaPerHour: row.liberation_delta_per_hour, playerShare: row.player_share }),
      });
    }
  }

  return events;
}
