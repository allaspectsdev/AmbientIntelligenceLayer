import type { FastifyInstance } from 'fastify';
import { DEFAULT_ANALYSIS_CONFIG } from '@ail/common';
import { ScreenshotRepository, SuggestionRepository, ActivityRepository } from '@ail/storage';
import { broadcast } from '../ws.js';

export async function visionRoutes(app: FastifyInstance) {
  const db = app.db;

  app.post('/api/vision/analyze', async () => {
    const screenshotRepo = new ScreenshotRepository(db);
    const suggestionRepo = new SuggestionRepository(db);
    const activityRepo = new ActivityRepository(db);

    try {
      const { VisionAnalyzer } = await import('../../../analysis/src/vision-analyzer.js' as string);
      const analyzer = new VisionAnalyzer(screenshotRepo, suggestionRepo, activityRepo, DEFAULT_ANALYSIS_CONFIG);
      const suggestions = await analyzer.analyzeBatch();

      for (const s of suggestions) {
        broadcast('coaching_nudge', { title: s.title, body: s.body, category: s.category });
      }

      return { analyzed: suggestions.length };
    } catch (err) {
      return { error: (err as Error).message, analyzed: 0 };
    }
  });
}
