import { useEffect, useState } from 'react';
import type { Recommendation } from '../api/types.js';
import { formatHours } from '../lib/format.js';

type Alert = Recommendation['critical_alerts'][number];

const alertStyles: Record<Alert['kind'], { border: string; bg: string; icon: string }> = {
  defense_deadline: { border: 'border-red-500', bg: 'bg-red-950/40', icon: '🚨' },
  campaign_collapse: { border: 'border-orange-500', bg: 'bg-orange-950/40', icon: '⚠' },
  isolation: { border: 'border-purple-500', bg: 'bg-purple-950/40', icon: '🔒' },
  mo_at_risk: { border: 'border-yellow-500', bg: 'bg-yellow-950/40', icon: '⚡' },
};

function AlertCard({ alert }: { alert: Alert }) {
  const [countdown, setCountdown] = useState<string>('');
  const style = alertStyles[alert.kind];

  useEffect(() => {
    if (alert.hours_remaining === null) return;
    const update = () => setCountdown(formatHours(alert.hours_remaining!));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [alert.hours_remaining]);

  const wikiUrl = `https://helldivers.wiki.gg/wiki/${encodeURIComponent(alert.planet.replace(/ /g, '_'))}`;

  return (
    <div className={`border ${style.border} ${style.bg} rounded p-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span>{style.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <a
                href={wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-white hover:underline"
              >
                {alert.planet}
              </a>
              <span className="text-xs text-gray-400 uppercase">{alert.kind.replace('_', ' ')}</span>
            </div>
            <div className="text-sm text-gray-200">{alert.headline}</div>
            <div className="text-xs text-gray-400 mt-1">{alert.reasoning}</div>
          </div>
        </div>
        {countdown && (
          <div className="text-right shrink-0">
            <div className="text-lg font-mono font-bold text-red-400">{countdown}</div>
            <div className="text-xs text-gray-500">remaining</div>
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  alerts: Alert[];
}

export function CriticalAlerts({ alerts }: Props) {
  if (alerts.length === 0) return null;
  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <h2 className="text-red-400 font-bold uppercase text-sm tracking-widest mb-2">Critical Alerts</h2>
      <div className="space-y-2">
        {alerts.map((a, i) => <AlertCard key={i} alert={a} />)}
      </div>
    </div>
  );
}
