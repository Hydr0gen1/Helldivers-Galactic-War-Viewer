import type { ArchiveEvent } from '../../api/archiveTypes.js';

const fmt = (value: string | null | undefined) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

export function EventTimeline({ events, title = 'Recent event timeline' }: { events: ArchiveEvent[]; title?: string }) {
  if (!events.length) {
    return <div className="text-gray-400 text-sm">No archive events yet.</div>;
  }

  return (
    <section>
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="space-y-2">
        {events.map((event) => (
          <div className="bg-gray-900 border border-gray-800 p-2 rounded text-sm" key={event.id}>
            <div>
              {fmt(event.timestamp)} • {event.eventType} • {event.severity}
              {event.planetName ? ` • ${event.planetName}` : ''}
            </div>
            <div className="font-semibold">{event.title}</div>
            <div className="text-gray-300">{event.summary}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
