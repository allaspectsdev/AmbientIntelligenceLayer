import type { FastifyInstance } from 'fastify';
import type { RiskLevel } from '@ail/common';
import { AuditRepository } from '@ail/storage';

export async function auditRoutes(app: FastifyInstance) {
  const db = app.db;
  const auditRepo = new AuditRepository(db);

  app.get('/api/audit', async (req) => {
    const q = req.query as Record<string, string>;
    return auditRepo.query({
      actor: q.actor,
      action: q.action,
      resourceType: q.resourceType,
      riskLevel: q.riskLevel as RiskLevel | undefined,
      limit: Number(q.limit) || 200,
    });
  });
}
