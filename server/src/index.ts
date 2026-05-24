import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { logger } from './logger.js';
import { createApiRouter } from './api/routes.js';
import { startPoller } from './poller/index.js';
import { startAnalyzer, analyzeIfNeeded } from './analyzer/index.js';
import type { WarSnapshot } from './domain/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.json());

// API routes
app.use('/api', createApiRouter());

// Serve static client build
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Server listening');
});

startPoller((snapshot: WarSnapshot) => {
  analyzeIfNeeded(snapshot).catch(e => logger.error(e, 'analyzeIfNeeded error'));
});

startAnalyzer();
