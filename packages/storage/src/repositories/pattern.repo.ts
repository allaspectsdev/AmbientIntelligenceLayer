import type Database from 'better-sqlite3';
import type { Pattern, PatternType } from '@ail/common';

export class PatternRepository {
  constructor(private db: Database.Database) {}

  upsert(pattern: Omit<Pattern, 'id' | 'createdAt'>): number {
    // Try to find existing pattern with same type and description
    const existing = this.db.prepare(
      'SELECT id, frequency FROM patterns WHERE type = ? AND description = ?'
    ).get(pattern.type, pattern.description) as { id: number; frequency: number } | undefined;

    if (existing) {
      this.db.prepare(`
        UPDATE patterns SET frequency = ?, last_seen = ?, data_json = ?, is_active = 1
        WHERE id = ?
      `).run(pattern.frequency, pattern.lastSeen, pattern.dataJson, existing.id);
      return existing.id;
    }

    const result = this.db.prepare(`
      INSERT INTO patterns (type, description, data_json, frequency, first_seen, last_seen, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      pattern.type,
      pattern.description,
      pattern.dataJson,
      pattern.frequency,
      pattern.firstSeen,
      pattern.lastSeen,
      pattern.isActive ? 1 : 0
    );
    return result.lastInsertRowid as number;
  }

  getActive(type?: PatternType): Pattern[] {
    let sql = `
      SELECT id, type, description, data_json as dataJson, frequency,
             first_seen as firstSeen, last_seen as lastSeen,
             is_active as isActive, created_at as createdAt
      FROM patterns WHERE is_active = 1
    `;
    const params: unknown[] = [];
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    sql += ' ORDER BY last_seen DESC';

    return (this.db.prepare(sql).all(...params) as Array<Pattern & { isActive: number }>).map(
      r => ({ ...r, isActive: Boolean(r.isActive) })
    );
  }

  getAll(): Pattern[] {
    return (this.db.prepare(`
      SELECT id, type, description, data_json as dataJson, frequency,
             first_seen as firstSeen, last_seen as lastSeen,
             is_active as isActive, created_at as createdAt
      FROM patterns ORDER BY last_seen DESC
    `).all() as Array<Pattern & { isActive: number }>).map(
      r => ({ ...r, isActive: Boolean(r.isActive) })
    );
  }

  deactivateOlderThan(timestamp: number): void {
    this.db.prepare('UPDATE patterns SET is_active = 0 WHERE last_seen < ?').run(timestamp);
  }
}
