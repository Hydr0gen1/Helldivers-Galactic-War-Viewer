import { Router } from 'express';
import { z } from 'zod';
import { archiveService } from './archiveService.js';

const router = Router();
const iso = z.string().datetime({ offset: true });
const clamp = (n: number, max: number) => Math.max(0, Math.min(n, max));

router.get('/summary', (_req, res) => res.json(archiveService.getSummary()));
router.get('/events', (req, res) => {
  const parsed = z.object({ from: iso.optional(), to: iso.optional(), eventType: z.string().optional(), planetId: z.coerce.number().int().optional(), limit: z.coerce.number().int().optional(), offset: z.coerce.number().int().optional() }).safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_query' });
  const limit = clamp(parsed.data.limit ?? 100, 500); const offset = Math.max(0, parsed.data.offset ?? 0);
  const events = archiveService.listEvents({ ...parsed.data, limit, offset });
  return res.json({ events, limit, offset });
});
router.get('/planets', (req, res) => { const parsed = z.object({ limit: z.coerce.number().int().optional(), offset: z.coerce.number().int().optional() }).safeParse(req.query); if (!parsed.success) return res.status(400).json({ error: 'invalid_query' }); const limit = clamp(parsed.data.limit ?? 100, 500); const offset = Math.max(0, parsed.data.offset ?? 0); return res.json({ planets: archiveService.listPlanets({ limit, offset }), limit, offset }); });
router.get('/planets/:planetId', (req, res) => { const parsed = z.object({ planetId: z.coerce.number().int(), from: iso.optional(), to: iso.optional(), limit: z.coerce.number().int().optional() }).safeParse({ ...req.params, ...req.query }); if (!parsed.success) return res.status(400).json({ error: 'invalid_query' }); return res.json(archiveService.getPlanetHistory({ planetId: parsed.data.planetId, from: parsed.data.from, to: parsed.data.to, limit: clamp(parsed.data.limit ?? 200, 1000) })); });
router.get('/campaigns', (req, res) => { const parsed = z.object({ campaignType: z.string().optional(), planetId: z.coerce.number().int().optional(), limit: z.coerce.number().int().optional() }).safeParse(req.query); if (!parsed.success) return res.status(400).json({ error: 'invalid_query' }); return res.json({ campaigns: archiveService.listCampaigns({ campaignType: parsed.data.campaignType, planetId: parsed.data.planetId, limit: clamp(parsed.data.limit ?? 100, 500) }) }); });
router.get('/major-orders', (req, res) => { const parsed = z.object({ limit: z.coerce.number().int().optional() }).safeParse(req.query); if (!parsed.success) return res.status(400).json({ error: 'invalid_query' }); return res.json({ majorOrders: archiveService.listMajorOrders(clamp(parsed.data.limit ?? 100, 500)) }); });

export { router as archiveRouter };
