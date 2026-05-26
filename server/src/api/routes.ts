import { Router } from 'express';
import { healthHandler } from './health.js';
import { snapshotHandler } from './snapshot.js';
import { recommendationHandler } from './recommendation.js';
import { archiveRouter } from '../archive/archiveRouter.js';

export function createApiRouter(): Router {
  const router = Router();
  router.get('/health', healthHandler);
  router.get('/snapshot', snapshotHandler);
  router.get('/recommendation', recommendationHandler);
  router.use('/archive', archiveRouter);
  return router;
}
