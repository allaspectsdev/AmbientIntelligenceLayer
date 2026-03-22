import type Database from 'better-sqlite3';
import type { AutomationSchedule } from '@ail/common';

export class AutomationScheduleRepository {
  constructor(private db: Database.Database) {}

  insert(schedule: Omit<AutomationSchedule, 'id' | 'createdAt'>): number {
    const result = this.db.prepare(`
      INSERT INTO automation_schedules (automation_id, cron_expression, enabled, last_run_at, next_run_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(schedule.automationId, schedule.cronExpression, schedule.enabled ? 1 : 0, schedule.lastRunAt, schedule.nextRunAt, Date.now());
    return result.lastInsertRowid as number;
  }

  getByAutomationId(automationId: number): AutomationSchedule | undefined {
    const row = this.db.prepare(`
      SELECT id, automation_id as automationId, cron_expression as cronExpression,
             enabled, last_run_at as lastRunAt, next_run_at as nextRunAt, created_at as createdAt
      FROM automation_schedules WHERE automation_id = ?
    `).get(automationId) as (AutomationSchedule & { enabled: number }) | undefined;
    return row ? { ...row, enabled: Boolean(row.enabled) } : undefined;
  }

  getDueSchedules(now: number): AutomationSchedule[] {
    return (this.db.prepare(`
      SELECT id, automation_id as automationId, cron_expression as cronExpression,
             enabled, last_run_at as lastRunAt, next_run_at as nextRunAt, created_at as createdAt
      FROM automation_schedules WHERE enabled = 1 AND (next_run_at IS NULL OR next_run_at <= ?)
    `).all(now) as Array<AutomationSchedule & { enabled: number }>).map(
      r => ({ ...r, enabled: Boolean(r.enabled) })
    );
  }

  getEnabled(): AutomationSchedule[] {
    return (this.db.prepare(`
      SELECT id, automation_id as automationId, cron_expression as cronExpression,
             enabled, last_run_at as lastRunAt, next_run_at as nextRunAt, created_at as createdAt
      FROM automation_schedules WHERE enabled = 1 ORDER BY next_run_at ASC
    `).all() as Array<AutomationSchedule & { enabled: number }>).map(
      r => ({ ...r, enabled: Boolean(r.enabled) })
    );
  }

  update(id: number, fields: Partial<Pick<AutomationSchedule, 'cronExpression' | 'enabled' | 'lastRunAt' | 'nextRunAt'>>): void {
    const sets: string[] = [];
    const params: unknown[] = [];
    if (fields.cronExpression !== undefined) { sets.push('cron_expression = ?'); params.push(fields.cronExpression); }
    if (fields.enabled !== undefined) { sets.push('enabled = ?'); params.push(fields.enabled ? 1 : 0); }
    if (fields.lastRunAt !== undefined) { sets.push('last_run_at = ?'); params.push(fields.lastRunAt); }
    if (fields.nextRunAt !== undefined) { sets.push('next_run_at = ?'); params.push(fields.nextRunAt); }
    if (sets.length === 0) return;
    params.push(id);
    this.db.prepare(`UPDATE automation_schedules SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  }

  delete(id: number): boolean {
    return this.db.prepare('DELETE FROM automation_schedules WHERE id = ?').run(id).changes > 0;
  }

  deleteByAutomationId(automationId: number): boolean {
    return this.db.prepare('DELETE FROM automation_schedules WHERE automation_id = ?').run(automationId).changes > 0;
  }
}
