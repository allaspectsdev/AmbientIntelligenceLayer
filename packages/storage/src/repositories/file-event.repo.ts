import type Database from 'better-sqlite3';
import type { FileEvent, TimeRange } from '@ail/common';

export class FileEventRepository {
  constructor(private db: Database.Database) {}

  insert(event: Omit<FileEvent, 'id' | 'createdAt'>): number {
    const result = this.db.prepare(`
      INSERT INTO file_events (timestamp, path, event_type, app_name)
      VALUES (?, ?, ?, ?)
    `).run(event.timestamp, event.path, event.eventType, event.appName);
    return result.lastInsertRowid as number;
  }

  getByRange(range: TimeRange, limit: number = 500): FileEvent[] {
    return this.db.prepare(`
      SELECT id, timestamp, path, event_type as eventType,
             app_name as appName, created_at as createdAt
      FROM file_events WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC LIMIT ?
    `).all(range.start, range.end, limit) as FileEvent[];
  }

  getByPath(path: string): FileEvent[] {
    return this.db.prepare(`
      SELECT id, timestamp, path, event_type as eventType,
             app_name as appName, created_at as createdAt
      FROM file_events WHERE path = ? ORDER BY timestamp DESC LIMIT 100
    `).all(path) as FileEvent[];
  }

  getEventsSince(since: number): FileEvent[] {
    return this.db.prepare(`
      SELECT id, timestamp, path, event_type as eventType,
             app_name as appName, created_at as createdAt
      FROM file_events WHERE timestamp >= ? ORDER BY timestamp ASC
    `).all(since) as FileEvent[];
  }
}
