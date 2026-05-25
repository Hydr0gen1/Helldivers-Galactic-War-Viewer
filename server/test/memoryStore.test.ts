import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { memoryStore } from '../src/cache/memoryStore.js';

describe('memoryStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports ageMs from original set time when freshMs differs from graceMs', () => {
    memoryStore.setWithGrace('age-test', { ok: true }, 1_000, 120_000);

    vi.advanceTimersByTime(45_000);

    const result = memoryStore.get<{ ok: boolean }>('age-test');
    expect(result).not.toBeNull();
    expect(result!.ageMs).toBe(45_000);
    expect(result!.stale).toBe(true);
  });
});
