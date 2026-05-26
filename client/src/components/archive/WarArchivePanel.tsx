import { useState } from 'react';
import {
  useArchiveCampaigns,
  useArchiveEvents,
  useArchiveMajorOrders,
  useArchiveMinorOrderEvents,
  useArchivePlanetHistory,
  useArchivePlanets,
  useArchiveSummary,
} from '../../api/archiveHooks.js';
import { EventTimeline } from './EventTimeline.js';
import { MajorOrderArchiveList, MinorOrderArchiveList } from './OrderArchiveList.js';
import { PlanetProgressCharts } from './PlanetProgressCharts.js';

const fmt = (v: string | null) => (v ? new Date(v).toLocaleString() : '—');

export function WarArchivePanel() {
  const summary = useArchiveSummary();
  const events = useArchiveEvents();
  const planets = useArchivePlanets();
  const campaigns = useArchiveCampaigns();
  const majorOrders = useArchiveMajorOrders();
  const minorOrders = useArchiveMinorOrderEvents();
  const [selectedPlanet, setSelectedPlanet] = useState<number | null>(null);
  const history = useArchivePlanetHistory(selectedPlanet);

  if (summary.isLoading) return <div className="text-gray-300 p-6">Loading War Archive…</div>;
  if (summary.error) return <div className="text-red-300 p-6">Failed to load War Archive.</div>;
  if (!summary.data?.enabled || !summary.data?.available) return <div className="text-yellow-200 p-6">War Archive unavailable. Enable WAR_CHRONICLE_ENABLED and let the server collect data.</div>;

  return <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-gray-100">
    <h2 className="text-2xl font-bold">War Archive</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[
      ['Campaign samples', summary.data.totals.campaignSamples], ['Events', summary.data.totals.events], ['Planets tracked', summary.data.totals.planets], ['Major Orders', summary.data.totals.majorOrders], ['Minor Orders', minorOrders.data?.events?.length ?? 0], ['Latest event', fmt(summary.data.latest.eventAt)], ['Latest sample', fmt(summary.data.latest.campaignSampleAt)],
    ].map(([k, v]) => <div key={String(k)} className="bg-gray-900 border border-gray-800 p-3 rounded"><div className="text-xs text-gray-400">{k}</div><div className="font-semibold text-sm">{String(v)}</div></div>)}</div>

    <EventTimeline events={(events.data?.events ?? []).slice(0, 20)} />

    <section><h3 className="font-semibold mb-2">Planet archive list</h3><div className="grid md:grid-cols-2 gap-2">{(planets.data?.planets ?? []).map((p) => <button key={p.planetId} onClick={() => setSelectedPlanet(p.planetId)} className="text-left bg-gray-900 border border-gray-800 p-3 rounded hover:border-cyan-600"><div className="font-semibold">{p.planetName ?? `Planet ${p.planetId}`}</div><div className="text-xs text-gray-400">{fmt(p.latestTimestamp)} • {p.campaignTypes.join(', ')} • {p.sampleCount} samples • {p.eventCount} events</div></button>)}</div></section>

    <section><h3 className="font-semibold mb-2">Selected planet history</h3>{history.data ? <div className="space-y-3"><div className="bg-gray-900 border border-gray-800 p-3 rounded text-sm">{history.data.planetName} • {history.data.summary.sampleCount} samples • {history.data.summary.eventCount} events</div>
      <PlanetProgressCharts samples={(history.data.progress ?? []).slice().reverse()} events={history.data.events ?? []} />
    </div> : <div className="text-gray-400 text-sm">Select a planet to view history.</div>}</section>

    <section><h3 className="font-semibold mb-2">Campaign summaries</h3><div className="space-y-2">{(campaigns.data?.campaigns ?? []).map((c, idx) => <div key={idx} className="bg-gray-900 border border-gray-800 p-2 rounded text-sm">{c.planetName} • {c.campaignType} • {fmt(c.firstSeen)} → {fmt(c.lastSeen)} • latest {c.latestLiberationPercent.toFixed(2)}% • max share {(c.maxPlayerShare*100).toFixed(1)}%</div>)}</div></section>

    <section className="grid md:grid-cols-2 gap-3">
      <MajorOrderArchiveList majorOrders={majorOrders.data?.majorOrders ?? []} />
      <MinorOrderArchiveList minorOrders={minorOrders.data?.events ?? []} />
    </section>
  </div>;
}
