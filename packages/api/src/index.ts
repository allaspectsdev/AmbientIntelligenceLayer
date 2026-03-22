import Fastify from 'fastify';
import cors from '@fastify/cors';
import { API_PORT, API_HOST, DASHBOARD_ORIGIN } from '@ail/common';
import { getDatabase, AutomationRepository, AutomationExecutionRepository, AutomationScheduleRepository } from '@ail/storage';
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
import { visionRoutes } from './routes/vision.routes.js';
import { setupWebSocket } from './ws.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database.Database;
  }
}

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: [DASHBOARD_ORIGIN, 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  const db = getDatabase('./data');
  app.decorate('db', db);

  await setupWebSocket(app);

  // Register all routes
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
  await app.register(visionRoutes);

  app.get('/api/health', async () => ({ status: 'ok', timestamp: Date.now() }));

  // Start automation scheduler for Tier 1 hardcoded scripts
  try {
    const { AutomationScheduler } = await import('@ail/automation');
    const scheduler = new AutomationScheduler(
      new AutomationScheduleRepository(db),
      new AutomationRepository(db),
      new AutomationExecutionRepository(db),
    );
    scheduler.start();
    console.log('[API] Automation scheduler started');

    // Graceful shutdown
    const origClose = app.close.bind(app);
    app.close = async () => {
      scheduler.stop();
      return origClose();
    };
  } catch (err) {
    console.log('[API] Scheduler not started:', (err as Error).message);
  }

  await app.listen({ port: API_PORT, host: API_HOST });
  console.log(`[API] Server running at http://${API_HOST}:${API_PORT}`);
}

main().catch(err => {
  console.error('[API] Fatal error:', err);
  process.exit(1);
});
