import type { FastifyInstance } from 'fastify';
import { DEFAULT_ANALYSIS_CONFIG } from '@ail/common';
import { ActivityRepository, PatternRepository, SuggestionRepository } from '@ail/storage';

export async function analyzeRoutes(app: FastifyInstance) {
  app.post('/api/analyze/trigger', async () => {
    const db = app.db;
    const activityRepo = new ActivityRepository(db);
    const patternRepo = new PatternRepository(db);
    const suggestionRepo = new SuggestionRepository(db);

    // Inline pattern detection
    const { PatternDetector } = await import('@ail/analysis/src/pattern-detector.js' as string);
    const detector = new PatternDetector(activityRepo, patternRepo, DEFAULT_ANALYSIS_CONFIG);
    const patterns = await detector.detectAll();

    // Try Claude analysis if available
    let suggestions: unknown[] = [];
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const { ClaudeAnalyzer } = await import('@ail/analysis/src/claude-analyzer.js' as string);
        const analyzer = new ClaudeAnalyzer(
          activityRepo,
          patternRepo,
          suggestionRepo,
          DEFAULT_ANALYSIS_CONFIG
        );
        suggestions = await analyzer.analyze();
      } catch (err) {
        console.error('[API] Claude analysis error:', (err as Error).message);
      }
    }

    return {
      patternsFound: patterns.length,
      suggestionsGenerated: suggestions.length,
    };
  });
}
