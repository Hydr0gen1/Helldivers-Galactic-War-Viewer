import type { ArchiveEvent, CampaignProgressSample } from '../../api/archiveTypes.js';

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const fmt = (value: string | null | undefined) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

type MetricPoint = { x: number; y: number; sample: CampaignProgressSample };

const byTimestampAsc = (a: CampaignProgressSample, b: CampaignProgressSample) => Date.parse(a.timestamp) - Date.parse(b.timestamp);

function SimpleMetricChart({ samples, title, unit, color, getY, emptyMessage, formatY }: { samples: CampaignProgressSample[]; title: string; unit: string; color: string; getY: (s: CampaignProgressSample) => number | null; emptyMessage: string; formatY?: (n: number) => string }) {
  const sorted = samples.slice().sort(byTimestampAsc);
  const withTimes = sorted.map((sample, index) => ({ sample, index, time: Date.parse(sample.timestamp) })).filter((row) => isNum(row.time));
  const minTime = withTimes.length ? Math.min(...withTimes.map((row) => row.time)) : null;
  const maxTime = withTimes.length ? Math.max(...withTimes.map((row) => row.time)) : null;
  const useIndexFallback = minTime == null || maxTime == null || minTime === maxTime;

  const valid = sorted.map((sample, index, arr) => {
    const y = getY(sample);
    const parsedTime = Date.parse(sample.timestamp);
    const indexX = arr.length < 2 ? 0 : index / (arr.length - 1);
    const x = useIndexFallback || !isNum(parsedTime) ? indexX : (parsedTime - minTime) / (maxTime - minTime);
    return isNum(y) ? ({ x, y, sample } satisfies MetricPoint) : null;
  }).filter((p): p is MetricPoint => p !== null);

  if (valid.length < 2) return <div className="text-gray-400 text-sm">{emptyMessage}</div>;
  const minY = Math.min(...valid.map((p) => p.y));
  const maxY = Math.max(...valid.map((p) => p.y));
  const range = maxY - minY || 1;
  const f = formatY ?? ((n: number) => n.toFixed(2));
  const path = valid.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x * 100} ${80 - (((p.y - minY) / range) * 70 + 5)}`).join(' ');
  const campaignTypes = Array.from(new Set(sorted.map((s) => s.campaignType))).filter(Boolean);

  return <div className="space-y-2"><div className="text-xs text-gray-400">{title} ({unit})</div><svg viewBox="0 0 100 80" className="w-full h-32 bg-gray-900 rounded"><path d={path} stroke={color} strokeWidth="1.5" fill="none" /></svg><div className="text-xs text-gray-400 flex justify-between"><span>min {f(minY)}</span><span>oldest → newest</span><span>max {f(maxY)}</span></div><div className="flex flex-wrap gap-1">{campaignTypes.map((type) => <span key={type} className="text-[10px] uppercase tracking-wide bg-gray-800 border border-gray-700 rounded px-2 py-0.5">{type}</span>)}</div></div>;
}

export function PlanetProgressCharts({ samples, events }: { samples: CampaignProgressSample[]; events: ArchiveEvent[] }) {
  if (samples.length < 2) return <div className="text-gray-400 text-sm">Not enough historical samples yet. Leave the server running for more polling cycles.</div>;
  return <div className="space-y-3"><div className="grid md:grid-cols-2 gap-3"><div className="bg-gray-900 border border-gray-800 p-3 rounded"><SimpleMetricChart samples={samples} title="Liberation progress" unit="%" color="#22d3ee" getY={(s) => s.liberationPercent} formatY={(y) => `${(y * 100).toFixed(1)}%`} emptyMessage="Not enough historical samples yet. Leave the server running for more polling cycles." /></div><div className="bg-gray-900 border border-gray-800 p-3 rounded"><SimpleMetricChart samples={samples} title="Progress efficiency" unit="%/hr" color="#f59e0b" getY={(s) => s.liberationDeltaPerHour} formatY={(y) => `${(y * 100).toFixed(2)}%/hr`} emptyMessage="Efficiency data appears after at least two samples for the same campaign type." /></div><div className="bg-gray-900 border border-gray-800 p-3 rounded"><SimpleMetricChart samples={samples} title="Player concentration" unit="share" color="#34d399" getY={(s) => s.playerShare} formatY={(y) => `${(y * 100).toFixed(1)}%`} emptyMessage="Not enough player concentration samples yet." /></div><div className="bg-gray-900 border border-gray-800 p-3 rounded"><SimpleMetricChart samples={samples} title="HP remaining" unit="hp" color="#a78bfa" getY={(s) => s.healthCurrent} formatY={(y) => y.toFixed(0)} emptyMessage="Not enough HP samples yet." /></div></div><div className="bg-gray-900 border border-gray-800 p-3 rounded"><div className="font-semibold mb-2">Events during this battle</div>{events.length ? events.map((event) => <div key={event.id} className="text-sm text-gray-300">{fmt(event.timestamp)} • {event.eventType} • {event.title}</div>) : <div className="text-sm text-gray-400">No planet-specific events recorded yet.</div>}</div></div>;
}
