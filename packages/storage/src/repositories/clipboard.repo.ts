import type Database from 'better-sqlite3';
import type { ClipboardEvent, TimeRange } from '@ail/common';

export class ClipboardEventRepository {
  constructor(private db: Database.Database) {}

  insert(event: Omit<ClipboardEvent, 'id' | 'createdAt'>): number {
    const result = this.db.prepare(`
      INSERT INTO clipboard_events (timestamp, content_type, content_hash, source_app, target_app, content_preview)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(event.timestamp, event.contentType, event.contentHash, event.sourceApp, event.targetApp, event.contentPreview);
    return result.lastInsertRowid as number;
  }

  getByRange(range: TimeRange, limit: number = 500): ClipboardEvent[] {
    return this.db.prepare(`
      SELECT id, timestamp, content_type as contentType, content_hash as contentHash,
             source_app as sourceApp, target_app as targetApp, content_preview as contentPreview,
             created_at as createdAt
      FROM clipboard_events WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC LIMIT ?
    `).all(range.start, range.end, limit) as ClipboardEvent[];
  }

  getFrequentPairs(range: TimeRange): Array<{ sourceApp: string; targetApp: string; count: number }> {
    return this.db.prepare(`
      SELECT source_app as sourceApp, target_app as targetApp, COUNT(*) as count
      FROM clipboard_events
      WHERE timestamp >= ? AND timestamp <= ?
        AND source_app IS NOT NULL AND target_app IS NOT NULL
      GROUP BY source_app, target_app
      ORDER BY count DESC LIMIT 20
    `).all(range.start, range.end) as Array<{ sourceApp: string; targetApp: string; count: number }>;
  }

  getEventsSince(since: number): ClipboardEvent[] {
    return this.db.prepare(`
      SELECT id, timestamp, content_type as contentType, content_hash as contentHash,
             source_app as sourceApp, target_app as targetApp, content_preview as contentPreview,
             created_at as createdAt
      FROM clipboard_events WHERE timestamp >= ? ORDER BY timestamp ASC
    `).all(since) as ClipboardEvent[];
  }
}
