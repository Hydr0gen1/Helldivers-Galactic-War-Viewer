import { useMemo, useState } from 'react';
import { useArchiveCampaigns, useArchiveEvents, useArchiveMajorOrders, useArchivePlanetHistory, useArchivePlanets, useArchiveSummary } from '../../api/archiveHooks.js';

const fmt = (v: string | null) => (v ? new Date(v).toLocaleString() : '—');

function SimpleLine({ points, color }: { points: Array<{ x: number; y: number | null }>; color: string }) {
  const vals = points.filter((p) => p.y != null) as Array<{ x: number; y: number }>;
  if (vals.length < 2) return <p className="text-gray-400 text-sm">Not enough historical samples yet. Leave the server running for more polling cycles.</p>;
  const minY = Math.min(...vals.map((v) => v.y)); const maxY = Math.max(...vals.map((v) => v.y));
  const d = vals.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 100} ${80 - (((p.y - minY) / (maxY - minY || 1)) * 70 + 5)}`).join(' ');
  return <svg viewBox="0 0 100 80" className="w-full h-32 bg-gray-900 rounded"><path d={d} stroke={color} strokeWidth="1.5" fill="none"/></svg>;
}

export function WarArchivePanel() {
  const summary = useArchiveSummary(); const events = useArchiveEvents(); const planets = useArchivePlanets(); const campaigns = useArchiveCampaigns(); const majorOrders = useArchiveMajorOrders();
  const [selectedPlanet, setSelectedPlanet] = useState<number | null>(null);
  const history = useArchivePlanetHistory(selectedPlanet);

  const minorOrders = useMemo(() => (events.data?.events ?? []).filter((e) => e.eventType === 'minor_order_active'), [events.data]);

  if (summary.isLoading) return <div className="text-gray-300 p-6">Loading War Archive…</div>;
  if (summary.error) return <div className="text-red-300 p-6">Failed to load War Archive.</div>;
  if (!summary.data?.enabled || !summary.data?.available) return <div className="text-yellow-200 p-6">War Archive unavailable. Enable WAR_CHRONICLE_ENABLED and let the server collect data.</div>;

  return <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-gray-100">
    <h2 className="text-2xl font-bold">War Archive</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[
      ['Campaign samples', summary.data.totals.campaignSamples], ['Events', summary.data.totals.events], ['Planets tracked', summary.data.totals.planets], ['Major Orders', summary.data.totals.majorOrders], ['Minor Orders', minorOrders.length], ['Latest event', fmt(summary.data.latest.eventAt)], ['Latest sample', fmt(summary.data.latest.campaignSampleAt)],
    ].map(([k, v]) => <div key={String(k)} className="bg-gray-900 border border-gray-800 p-3 rounded"><div className="text-xs text-gray-400">{k}</div><div className="font-semibold text-sm">{String(v)}</div></div>)}</div>

    <section><h3 className="font-semibold mb-2">Recent event timeline</h3><div className="space-y-2">{(events.data?.events ?? []).slice(0, 20).map((e) => <div className="bg-gray-900 border border-gray-800 p-2 rounded text-sm" key={e.id}><div>{fmt(e.timestamp)} • {e.eventType} • {e.severity}{e.planetName ? ` • ${e.planetName}` : ''}</div><div className="font-semibold">{e.title}</div><div className="text-gray-300">{e.summary}</div></div>)}</div></section>

    <section><h3 className="font-semibold mb-2">Planet archive list</h3><div className="grid md:grid-cols-2 gap-2">{(planets.data?.planets ?? []).map((p) => <button key={p.planetId} onClick={() => setSelectedPlanet(p.planetId)} className="text-left bg-gray-900 border border-gray-800 p-3 rounded hover:border-cyan-600"><div className="font-semibold">{p.planetName ?? `Planet ${p.planetId}`}</div><div className="text-xs text-gray-400">{fmt(p.latestTimestamp)} • {p.campaignTypes.join(', ')} • {p.sampleCount} samples • {p.eventCount} events</div></button>)}</div></section>

    <section><h3 className="font-semibold mb-2">Selected planet history</h3>{history.data ? <div className="space-y-3"><div className="bg-gray-900 border border-gray-800 p-3 rounded text-sm">{history.data.planetName} • {history.data.summary.sampleCount} samples • {history.data.summary.eventCount} events</div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-gray-900 border border-gray-800 p-3 rounded"><div className="text-sm mb-2">Liberation progress</div><SimpleLine color="#22d3ee" points={(history.data.progress ?? []).slice().reverse().map((s, i, a) => ({ x: a.length < 2 ? 0 : i / (a.length - 1), y: s.liberationPercent }))} /></div>
        <div className="bg-gray-900 border border-gray-800 p-3 rounded"><div className="text-sm mb-2">Progress efficiency</div><SimpleLine color="#f59e0b" points={(history.data.progress ?? []).slice().reverse().map((s, i, a) => ({ x: a.length < 2 ? 0 : i / (a.length - 1), y: s.liberationDeltaPerHour }))} /><div className="text-xs text-gray-400 mt-1">Efficiency data appears after at least two samples for the same campaign type.</div></div>
        <div className="bg-gray-900 border border-gray-800 p-3 rounded"><div className="text-sm mb-2">Player concentration</div><SimpleLine color="#34d399" points={(history.data.progress ?? []).slice().reverse().map((s, i, a) => ({ x: a.length < 2 ? 0 : i / (a.length - 1), y: s.playerShare }))} /></div>
        <div className="bg-gray-900 border border-gray-800 p-3 rounded"><div className="text-sm mb-2">HP remaining</div><SimpleLine color="#a78bfa" points={(history.data.progress ?? []).slice().reverse().map((s, i, a) => ({ x: a.length < 2 ? 0 : i / (a.length - 1), y: s.healthCurrent }))} /></div>
      </div>
      <div className="bg-gray-900 border border-gray-800 p-3 rounded"><div className="font-semibold mb-2">Events during this battle</div>{history.data.events.map((e) => <div key={e.id} className="text-sm text-gray-300">{fmt(e.timestamp)} • {e.eventType} • {e.title}</div>)}</div>
    </div> : <div className="text-gray-400 text-sm">Select a planet to view history.</div>}</section>

    <section><h3 className="font-semibold mb-2">Campaign summaries</h3><div className="space-y-2">{(campaigns.data?.campaigns ?? []).map((c, idx) => <div key={idx} className="bg-gray-900 border border-gray-800 p-2 rounded text-sm">{c.planetName} • {c.campaignType} • {fmt(c.firstSeen)} → {fmt(c.lastSeen)} • latest {c.latestLiberationPercent.toFixed(2)}% • max share {(c.maxPlayerShare*100).toFixed(1)}%</div>)}</div></section>

    <section className="grid md:grid-cols-2 gap-3"><div><h3 className="font-semibold mb-2 text-cyan-300">Major Orders</h3><div className="space-y-2">{(majorOrders.data?.majorOrders ?? []).map((o) => <div key={o.majorOrderId} className="bg-cyan-950/20 border border-cyan-700/40 p-3 rounded text-sm"><div className="font-semibold">{o.title}</div><div>{fmt(o.firstSeen)} → {fmt(o.lastSeen)}</div><div>Expires: {fmt(o.latestExpiresAt)} • hrs left: {o.latestHoursRemaining ?? '—'}</div></div>)}</div></div>
      <div><h3 className="font-semibold mb-2 text-purple-300">Minor Orders</h3>{minorOrders.length ? <div className="space-y-2">{minorOrders.map((o) => <div key={o.id} className="bg-purple-950/20 border border-purple-700/40 p-3 rounded text-sm"><div className="font-semibold">{o.title}</div><div>{fmt(o.timestamp)}</div><div>{o.summary}</div></div>)}</div> : <div className="bg-gray-900 border border-gray-800 p-3 rounded text-sm text-gray-300">Minor Order archive unavailable. The current data source does not expose Minor Order history yet.</div>}</div></section>
  </div>;
}
