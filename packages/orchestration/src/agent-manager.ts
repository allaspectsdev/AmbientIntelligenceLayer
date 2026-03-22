import type { Agent, AgentStatus } from '@ail/common';
import type { AgentRepository, AgentTaskRepository, AutomationRepository, AutomationExecutionRepository } from '@ail/storage';
import type { AuditLogger } from './audit-logger.js';
import type { ApprovalGate } from './approval-gate.js';

export class AgentManager {
  private runningAgents = new Map<number, { stop: () => void }>();

  constructor(
    private agentRepo: AgentRepository,
    private taskRepo: AgentTaskRepository,
    private autoRepo: AutomationRepository,
    private execRepo: AutomationExecutionRepository,
    private auditLogger: AuditLogger,
    private approvalGate: ApprovalGate,
  ) {}

  create(name: string, type: string): number {
    const id = this.agentRepo.insert({ name, type, configJson: null, status: 'idle' });
    this.auditLogger.log('user', 'agent_created', 'agent', String(id), { name, type });
    return id;
  }

  start(agentId: number): boolean {
    const agent = this.agentRepo.getById(agentId);
    if (!agent) return false;

    this.agentRepo.updateStatus(agentId, 'running');
    this.auditLogger.log('user', 'agent_started', 'agent', String(agentId));

    // Start agent loop
    let running = true;
    const loop = async () => {
      while (running) {
        try {
          const task = this.taskRepo.getNext(agentId);
          if (task) {
            this.taskRepo.updateStatus(task.id!, 'running', { startedAt: Date.now() });

            // Get automation
            const automation = task.automationId ? this.autoRepo.getById(task.automationId) : null;

            // Check if approval needed (moderate or risky)
            if (automation && automation.riskLevel !== 'safe') {
              const approvalId = this.approvalGate.requestApproval(task.id!, automation.id!, 'execute');
              const decision = await this.approvalGate.waitForApproval(approvalId, 60_000);
              if (decision !== 'approved') {
                this.taskRepo.updateStatus(task.id!, 'failed', {
                  completedAt: Date.now(),
                  error: `Approval ${decision}`,
                });
                continue;
              }
            }

            // Execute
            if (automation) {
              const { AutomationExecutor } = await import('@ail/automation');
              const executor = new AutomationExecutor(this.execRepo);
              const result = await executor.execute(automation);

              this.taskRepo.updateStatus(task.id!, result.status === 'success' ? 'completed' : 'failed', {
                completedAt: Date.now(),
                error: result.error,
              });

              this.auditLogger.log('agent', 'task_executed', 'agent_task', String(task.id),
                { automationId: automation.id, status: result.status },
                automation.riskLevel as 'safe' | 'moderate' | 'risky');
            }
          }
        } catch (err) {
          console.error(`[Agent ${agentId}] Loop error:`, (err as Error).message);
        }

        // Poll every 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    };

    loop();
    this.runningAgents.set(agentId, { stop: () => { running = false; } });
    return true;
  }

  stop(agentId: number): void {
    const handle = this.runningAgents.get(agentId);
    if (handle) {
      handle.stop();
      this.runningAgents.delete(agentId);
    }
    this.agentRepo.updateStatus(agentId, 'stopped');
    this.auditLogger.log('user', 'agent_stopped', 'agent', String(agentId));
  }

  delete(agentId: number): boolean {
    this.stop(agentId);
    this.auditLogger.log('user', 'agent_deleted', 'agent', String(agentId));
    return this.agentRepo.delete(agentId);
  }

  getAll(): Agent[] {
    return this.agentRepo.getAll();
  }
}
