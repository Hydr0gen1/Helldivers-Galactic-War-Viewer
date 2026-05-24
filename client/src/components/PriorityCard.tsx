import type { NormalizedCampaign, Recommendation } from '../api/types.js';
import { factionTheme } from '../lib/factionTheme.js';
import { formatNumber, formatPercent, formatHours } from '../lib/format.js';

type Priority = Recommendation['priority_planets'][number];

const actionStyles = {
  concentrate_here: 'bg-green-500/20 text-green-400 border-green-500/50',
  maintain: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  redeploy_from: 'bg-red-500/20 text-red-400 border-red-500/50',
};

interface Props {
  priority: Priority;
  campaign?: NormalizedCampaign;
}

export function PriorityCard({ priority, campaign }: Props) {
  const theme = factionTheme[campaign?.faction ?? 'Humans'];

  const healthPercent = campaign
    ? campaign.healthCurrent / campaign.healthMax
    : 0;

  return (
    <div
      id={`planet-${priority.planet}`}
      className={`border ${theme.border} ${theme.bg} rounded p-4`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-500 text-sm font-mono">#{priority.rank}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${theme.badge}`}>
              {campaign?.faction ?? priority.campaign_type}
            </span>
            <span className="text-xs text-gray-500 uppercase">{priority.campaign_type}</span>
          </div>
          <h3 className="text-lg font-bold text-white">{priority.planet}</h3>
        </div>
        <span className={`shrink-0 px-2 py-1 text-xs border rounded ${actionStyles[priority.action]}`}>
          {priority.action.replace(/_/g, ' ')}
        </span>
      </div>

      {campaign && (
        <>
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>
                {campaign.campaignType === 'defense'
                  ? `Enemy at ${formatPercent(1 - healthPercent)}`
                  : `Liberated ${formatPercent(campaign.liberationPercent)}`
                }
              </span>
              <span>{formatNumber(campaign.healthCurrent)} / {formatNumber(campaign.healthMax)} HP</span>
            </div>
            <div className="h-2 bg-gray-800 rounded overflow-hidden">
              <div
                className={`h-full transition-all ${
                  campaign.campaignType === 'defense'
                    ? 'bg-red-500'
                    : theme.text.replace('text-', 'bg-')
                }`}
                style={{
                  width: `${campaign.campaignType === 'defense'
                    ? (1 - healthPercent) * 100
                    : campaign.liberationPercent * 100
                  }%`
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400 mb-3">
            {campaign.campaignType !== 'defense' && campaign.decayPerHourPercent !== null && (
              <div>
                Decay: <span className="text-red-400 font-mono">
                  {campaign.decayPerHourPercent.toFixed(1)}%/hr
                  {campaign.decayPerHourHp !== null && ` (~${formatNumber(campaign.decayPerHourHp)} HP/hr)`}
                </span>
              </div>
            )}
            {campaign.campaignType === 'defense' && campaign.hoursRemaining !== null && (
              <div>
                Deadline: <span className="text-red-400 font-mono">{formatHours(campaign.hoursRemaining)}</span>
              </div>
            )}
            <div>
              Players: <span className="text-white font-mono">
                {formatPercent(campaign.playerShare)} (~{formatNumber(campaign.playersOnPlanet)})
              </span>
            </div>
          </div>

          {campaign.rampingUp && (
            <div className="text-xs text-blue-400 bg-blue-950/40 border border-blue-500/50 rounded px-3 py-2 mb-3">
              Players just arrived — rates will stabilize in ~2h. Hold judgment.
            </div>
          )}
        </>
      )}

      <blockquote className="border-l-2 border-gray-600 pl-3 text-xs text-gray-300 italic">
        {priority.reasoning}
      </blockquote>
    </div>
  );
}
