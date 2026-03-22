import type { FastifyInstance } from 'fastify';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { ScreenshotRepository } from '@ail/storage';
import { DEFAULT_CAPTURE_CONFIG } from '@ail/common';

export async function screenshotRoutes(app: FastifyInstance) {
  const db = app.db;
  const screenshotRepo = new ScreenshotRepository(db);

  app.get('/api/screenshots', async (req) => {
    const query = req.query as Record<string, unknown>;
    const now = Date.now();
    const range = {
      start: Number(query.start) || now - 24 * 60 * 60_000,
      end: Number(query.end) || now,
    };
    const limit = Number(query.limit) || 100;
    return screenshotRepo.getByRange(range, limit);
  });

  app.get('/api/screenshots/:id/image', async (req, reply) => {
    const { id } = req.params as { id: string };
    const screenshot = screenshotRepo.getById(Number(id));

    if (!screenshot) {
      return reply.status(404).send({ error: 'Screenshot not found' });
    }

    const dataDir = DEFAULT_CAPTURE_CONFIG.dataDir;
    const fullPath = join(dataDir, screenshot.filePath);

    if (!existsSync(fullPath)) {
      return reply.status(404).send({ error: 'Screenshot file not found' });
    }

    const ext = screenshot.filePath.split('.').pop();
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const buffer = readFileSync(fullPath);
    return reply.type(contentType).send(buffer);
  });
}
