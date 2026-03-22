import type Database from 'better-sqlite3';
import type { AuditEntry, RiskLevel, TimeRange } from '@ail/common';

export class AuditRepository {
  constructor(private db: Database.Database) {}

  log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): number {
    const result = this.db.prepare(`
      INSERT INTO audit_log (timestamp, actor, action, resource_type, resource_id, details_json, risk_level)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      Date.now(), entry.actor, entry.action, entry.resourceType,
      entry.resourceId, entry.detailsJson, entry.riskLevel
    );
    return result.lastInsertRowid as number;
  }

  query(filters: {
    range?: TimeRange;
    actor?: string;
    action?: string;
    resourceType?: string;
    riskLevel?: RiskLevel;
    limit?: number;
  } = {}): AuditEntry[] {
    let sql = `SELECT id, timestamp, actor, action, resource_type as resourceType,
               resource_id as resourceId, details_json as detailsJson, risk_level as riskLevel
               FROM audit_log WHERE 1=1`;
    const params: unknown[] = [];

    if (filters.range) {
      sql += ' AND timestamp >= ? AND timestamp <= ?';
      params.push(filters.range.start, filters.range.end);
    }
    if (filters.actor) { sql += ' AND actor = ?'; params.push(filters.actor); }
    if (filters.action) { sql += ' AND action = ?'; params.push(filters.action); }
    if (filters.resourceType) { sql += ' AND resource_type = ?'; params.push(filters.resourceType); }
    if (filters.riskLevel) { sql += ' AND risk_level = ?'; params.push(filters.riskLevel); }

    sql += ` ORDER BY timestamp DESC LIMIT ?`;
    params.push(filters.limit || 200);

    return this.db.prepare(sql).all(...params) as AuditEntry[];
  }
}
