import Fastify from 'fastify';
import cors from '@fastify/cors';
import { API_PORT, API_HOST, DASHBOARD_ORIGIN } from '@ail/common';
import { getDatabase } from '@ail/storage';
import type Database from 'better-sqlite3';

import { activityRoutes } from './routes/activity.routes.js';
import { screenshotRoutes } from './routes/screenshots.routes.js';
import { patternRoutes } from './routes/patterns.routes.js';
import { suggestionRoutes } from './routes/suggestions.routes.js';
import { configRoutes } from './routes/config.routes.js';
import { analyzeRoutes } from './routes/analyze.routes.js';
import { captureRoutes } from './routes/capture.routes.js';
import { automationRoutes } from './routes/automations.routes.js';
import { agentRoutes } from './routes/agents.routes.js';
import { approvalRoutes } from './routes/approvals.routes.js';
import { auditRoutes } from './routes/audit.routes.js';
import { credentialRoutes } from './routes/credentials.routes.js';
import { setupWebSocket } from './ws.js';

// Extend Fastify with our db instance
declare module 'fastify' {
  interface FastifyInstance {
    db: Database.Database;
  }
}

async function main() {
  const app = Fastify({ logger: true });

  // Register CORS for dashboard
  await app.register(cors, {
    origin: [DASHBOARD_ORIGIN, 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  // Attach database
  const db = getDatabase('./data');
  app.decorate('db', db);

  // WebSocket support
  await setupWebSocket(app);

  // Register routes
  await app.register(activityRoutes);
  await app.register(screenshotRoutes);
  await app.register(patternRoutes);
  await app.register(suggestionRoutes);
  await app.register(configRoutes);
  await app.register(analyzeRoutes);
  await app.register(captureRoutes);
  await app.register(automationRoutes);
  await app.register(agentRoutes);
  await app.register(approvalRoutes);
  await app.register(auditRoutes);
  await app.register(credentialRoutes);

  // Health check
  app.get('/api/health', async () => ({ status: 'ok', timestamp: Date.now() }));

  // Start
  await app.listen({ port: API_PORT, host: API_HOST });
  console.log(`[API] Server running at http://${API_HOST}:${API_PORT}`);
}

main().catch(err => {
  console.error('[API] Fatal error:', err);
  process.exit(1);
});
