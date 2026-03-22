import type Database from 'better-sqlite3';
import type { MouseEvent, TimeRange } from '@ail/common';

export class MouseEventRepository {
  constructor(private db: Database.Database) {}

  insert(event: Omit<MouseEvent, 'id' | 'createdAt'>): number {
    const result = this.db.prepare(`
      INSERT INTO mouse_events (timestamp, x, y, button, event_type, app_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(event.timestamp, event.x, event.y, event.button, event.eventType, event.appName);
    return result.lastInsertRowid as number;
  }

  insertBatch(events: Omit<MouseEvent, 'id' | 'createdAt'>[]): void {
    const stmt = this.db.prepare(`
      INSERT INTO mouse_events (timestamp, x, y, button, event_type, app_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const tx = this.db.transaction((evts: typeof events) => {
      for (const e of evts) stmt.run(e.timestamp, e.x, e.y, e.button, e.eventType, e.appName);
    });
    tx(events);
  }

  getByRange(range: TimeRange, limit: number = 1000): MouseEvent[] {
    return this.db.prepare(`
      SELECT id, timestamp, x, y, button, event_type as eventType,
             app_name as appName, created_at as createdAt
      FROM mouse_events WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC LIMIT ?
    `).all(range.start, range.end, limit) as MouseEvent[];
  }

  getClickHeatmap(range: TimeRange): Array<{ x: number; y: number; count: number }> {
    return this.db.prepare(`
      SELECT ROUND(x / 50) * 50 as x, ROUND(y / 50) * 50 as y, COUNT(*) as count
      FROM mouse_events
      WHERE timestamp >= ? AND timestamp <= ? AND event_type = 'click'
      GROUP BY ROUND(x / 50), ROUND(y / 50)
      ORDER BY count DESC
    `).all(range.start, range.end) as Array<{ x: number; y: number; count: number }>;
  }
}
