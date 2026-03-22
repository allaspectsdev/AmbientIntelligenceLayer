import type { FastifyInstance } from 'fastify';
import { CredentialRepository } from '@ail/storage';

export async function credentialRoutes(app: FastifyInstance) {
  const db = app.db;
  const credRepo = new CredentialRepository(db);

  // List credentials (never returns encrypted values)
  app.get('/api/credentials', async () => credRepo.getAll());

  // Store a credential (encrypted)
  app.post<{ Body: { name: string; service: string; value: string; scope?: string } }>(
    '/api/credentials',
    async (req) => {
      const { encrypt } = await import('@ail/orchestration');
      const encrypted = encrypt(req.body.value);
      const id = credRepo.insert(req.body.name, req.body.service, encrypted, req.body.scope || null);
      return { id };
    }
  );

  // Delete a credential
  app.delete('/api/credentials/:id', async (req) => {
    const { id } = req.params as { id: string };
    return { success: credRepo.delete(Number(id)) };
  });
}
