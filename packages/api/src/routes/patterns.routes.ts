import type { FastifyInstance } from 'fastify';
import type { PatternType } from '@ail/common';
import { PatternRepository } from '@ail/storage';

export async function patternRoutes(app: FastifyInstance) {
  const db = app.db;
  const patternRepo = new PatternRepository(db);

  app.get('/api/patterns', async (req) => {
    const query = req.query as Record<string, unknown>;
    const type = query.type as PatternType | undefined;
    if (query.active === 'false') {
      return patternRepo.getAll();
    }
    return patternRepo.getActive(type);
  });
}
