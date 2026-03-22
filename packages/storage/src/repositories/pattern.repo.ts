import type Database from 'better-sqlite3';
import type { Pattern, PatternType } from '@ail/common';

const SELECT_COLS = `id, type, description, data_json as dataJson, frequency,
  first_seen as firstSeen, last_seen as lastSeen,
  is_active as isActive, confidence, risk_level as riskLevel, created_at as createdAt`;

function mapRow(r: Pattern & { isActive: number }): Pattern {
  return { ...r, isActive: Boolean(r.isActive), confidence: r.confidence ?? 0.5, riskLevel: r.riskLevel ?? 'safe' };
}

export class PatternRepository {
  constructor(private db: Database.Database) {}

  upsert(pattern: Omit<Pattern, 'id' | 'createdAt'>): number {
    const existing = this.db.prepare(
      'SELECT id, frequency FROM patterns WHERE type = ? AND description = ?'
    ).get(pattern.type, pattern.description) as { id: number; frequency: number } | undefined;

    if (existing) {
      this.db.prepare(`
        UPDATE patterns SET frequency = ?, last_seen = ?, data_json = ?, is_active = 1,
          confidence = ?, risk_level = ?
        WHERE id = ?
      `).run(pattern.frequency, pattern.lastSeen, pattern.dataJson,
        pattern.confidence ?? 0.5, pattern.riskLevel ?? 'safe', existing.id);
      return existing.id;
    }

    const result = this.db.prepare(`
      INSERT INTO patterns (type, description, data_json, frequency, first_seen, last_seen, is_active, confidence, risk_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      pattern.type, pattern.description, pattern.dataJson, pattern.frequency,
      pattern.firstSeen, pattern.lastSeen, pattern.isActive ? 1 : 0,
      pattern.confidence ?? 0.5, pattern.riskLevel ?? 'safe'
    );
    return result.lastInsertRowid as number;
  }

  getActive(type?: PatternType): Pattern[] {
    let sql = `SELECT ${SELECT_COLS} FROM patterns WHERE is_active = 1`;
    const params: unknown[] = [];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    sql += ' ORDER BY confidence DESC, last_seen DESC';
    return (this.db.prepare(sql).all(...params) as Array<Pattern & { isActive: number }>).map(mapRow);
  }

  getAll(): Pattern[] {
    return (this.db.prepare(`SELECT ${SELECT_COLS} FROM patterns ORDER BY last_seen DESC`).all() as Array<Pattern & { isActive: number }>).map(mapRow);
  }

  getById(id: number): Pattern | undefined {
    const r = this.db.prepare(`SELECT ${SELECT_COLS} FROM patterns WHERE id = ?`).get(id) as (Pattern & { isActive: number }) | undefined;
    return r ? mapRow(r) : undefined;
  }

  getPromotionCandidates(minConfidence: number): Pattern[] {
    return (this.db.prepare(`
      SELECT ${SELECT_COLS} FROM patterns
      WHERE is_active = 1 AND confidence >= ?
      ORDER BY confidence DESC
    `).all(minConfidence) as Array<Pattern & { isActive: number }>).map(mapRow);
  }

  updateConfidence(id: number, confidence: number): void {
    this.db.prepare('UPDATE patterns SET confidence = ? WHERE id = ?').run(confidence, id);
  }

  deactivateOlderThan(timestamp: number): void {
    this.db.prepare('UPDATE patterns SET is_active = 0 WHERE last_seen < ?').run(timestamp);
  }

  deactivateBelowConfidence(threshold: number): void {
    this.db.prepare('UPDATE patterns SET is_active = 0 WHERE confidence < ? AND is_active = 1').run(threshold);
  }
}
