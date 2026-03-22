import type { Approval, ApprovalStatus } from '@ail/common';
import type { ApprovalRepository } from '@ail/storage';
import type { AuditLogger } from './audit-logger.js';

export class ApprovalGate {
  constructor(
    private approvalRepo: ApprovalRepository,
    private auditLogger: AuditLogger,
    private onApprovalRequested?: (approval: Approval) => void,
  ) {}

  requestApproval(
    agentTaskId: number | null,
    automationId: number | null,
    actionType: string
  ): number {
    const id = this.approvalRepo.insert({
      agentTaskId,
      automationId,
      actionType,
      status: 'pending',
      requestedAt: Date.now(),
    });

    const approval = this.approvalRepo.getById(id);
    if (approval && this.onApprovalRequested) {
      this.onApprovalRequested(approval);
    }

    this.auditLogger.log('system', 'approval_requested', 'approval', String(id), { actionType, automationId }, 'moderate');

    return id;
  }

  async waitForApproval(approvalId: number, timeoutMs: number = 300_000): Promise<ApprovalStatus> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const approval = this.approvalRepo.getById(approvalId);
      if (approval && approval.status !== 'pending') {
        return approval.status;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return 'denied'; // Timeout = denied
  }

  approve(approvalId: number, decidedBy: string = 'user'): void {
    this.approvalRepo.decide(approvalId, 'approved', decidedBy);
    this.auditLogger.log(decidedBy, 'approval_approved', 'approval', String(approvalId));
  }

  deny(approvalId: number, decidedBy: string = 'user'): void {
    this.approvalRepo.decide(approvalId, 'denied', decidedBy);
    this.auditLogger.log(decidedBy, 'approval_denied', 'approval', String(approvalId));
  }
}
