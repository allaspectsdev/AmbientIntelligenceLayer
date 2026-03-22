import type Database from 'better-sqlite3';
import type { Automation, AutomationStatus, AutomationType, RiskLevel } from '@ail/common';

export class AutomationRepository {
  constructor(private db: Database.Database) {}

  insert(auto: Omit<Automation, 'id' | 'createdAt' | 'updatedAt'>): number {
    const now = Date.now();
    const result = this.db.prepare(`
      INSERT INTO automations (pattern_id, type, name, description, script_content, status, confidence, risk_level, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(auto.patternId, auto.type, auto.name, auto.description, auto.scriptContent, auto.status, auto.confidence, auto.riskLevel, now, now);
    return result.lastInsertRowid as number;
  }

  getById(id: number): Automation | undefined {
    return this.db.prepare(`
      SELECT id, pattern_id as patternId, type, name, description, script_content as scriptContent,
             status, confidence, risk_level as riskLevel, created_at as createdAt, updated_at as updatedAt
      FROM automations WHERE id = ?
    `).get(id) as Automation | undefined;
  }

  getAll(filters?: { status?: AutomationStatus; type?: AutomationType; riskLevel?: RiskLevel }): Automation[] {
    let sql = `SELECT id, pattern_id as patternId, type, name, description, script_content as scriptContent,
               status, confidence, risk_level as riskLevel, created_at as createdAt, updated_at as updatedAt
               FROM automations WHERE 1=1`;
    const params: unknown[] = [];
    if (filters?.status) { sql += ' AND status = ?'; params.push(filters.status); }
    if (filters?.type) { sql += ' AND type = ?'; params.push(filters.type); }
    if (filters?.riskLevel) { sql += ' AND risk_level = ?'; params.push(filters.riskLevel); }
    sql += ' ORDER BY updated_at DESC';
    return this.db.prepare(sql).all(...params) as Automation[];
  }

  getByPatternId(patternId: number): Automation[] {
    return this.db.prepare(`
      SELECT id, pattern_id as patternId, type, name, description, script_content as scriptContent,
             status, confidence, risk_level as riskLevel, created_at as createdAt, updated_at as updatedAt
      FROM automations WHERE pattern_id = ?
    `).all(patternId) as Automation[];
  }

  update(id: number, fields: Partial<Pick<Automation, 'status' | 'scriptContent' | 'confidence' | 'riskLevel' | 'name' | 'description'>>): void {
    const sets: string[] = [];
    const params: unknown[] = [];
    if (fields.status !== undefined) { sets.push('status = ?'); params.push(fields.status); }
    if (fields.scriptContent !== undefined) { sets.push('script_content = ?'); params.push(fields.scriptContent); }
    if (fields.confidence !== undefined) { sets.push('confidence = ?'); params.push(fields.confidence); }
    if (fields.riskLevel !== undefined) { sets.push('risk_level = ?'); params.push(fields.riskLevel); }
    if (fields.name !== undefined) { sets.push('name = ?'); params.push(fields.name); }
    if (fields.description !== undefined) { sets.push('description = ?'); params.push(fields.description); }
    if (sets.length === 0) return;
    sets.push('updated_at = ?');
    params.push(Date.now());
    params.push(id);
    this.db.prepare(`UPDATE automations SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  }

  delete(id: number): boolean {
    return this.db.prepare('DELETE FROM automations WHERE id = ?').run(id).changes > 0;
  }
}
