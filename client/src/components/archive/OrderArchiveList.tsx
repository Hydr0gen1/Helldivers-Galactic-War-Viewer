import type { ArchiveEvent, MajorOrderArchiveItem } from '../../api/archiveTypes.js';

const fmt = (value: string | null | undefined) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

export function MajorOrderArchiveList({ majorOrders }: { majorOrders: MajorOrderArchiveItem[] }) {
  return (
    <div>
      <h3 className="font-semibold mb-2 text-cyan-300">Major Orders</h3>
      <div className="space-y-2">
        {majorOrders.map((order) => (
          <div key={order.majorOrderId} className="bg-cyan-950/20 border border-cyan-700/40 p-3 rounded text-sm">
            <div className="font-semibold">{order.title}</div>
            <div>{fmt(order.firstSeen)} → {fmt(order.lastSeen)}</div>
            <div>Expires: {fmt(order.latestExpiresAt)} • hrs left: {order.latestHoursRemaining ?? '—'}</div>
          </div>
        ))}
        {!majorOrders.length && <div className="text-sm text-gray-400">No Major Order archive records yet.</div>}
      </div>
    </div>
  );
}

export function MinorOrderArchiveList({ minorOrders }: { minorOrders: ArchiveEvent[] }) {
  return (
    <div>
      <h3 className="font-semibold mb-2 text-purple-300">Minor Orders</h3>
      {minorOrders.length ? (
        <div className="space-y-2">
          {minorOrders.map((order) => (
            <div key={order.id} className="bg-purple-950/20 border border-purple-700/40 p-3 rounded text-sm">
              <div className="font-semibold">{order.title}</div>
              <div>{fmt(order.timestamp)}</div>
              <div>{order.summary}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 p-3 rounded text-sm text-gray-300">
          Minor Order archive unavailable. The current data source does not expose Minor Order history yet.
        </div>
      )}
    </div>
  );
}
