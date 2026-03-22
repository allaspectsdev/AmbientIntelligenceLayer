import type { FastifyInstance } from 'fastify';
import { ApprovalRepository, AuditRepository } from '@ail/storage';

export async function approvalRoutes(app: FastifyInstance) {
  const db = app.db;
  const approvalRepo = new ApprovalRepository(db);
  const auditRepo = new AuditRepository(db);

  app.get('/api/approvals', async () => approvalRepo.getPending());

  app.get('/api/approvals/:id', async (req) => {
    const { id } = req.params as { id: string };
    return approvalRepo.getById(Number(id));
  });

  app.post('/api/approvals/:id/approve', async (req) => {
    const { id } = req.params as { id: string };
    approvalRepo.decide(Number(id), 'approved', 'user');
    auditRepo.log({ actor: 'user', action: 'approval_approved', resourceType: 'approval', resourceId: id, detailsJson: null, riskLevel: 'safe' });
    return { success: true };
  });

  app.post('/api/approvals/:id/deny', async (req) => {
    const { id } = req.params as { id: string };
    approvalRepo.decide(Number(id), 'denied', 'user');
    auditRepo.log({ actor: 'user', action: 'approval_denied', resourceType: 'approval', resourceId: id, detailsJson: null, riskLevel: 'safe' });
    return { success: true };
  });
}
