import type Database from 'better-sqlite3';
import type { Approval, ApprovalStatus } from '@ail/common';

export class ApprovalRepository {
  constructor(private db: Database.Database) {}

  insert(approval: Omit<Approval, 'id' | 'decidedAt' | 'decidedBy'>): number {
    const result = this.db.prepare(`
      INSERT INTO approvals (agent_task_id, automation_id, action_type, status, requested_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(approval.agentTaskId, approval.automationId, approval.actionType, approval.status || 'pending', approval.requestedAt);
    return result.lastInsertRowid as number;
  }

  getById(id: number): Approval | undefined {
    return this.db.prepare(`
      SELECT id, agent_task_id as agentTaskId, automation_id as automationId,
             action_type as actionType, status, requested_at as requestedAt,
             decided_at as decidedAt, decided_by as decidedBy
      FROM approvals WHERE id = ?
    `).get(id) as Approval | undefined;
  }

  getPending(): Approval[] {
    return this.db.prepare(`
      SELECT id, agent_task_id as agentTaskId, automation_id as automationId,
             action_type as actionType, status, requested_at as requestedAt,
             decided_at as decidedAt, decided_by as decidedBy
      FROM approvals WHERE status = 'pending' ORDER BY requested_at ASC
    `).all() as Approval[];
  }

  decide(id: number, status: ApprovalStatus, decidedBy: string): void {
    this.db.prepare(
      'UPDATE approvals SET status = ?, decided_at = ?, decided_by = ? WHERE id = ?'
    ).run(status, Date.now(), decidedBy, id);
  }

  getByTaskId(taskId: number): Approval | undefined {
    return this.db.prepare(`
      SELECT id, agent_task_id as agentTaskId, automation_id as automationId,
             action_type as actionType, status, requested_at as requestedAt,
             decided_at as decidedAt, decided_by as decidedBy
      FROM approvals WHERE agent_task_id = ? ORDER BY requested_at DESC LIMIT 1
    `).get(taskId) as Approval | undefined;
  }
}
