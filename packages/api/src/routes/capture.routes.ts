import type { FastifyInstance } from 'fastify';
import { KeyboardEventRepository, MouseEventRepository, ClipboardEventRepository, FileEventRepository } from '@ail/storage';

function parseRange(query: Record<string, unknown>) {
  const now = Date.now();
  return {
    start: Number(query.start) || now - 24 * 60 * 60_000,
    end: Number(query.end) || now,
  };
}

export async function captureRoutes(app: FastifyInstance) {
  const db = app.db;

  const keyboardRepo = new KeyboardEventRepository(db);
  const mouseRepo = new MouseEventRepository(db);
  const clipboardRepo = new ClipboardEventRepository(db);
  const fileRepo = new FileEventRepository(db);

  app.get('/api/keyboard-events', async (req) => {
    const query = req.query as Record<string, unknown>;
    return keyboardRepo.getByRange(parseRange(query), Number(query.limit) || 1000);
  });

  app.get('/api/mouse-events', async (req) => {
    const query = req.query as Record<string, unknown>;
    return mouseRepo.getByRange(parseRange(query), Number(query.limit) || 1000);
  });

  app.get('/api/mouse-events/heatmap', async (req) => {
    const query = req.query as Record<string, unknown>;
    return mouseRepo.getClickHeatmap(parseRange(query));
  });

  app.get('/api/clipboard-events', async (req) => {
    const query = req.query as Record<string, unknown>;
    return clipboardRepo.getByRange(parseRange(query), Number(query.limit) || 500);
  });

  app.get('/api/clipboard-events/pairs', async (req) => {
    const query = req.query as Record<string, unknown>;
    return clipboardRepo.getFrequentPairs(parseRange(query));
  });

  app.get('/api/file-events', async (req) => {
    const query = req.query as Record<string, unknown>;
    return fileRepo.getByRange(parseRange(query), Number(query.limit) || 500);
  });
}
