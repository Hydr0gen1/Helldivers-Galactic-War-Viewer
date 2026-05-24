import type { RequestHandler } from 'express';
import { memoryStore } from '../cache/memoryStore.js';
import { CACHE_KEYS } from '../cache/keys.js';

const warmingUpSince = Date.now();

export const snapshotHandler: RequestHandler = (_req, res) => {
  const cached = memoryStore.get(CACHE_KEYS.SNAPSHOT);
  if (!cached) {
    const elapsed = Date.now() - warmingUpSince;
    res.status(503).json({ status: 'warming_up', readyEta: Math.max(0, 180000 - elapsed) });
    return;
  }
  res.json(cached.value);
};
