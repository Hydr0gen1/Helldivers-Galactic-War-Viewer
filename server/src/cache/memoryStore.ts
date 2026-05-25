interface Entry<T> {
  value: T;
  setAt: number;
  freshUntil: number;
  expiresAt: number;
}

export interface CacheResult<T> {
  value: T;
  ageMs: number;
  stale: boolean;
}

class MemoryStore {
  private store = new Map<string, Entry<unknown>>();

  get<T>(key: string): CacheResult<T> | null {
    const entry = this.store.get(key) as Entry<T> | undefined;
    if (!entry) return null;
    const now = Date.now();
    if (now > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return {
      value: entry.value,
      ageMs: now - entry.setAt,
      stale: now > entry.freshUntil,
    };
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    const now = Date.now();
    this.store.set(key, {
      value,
      setAt: now,
      freshUntil: now + ttlMs,
      expiresAt: now + ttlMs,
    });
  }

  setWithGrace<T>(key: string, value: T, freshMs: number, graceMs: number): void {
    const now = Date.now();
    this.store.set(key, {
      value,
      setAt: now,
      freshUntil: now + freshMs,
      expiresAt: now + freshMs + graceMs,
    });
  }
}

export const memoryStore = new MemoryStore();
