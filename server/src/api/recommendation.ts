import type { RequestHandler } from 'express';
import { memoryStore } from '../cache/memoryStore.js';
import { CACHE_KEYS } from '../cache/keys.js';

export const recommendationHandler: RequestHandler = (_req, res) => {
  const cached = memoryStore.get(CACHE_KEYS.RECOMMENDATION);
  if (!cached) {
    res.status(503).json({ status: 'warming_up', message: 'Recommendation not yet available' });
    return;
  }
  res.json(cached.value);
};
