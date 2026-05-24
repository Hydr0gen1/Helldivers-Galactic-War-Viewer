import type { RequestHandler } from 'express';
import { memoryStore } from '../cache/memoryStore.js';
import { CACHE_KEYS } from '../cache/keys.js';

export const healthHandler: RequestHandler = (_req, res) => {
  const snapshot = memoryStore.get(CACHE_KEYS.SNAPSHOT);
  if (!snapshot) {
    res.status(503).json({ status: 'warming_up', readyEta: 120000 });
    return;
  }
  res.json({ status: 'ok', staleSeconds: (snapshot.value as { staleSeconds: number }).staleSeconds });
};
