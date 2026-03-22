import type { FastifyInstance } from 'fastify';
import { AgentRepository, AgentTaskRepository, AutomationRepository, AutomationExecutionRepository, ApprovalRepository, AuditRepository } from '@ail/storage';

export async function agentRoutes(app: FastifyInstance) {
  const db = app.db;
  const agentRepo = new AgentRepository(db);
  const taskRepo = new AgentTaskRepository(db);
  const autoRepo = new AutomationRepository(db);
  const execRepo = new AutomationExecutionRepository(db);
  const approvalRepo = new ApprovalRepository(db);
  const auditRepo = new AuditRepository(db);

  // Lazy-init agent manager
  let manager: Awaited<ReturnType<typeof getManager>> | null = null;
  async function getManager() {
    if (manager) return manager;
    const { AgentManager, AuditLogger, ApprovalGate } = await import('@ail/orchestration');
    const logger = new AuditLogger(auditRepo);
    const gate = new ApprovalGate(approvalRepo, logger);
    manager = new AgentManager(agentRepo, taskRepo, autoRepo, execRepo, logger, gate);
    return manager;
  }

  app.get('/api/agents', async () => agentRepo.getAll());

  app.post<{ Body: { name: string; type: string } }>('/api/agents', async (req) => {
    const mgr = await getManager();
    const id = mgr.create(req.body.name, req.body.type);
    return { id };
  });

  app.get('/api/agents/:id', async (req) => {
    const { id } = req.params as { id: string };
    const agent = agentRepo.getById(Number(id));
    const tasks = taskRepo.getByAgentId(Number(id));
    return { ...agent, tasks };
  });

  app.post('/api/agents/:id/start', async (req) => {
    const { id } = req.params as { id: string };
    const mgr = await getManager();
    return { success: mgr.start(Number(id)) };
  });

  app.post('/api/agents/:id/stop', async (req) => {
    const { id } = req.params as { id: string };
    const mgr = await getManager();
    mgr.stop(Number(id));
    return { success: true };
  });

  app.delete('/api/agents/:id', async (req) => {
    const { id } = req.params as { id: string };
    const mgr = await getManager();
    return { success: mgr.delete(Number(id)) };
  });

  app.get('/api/agents/:id/tasks', async (req) => {
    const { id } = req.params as { id: string };
    return taskRepo.getByAgentId(Number(id));
  });

  app.post<{ Params: { id: string }; Body: { automationId: number; priority?: number } }>(
    '/api/agents/:id/tasks',
    async (req) => {
      const agentId = Number(req.params.id);
      const id = taskRepo.enqueue({
        agentId,
        automationId: req.body.automationId,
        scheduledAt: null,
        status: 'pending',
        priority: req.body.priority || 0,
      });
      return { id };
    }
  );
}
