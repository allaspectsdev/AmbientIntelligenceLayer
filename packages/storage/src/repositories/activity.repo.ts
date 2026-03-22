import type Database from 'better-sqlite3';
import type { ActivityEvent, AppUsageSummary, TimeRange, TimelineBucket } from '@ail/common';

export class ActivityRepository {
  constructor(private db: Database.Database) {}

  insert(event: Omit<ActivityEvent, 'id' | 'createdAt'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO activity_events (timestamp, app_name, window_title, url, bundle_id, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      event.timestamp,
      event.appName,
      event.windowTitle,
      event.url,
      event.bundleId,
      event.durationMs
    );
    return result.lastInsertRowid as number;
  }

  updateDuration(id: number, durationMs: number): void {
    this.db.prepare('UPDATE activity_events SET duration_ms = ? WHERE id = ?').run(durationMs, id);
  }

  getByRange(range: TimeRange, limit: number = 1000): ActivityEvent[] {
    return this.db.prepare(`
      SELECT id, timestamp, app_name as appName, window_title as windowTitle,
             url, bundle_id as bundleId, duration_ms as durationMs, created_at as createdAt
      FROM activity_events
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(range.start, range.end, limit) as ActivityEvent[];
  }

  getAppUsage(range: TimeRange): AppUsageSummary[] {
    const rows = this.db.prepare(`
      SELECT app_name as appName,
             COALESCE(SUM(duration_ms), 0) as totalDurationMs,
             COUNT(*) as eventCount
      FROM activity_events
      WHERE timestamp >= ? AND timestamp <= ? AND duration_ms IS NOT NULL
      GROUP BY app_name
      ORDER BY totalDurationMs DESC
    `).all(range.start, range.end) as Array<{
      appName: string;
      totalDurationMs: number;
      eventCount: number;
    }>;

    const total = rows.reduce((sum, r) => sum + r.totalDurationMs, 0);

    return rows.map(r => ({
      ...r,
      percentage: total > 0 ? Math.round((r.totalDurationMs / total) * 10000) / 100 : 0,
    }));
  }

  getTimeline(range: TimeRange, resolutionMs: number = 60_000): TimelineBucket[] {
    return this.db.prepare(`
      SELECT (timestamp / ? * ?) as timestamp,
             app_name as appName,
             COALESCE(SUM(duration_ms), 0) as durationMs
      FROM activity_events
      WHERE timestamp >= ? AND timestamp <= ? AND duration_ms IS NOT NULL
      GROUP BY timestamp / ?, app_name
      ORDER BY timestamp
    `).all(resolutionMs, resolutionMs, range.start, range.end, resolutionMs) as TimelineBucket[];
  }

  getRecentEvents(count: number): ActivityEvent[] {
    return this.db.prepare(`
      SELECT id, timestamp, app_name as appName, window_title as windowTitle,
             url, bundle_id as bundleId, duration_ms as durationMs, created_at as createdAt
      FROM activity_events
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(count) as ActivityEvent[];
  }

  getTotalTrackedMs(range: TimeRange): number {
    const row = this.db.prepare(`
      SELECT COALESCE(SUM(duration_ms), 0) as total
      FROM activity_events
      WHERE timestamp >= ? AND timestamp <= ? AND duration_ms IS NOT NULL
    `).get(range.start, range.end) as { total: number };
    return row.total;
  }

  getEventsSince(since: number): ActivityEvent[] {
    return this.db.prepare(`
      SELECT id, timestamp, app_name as appName, window_title as windowTitle,
             url, bundle_id as bundleId, duration_ms as durationMs, created_at as createdAt
      FROM activity_events
      WHERE timestamp >= ?
      ORDER BY timestamp ASC
    `).all(since) as ActivityEvent[];
  }
}
