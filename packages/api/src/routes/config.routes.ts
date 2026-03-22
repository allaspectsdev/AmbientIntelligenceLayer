import type { FastifyInstance } from 'fastify';
import { ConfigRepository } from '@ail/storage';

export async function configRoutes(app: FastifyInstance) {
  const db = app.db;
  const configRepo = new ConfigRepository(db);

  app.get('/api/config', async () => {
    return configRepo.getAll();
  });

  app.patch<{ Body: Record<string, string> }>('/api/config', async (req) => {
    for (const [key, value] of Object.entries(req.body)) {
      configRepo.set(key, value);
    }
    return { success: true };
  });

  app.get('/api/config/exclusions', async () => {
    return configRepo.getExclusions();
  });

  app.post<{ Body: { type: string; pattern: string } }>(
    '/api/config/exclusions',
    async (req) => {
      const { type, pattern } = req.body;
      const id = configRepo.addExclusion({
        type: type as 'app' | 'title_regex' | 'url_regex',
        pattern,
      });
      return { id };
    }
  );

  app.delete('/api/config/exclusions/:id', async (req) => {
    const { id } = req.params as { id: string };
    const deleted = configRepo.removeExclusion(Number(id));
    return { success: deleted };
  });
}
