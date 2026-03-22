import type { FastifyInstance } from 'fastify';
import type { SuggestionStatus } from '@ail/common';
import { SuggestionRepository } from '@ail/storage';

export async function suggestionRoutes(app: FastifyInstance) {
  const db = app.db;
  const suggestionRepo = new SuggestionRepository(db);

  app.get('/api/suggestions', async (req) => {
    const query = req.query as Record<string, unknown>;
    const status = query.status as SuggestionStatus | undefined;
    const limit = Number(query.limit) || 50;
    return suggestionRepo.getByStatus(status, limit);
  });

  app.patch<{ Params: { id: string }; Body: { status: SuggestionStatus; userFeedback?: string } }>(
    '/api/suggestions/:id',
    async (req) => {
      const id = Number(req.params.id);
      const { status, userFeedback } = req.body;
      suggestionRepo.updateStatus(id, status, userFeedback);
      return { success: true };
    }
  );
}
