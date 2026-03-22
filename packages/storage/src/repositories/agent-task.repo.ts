import type Database from 'better-sqlite3';
import type { AgentTask } from '@ail/common';

export class AgentTaskRepository {
  constructor(private db: Database.Database) {}

  enqueue(task: Omit<AgentTask, 'id' | 'startedAt' | 'completedAt' | 'retryCount' | 'error'>): number {
    const result = this.db.prepare(`
      INSERT INTO agent_tasks (agent_id, automation_id, scheduled_at, status, priority)
      VALUES (?, ?, ?, ?, ?)
    `).run(task.agentId, task.automationId, task.scheduledAt, task.status || 'pending', task.priority || 0);
    return result.lastInsertRowid as number;
  }

  getNext(agentId: number): AgentTask | undefined {
    return this.db.prepare(`
      SELECT id, agent_id as agentId, automation_id as automationId,
             scheduled_at as scheduledAt, started_at as startedAt, completed_at as completedAt,
             status, priority, retry_count as retryCount, error
      FROM agent_tasks
      WHERE agent_id = ? AND status = 'pending'
        AND (scheduled_at IS NULL OR scheduled_at <= ?)
      ORDER BY priority DESC, id ASC LIMIT 1
    `).get(agentId, Date.now()) as AgentTask | undefined;
  }

  updateStatus(id: number, status: string, fields?: { startedAt?: number; completedAt?: number; error?: string; retryCount?: number }): void {
    const sets = ['status = ?'];
    const params: unknown[] = [status];
    if (fields?.startedAt !== undefined) { sets.push('started_at = ?'); params.push(fields.startedAt); }
    if (fields?.completedAt !== undefined) { sets.push('completed_at = ?'); params.push(fields.completedAt); }
    if (fields?.error !== undefined) { sets.push('error = ?'); params.push(fields.error); }
    if (fields?.retryCount !== undefined) { sets.push('retry_count = ?'); params.push(fields.retryCount); }
    params.push(id);
    this.db.prepare(`UPDATE agent_tasks SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  }

  getByAgentId(agentId: number, limit: number = 50): AgentTask[] {
    return this.db.prepare(`
      SELECT id, agent_id as agentId, automation_id as automationId,
             scheduled_at as scheduledAt, started_at as startedAt, completed_at as completedAt,
             status, priority, retry_count as retryCount, error
      FROM agent_tasks WHERE agent_id = ? ORDER BY id DESC LIMIT ?
    `).all(agentId, limit) as AgentTask[];
  }

  getPending(): AgentTask[] {
    return this.db.prepare(`
      SELECT id, agent_id as agentId, automation_id as automationId,
             scheduled_at as scheduledAt, started_at as startedAt, completed_at as completedAt,
             status, priority, retry_count as retryCount, error
      FROM agent_tasks WHERE status = 'pending' ORDER BY priority DESC, id ASC
    `).all() as AgentTask[];
  }
}
