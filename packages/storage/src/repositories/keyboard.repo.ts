import type Database from 'better-sqlite3';
import type { KeyboardEvent, TimeRange } from '@ail/common';

export class KeyboardEventRepository {
  constructor(private db: Database.Database) {}

  insert(event: Omit<KeyboardEvent, 'id' | 'createdAt'>): number {
    const result = this.db.prepare(`
      INSERT INTO keyboard_events (timestamp, key_code, modifiers, event_type, app_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(event.timestamp, event.keyCode, event.modifiers, event.eventType, event.appName);
    return result.lastInsertRowid as number;
  }

  insertBatch(events: Omit<KeyboardEvent, 'id' | 'createdAt'>[]): void {
    const stmt = this.db.prepare(`
      INSERT INTO keyboard_events (timestamp, key_code, modifiers, event_type, app_name)
      VALUES (?, ?, ?, ?, ?)
    `);
    const tx = this.db.transaction((evts: typeof events) => {
      for (const e of evts) stmt.run(e.timestamp, e.keyCode, e.modifiers, e.eventType, e.appName);
    });
    tx(events);
  }

  getByRange(range: TimeRange, limit: number = 1000): KeyboardEvent[] {
    return this.db.prepare(`
      SELECT id, timestamp, key_code as keyCode, modifiers, event_type as eventType,
             app_name as appName, created_at as createdAt
      FROM keyboard_events WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC LIMIT ?
    `).all(range.start, range.end, limit) as KeyboardEvent[];
  }

  getEventsSince(since: number): KeyboardEvent[] {
    return this.db.prepare(`
      SELECT id, timestamp, key_code as keyCode, modifiers, event_type as eventType,
             app_name as appName, created_at as createdAt
      FROM keyboard_events WHERE timestamp >= ? ORDER BY timestamp ASC
    `).all(since) as KeyboardEvent[];
  }
}
