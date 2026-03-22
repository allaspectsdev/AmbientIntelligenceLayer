import type Database from 'better-sqlite3';
import type { AutomationExecution } from '@ail/common';

export class AutomationExecutionRepository {
  constructor(private db: Database.Database) {}

  insert(exec: Omit<AutomationExecution, 'id'>): number {
    const result = this.db.prepare(`
      INSERT INTO automation_executions (automation_id, started_at, completed_at, status, output, error)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(exec.automationId, exec.startedAt, exec.completedAt, exec.status, exec.output, exec.error);
    return result.lastInsertRowid as number;
  }

  update(id: number, fields: Partial<Pick<AutomationExecution, 'completedAt' | 'status' | 'output' | 'error'>>): void {
    const sets: string[] = [];
    const params: unknown[] = [];
    if (fields.completedAt !== undefined) { sets.push('completed_at = ?'); params.push(fields.completedAt); }
    if (fields.status !== undefined) { sets.push('status = ?'); params.push(fields.status); }
    if (fields.output !== undefined) { sets.push('output = ?'); params.push(fields.output); }
    if (fields.error !== undefined) { sets.push('error = ?'); params.push(fields.error); }
    if (sets.length === 0) return;
    params.push(id);
    this.db.prepare(`UPDATE automation_executions SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  }

  getByAutomationId(automationId: number, limit: number = 20): AutomationExecution[] {
    return this.db.prepare(`
      SELECT id, automation_id as automationId, started_at as startedAt, completed_at as completedAt,
             status, output, error
      FROM automation_executions WHERE automation_id = ? ORDER BY started_at DESC LIMIT ?
    `).all(automationId, limit) as AutomationExecution[];
  }

  getRecent(limit: number = 50): AutomationExecution[] {
    return this.db.prepare(`
      SELECT id, automation_id as automationId, started_at as startedAt, completed_at as completedAt,
             status, output, error
      FROM automation_executions ORDER BY started_at DESC LIMIT ?
    `).all(limit) as AutomationExecution[];
  }
}
