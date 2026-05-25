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

app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'not_found' });
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Server listening');
});

startPoller((snapshot: WarSnapshot) => {
  analyzeIfNeeded(snapshot).catch(e => logger.error(e, 'analyzeIfNeeded error'));
});

startAnalyzer();

let shuttingDown = false;
const shutdown = (signal: 'SIGTERM' | 'SIGINT') => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Shutdown signal received, closing HTTP server');
  const forceExitTimer = setTimeout(() => {
    logger.warn('Forced process exit after shutdown timeout');
    process.exit(1);
  }, 10_000);

  server.close((err) => {
    clearTimeout(forceExitTimer);
    if (err) {
      logger.error(err, 'HTTP server close failed');
      process.exit(1);
      return;
    }
    logger.info('HTTP server closed cleanly');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
