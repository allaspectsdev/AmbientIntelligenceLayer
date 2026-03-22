import type Database from 'better-sqlite3';
import type { Suggestion, SuggestionStatus } from '@ail/common';

export class SuggestionRepository {
  constructor(private db: Database.Database) {}

  insert(suggestion: Omit<Suggestion, 'id' | 'createdAt'>): number {
    const result = this.db.prepare(`
      INSERT INTO suggestions (pattern_id, source, category, title, body, priority, status, user_feedback)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      suggestion.patternId,
      suggestion.source,
      suggestion.category,
      suggestion.title,
      suggestion.body,
      suggestion.priority,
      suggestion.status,
      suggestion.userFeedback
    );
    return result.lastInsertRowid as number;
  }

  getByStatus(status?: SuggestionStatus, limit: number = 50): Suggestion[] {
    let sql = `
      SELECT id, pattern_id as patternId, source, category, title, body,
             priority, status, user_feedback as userFeedback, created_at as createdAt
      FROM suggestions
    `;
    const params: unknown[] = [];
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY priority DESC, created_at DESC LIMIT ?';
    params.push(limit);

    return this.db.prepare(sql).all(...params) as Suggestion[];
  }

  updateStatus(id: number, status: SuggestionStatus, feedback?: string): void {
    if (feedback !== undefined) {
      this.db.prepare('UPDATE suggestions SET status = ?, user_feedback = ? WHERE id = ?')
        .run(status, feedback, id);
    } else {
      this.db.prepare('UPDATE suggestions SET status = ? WHERE id = ?')
        .run(status, id);
    }
  }

  getNewCount(): number {
    const row = this.db.prepare(
      "SELECT COUNT(*) as count FROM suggestions WHERE status = 'new'"
    ).get() as { count: number };
    return row.count;
  }
}
