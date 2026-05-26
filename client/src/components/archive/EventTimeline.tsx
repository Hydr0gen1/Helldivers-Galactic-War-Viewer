import type { ArchiveEvent } from '../../api/archiveTypes.js';

const fmt = (value: string | null | undefined) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

const COALESCE_TYPES = new Set(['campaign_stalled', 'player_surge']);
const WINDOW_MS = 60 * 60 * 1000;

type TimelineRow = { event: ArchiveEvent; count: number; firstTs: string | null; lastTs: string | null };

function coalesceEvents(events: ArchiveEvent[]): TimelineRow[] {
  const rows: TimelineRow[] = [];
  const sorted = events.slice().sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  for (const event of sorted) {
    const last = rows.at(-1);
    const can = last && COALESCE_TYPES.has(event.eventType) && last.event.eventType === event.eventType && last.event.planetId === event.planetId && last.event.title === event.title && last.event.summary === event.summary;
    if (can) {
      const t1 = Date.parse(last.lastTs ?? '');
      const t2 = Date.parse(event.timestamp);
      if (Number.isFinite(t1) && Number.isFinite(t2) && Math.abs(t1 - t2) <= WINDOW_MS) {
        last.count += 1;
        last.lastTs = event.timestamp;
        continue;
      }
    }
    rows.push({ event, count: 1, firstTs: event.timestamp, lastTs: event.timestamp });
  }
  return rows;
}

export function EventTimeline({ events, title = 'Recent event timeline' }: { events: ArchiveEvent[]; title?: string }) {
  if (!events.length) return <div className="text-gray-400 text-sm">No archive events yet.</div>;
  const rows = coalesceEvents(events);
  return <section><h3 className="font-semibold mb-2">{title}</h3><div className="space-y-2">{rows.map((row) => <div className="bg-gray-900 border border-gray-800 p-2 rounded text-sm" key={`${row.event.id}:${row.count}`}><div>{fmt(row.firstTs)} • {row.event.eventType} • {row.event.severity}{row.event.planetName ? ` • ${row.event.planetName}` : ''}{row.count > 1 ? ` • ×${row.count}` : ''}</div><div className="font-semibold">{row.event.title}{row.count > 1 ? ` × ${row.count}` : ''}</div><div className="text-gray-300">{row.event.summary}</div>{row.count > 1 ? <div className="text-xs text-gray-400">{fmt(row.lastTs)} → {fmt(row.firstTs)}</div> : null}</div>)}</div></section>;
}
