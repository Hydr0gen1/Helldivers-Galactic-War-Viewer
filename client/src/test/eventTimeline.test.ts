import { describe, expect, it } from 'vitest';
import type { ArchiveEvent } from '../api/archiveTypes.js';
import { coalesceEvents } from '../components/archive/EventTimeline.js';

function event(id: number, timestamp: string): ArchiveEvent {
  return { id, timestamp, eventType: 'campaign_stalled', severity: 'low', planetId: 1, planetName: 'Veld', title: 'Campaign stalled', summary: 'No movement' };
}

describe('coalesceEvents', () => {
  it('coalesces repeated events inside one hour span', () => {
    const rows = coalesceEvents([
      event(1, '2026-05-26T03:00:00.000Z'),
      event(2, '2026-05-26T02:30:00.000Z'),
      event(3, '2026-05-26T02:10:00.000Z'),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].count).toBe(3);
  });

  it('does not chain-collapse events beyond one hour total span', () => {
    const rows = coalesceEvents([
      event(1, '2026-05-26T04:00:00.000Z'),
      event(2, '2026-05-26T03:15:00.000Z'),
      event(3, '2026-05-26T02:30:00.000Z'),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].count).toBe(2);
    expect(rows[1].count).toBe(1);
  });
});
