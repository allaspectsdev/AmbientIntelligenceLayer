import type { FastifyInstance } from 'fastify';
import { AutomationRepository, AutomationExecutionRepository, PatternRepository } from '@ail/storage';
import type { AutomationType, AutomationStatus, RiskLevel } from '@ail/common';

export async function automationRoutes(app: FastifyInstance) {
  const db = app.db;
  const autoRepo = new AutomationRepository(db);
  const execRepo = new AutomationExecutionRepository(db);
  const patternRepo = new PatternRepository(db);

  app.get('/api/automations', async (req) => {
    const q = req.query as Record<string, string>;
    return autoRepo.getAll({
      status: q.status as AutomationStatus | undefined,
      type: q.type as AutomationType | undefined,
      riskLevel: q.riskLevel as RiskLevel | undefined,
    });
  });

  app.get('/api/automations/:id', async (req) => {
    const { id } = req.params as { id: string };
    const automation = autoRepo.getById(Number(id));
    if (!automation) return { error: 'Not found' };
    const executions = execRepo.getByAutomationId(Number(id));
    return { ...automation, executions };
  });

  app.post('/api/automations/generate/:patternId', async (req) => {
    const { patternId } = req.params as { patternId: string };
    const pattern = patternRepo.getById(Number(patternId));
    if (!pattern) return { error: 'Pattern not found' };

    // Dynamically import generators
    const { AppleScriptGenerator, PlaywrightGenerator, N8nGenerator, ApiStubGenerator, classifyRisk } =
      await import('@ail/automation');

    const generators = [
      new AppleScriptGenerator(),
      new PlaywrightGenerator(),
      new N8nGenerator(),
      new ApiStubGenerator(),
    ];

    const results = [];
    for (const gen of generators) {
      if (gen.canGenerate(pattern)) {
        const generated = gen.generate(pattern);
        const automation = {
          patternId: pattern.id!,
          type: generated.type,
          name: generated.name,
          description: generated.description,
          scriptContent: generated.scriptContent,
          status: 'draft' as const,
          confidence: pattern.confidence ?? 0.5,
          riskLevel: 'safe' as const,
        };

        const id = autoRepo.insert(automation);
        const saved = autoRepo.getById(id)!;

        // Classify risk
        const risk = classifyRisk(saved);
        if (risk !== 'safe') autoRepo.update(id, { riskLevel: risk });

        results.push({ ...saved, riskLevel: risk });
      }
    }

    return results;
  });

  app.post('/api/automations/:id/execute', async (req) => {
    const { id } = req.params as { id: string };
    const automation = autoRepo.getById(Number(id));
    if (!automation) return { error: 'Not found' };

    const { AutomationExecutor } = await import('@ail/automation');
    const executor = new AutomationExecutor(execRepo);
    return executor.execute(automation);
  });

  app.post('/api/automations/:id/dry-run', async (req) => {
    const { id } = req.params as { id: string };
    const automation = autoRepo.getById(Number(id));
    if (!automation) return { error: 'Not found' };

    const { AutomationExecutor } = await import('@ail/automation');
    const executor = new AutomationExecutor(execRepo);
    return executor.dryRun(automation);
  });

  app.get('/api/automations/:id/export/:format', async (req) => {
    const { id, format } = req.params as { id: string; format: string };
    const automation = autoRepo.getById(Number(id));
    if (!automation) return { error: 'Not found' };

    const ext = format === 'n8n' ? 'json' : format === 'applescript' ? 'scpt' : 'ts';
    return {
      content: automation.scriptContent,
      filename: `ail-automation-${id}.${ext}`,
    };
  });

  app.get('/api/automations/:id/executions', async (req) => {
    const { id } = req.params as { id: string };
    return execRepo.getByAutomationId(Number(id));
  });

  app.patch('/api/automations/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;
    autoRepo.update(Number(id), body);
    return { success: true };
  });

  app.delete('/api/automations/:id', async (req) => {
    const { id } = req.params as { id: string };
    return { success: autoRepo.delete(Number(id)) };
  });
}
