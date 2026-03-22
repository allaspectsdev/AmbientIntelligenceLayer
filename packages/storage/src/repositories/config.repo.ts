import type Database from 'better-sqlite3';
import type { ExclusionRule } from '@ail/common';

export class ConfigRepository {
  constructor(private db: Database.Database) {}

  get(key: string): string | undefined {
    const row = this.db.prepare('SELECT value FROM config WHERE key = ?').get(key) as
      | { value: string }
      | undefined;
    return row?.value;
  }

  set(key: string, value: string): void {
    this.db.prepare(
      'INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?'
    ).run(key, value, value);
  }

  getAll(): Record<string, string> {
    const rows = this.db.prepare('SELECT key, value FROM config').all() as Array<{
      key: string;
      value: string;
    }>;
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  }

  // Exclusion rules
  getExclusions(): ExclusionRule[] {
    return this.db.prepare(
      'SELECT id, type, pattern FROM exclusions ORDER BY id'
    ).all() as ExclusionRule[];
  }

  addExclusion(rule: Omit<ExclusionRule, 'id'>): number {
    const result = this.db.prepare(
      'INSERT INTO exclusions (type, pattern) VALUES (?, ?)'
    ).run(rule.type, rule.pattern);
    return result.lastInsertRowid as number;
  }

  removeExclusion(id: number): boolean {
    const result = this.db.prepare('DELETE FROM exclusions WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
