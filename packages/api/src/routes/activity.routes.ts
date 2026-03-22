import type { FastifyInstance } from 'fastify';
import type { TimeRange } from '@ail/common';
import { ActivityRepository, PatternRepository, SuggestionRepository } from '@ail/storage';

function parseRange(query: Record<string, unknown>): TimeRange {
  const now = Date.now();
  return {
    start: Number(query.start) || now - 24 * 60 * 60_000, // default: last 24h
    end: Number(query.end) || now,
  };
}

export async function activityRoutes(app: FastifyInstance) {
  const db = app.db;
  const activityRepo = new ActivityRepository(db);
  const patternRepo = new PatternRepository(db);
  const suggestionRepo = new SuggestionRepository(db);

  app.get('/api/activity', async (req) => {
    const query = req.query as Record<string, unknown>;
    const range = parseRange(query);
    const limit = Number(query.limit) || 1000;
    return activityRepo.getByRange(range, limit);
  });

  app.get('/api/activity/summary', async (req) => {
    const range = parseRange(req.query as Record<string, unknown>);
    const topApps = activityRepo.getAppUsage(range);
    const totalTrackedMs = activityRepo.getTotalTrackedMs(range);
    const activePatterns = patternRepo.getActive();
    const newSuggestions = suggestionRepo.getByStatus('new');

    return {
      range,
      topApps,
      totalTrackedMs,
      activePatterns,
      newSuggestions,
    };
  });

  app.get('/api/activity/apps', async (req) => {
    const range = parseRange(req.query as Record<string, unknown>);
    return activityRepo.getAppUsage(range);
  });

  app.get('/api/activity/timeline', async (req) => {
    const query = req.query as Record<string, unknown>;
    const range = parseRange(query);
    const resolution = Number(query.resolution) || 60_000; // default: 1 min buckets
    return activityRepo.getTimeline(range, resolution);
  });
}
