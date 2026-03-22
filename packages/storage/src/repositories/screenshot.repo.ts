import type Database from 'better-sqlite3';
import type { Screenshot, TimeRange } from '@ail/common';

export class ScreenshotRepository {
  constructor(private db: Database.Database) {}

  insert(screenshot: Omit<Screenshot, 'id' | 'createdAt'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO screenshots (timestamp, file_path, app_name, window_title, file_size_bytes)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      screenshot.timestamp,
      screenshot.filePath,
      screenshot.appName,
      screenshot.windowTitle,
      screenshot.fileSizeBytes
    );
    return result.lastInsertRowid as number;
  }

  getByRange(range: TimeRange, limit: number = 100): Screenshot[] {
    return this.db.prepare(`
      SELECT id, timestamp, file_path as filePath, app_name as appName,
             window_title as windowTitle, file_size_bytes as fileSizeBytes,
             created_at as createdAt
      FROM screenshots
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(range.start, range.end, limit) as Screenshot[];
  }

  getById(id: number): Screenshot | undefined {
    return this.db.prepare(`
      SELECT id, timestamp, file_path as filePath, app_name as appName,
             window_title as windowTitle, file_size_bytes as fileSizeBytes,
             created_at as createdAt
      FROM screenshots WHERE id = ?
    `).get(id) as Screenshot | undefined;
  }

  deleteOlderThan(timestamp: number): number {
    const result = this.db.prepare(
      'DELETE FROM screenshots WHERE timestamp < ?'
    ).run(timestamp);
    return result.changes;
  }
}
