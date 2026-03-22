import type { FastifyInstance } from 'fastify';
import { AutomationRepository, AutomationExecutionRepository, AutomationScheduleRepository, PatternRepository } from '@ail/storage';
import type { AutomationType, AutomationStatus, RiskLevel, ExecutionTier } from '@ail/common';

export async function automationRoutes(app: FastifyInstance) {
  const db = app.db;
  const autoRepo = new AutomationRepository(db);
  const execRepo = new AutomationExecutionRepository(db);
  const scheduleRepo = new AutomationScheduleRepository(db);
  const patternRepo = new PatternRepository(db);

  // List automations with tier filtering
  app.get('/api/automations', async (req) => {
    const q = req.query as Record<string, string>;
    return autoRepo.getAll({
      status: q.status as AutomationStatus | undefined,
      type: q.type as AutomationType | undefined,
      riskLevel: q.riskLevel as RiskLevel | undefined,
      tier: q.tier ? Number(q.tier) as ExecutionTier : undefined,
    });
  });

  app.get('/api/automations/:id', async (req) => {
    const { id } = req.params as { id: string };
    const automation = autoRepo.getById(Number(id));
    if (!automation) return { error: 'Not found' };
    const executions = execRepo.getByAutomationId(Number(id));
    const schedule = scheduleRepo.getByAutomationId(Number(id));
    return { ...automation, executions, schedule };
  });

  // Classify a pattern's optimal execution tier (without generating)
  app.post('/api/automations/classify/:patternId', async (req) => {
    const { patternId } = req.params as { patternId: string };
    const pattern = patternRepo.getById(Number(patternId));
    if (!pattern) return { error: 'Pattern not found' };

    const { classifyTier } = await import('@ail/automation');
    return classifyTier(pattern);
  });

  // Generate automation from pattern — now with tier classification + new generators
  app.post('/api/automations/generate/:patternId', async (req) => {
    const { patternId } = req.params as { patternId: string };
    const pattern = patternRepo.getById(Number(patternId));
    if (!pattern) return { error: 'Pattern not found' };

    const {
      AppleScriptGenerator, PlaywrightGenerator, N8nGenerator, ApiStubGenerator,
      ShellScriptGenerator, PythonScriptGenerator, TemplateGenerator, RuleEngineGenerator,
      classifyRisk, classifyTier,
    } = await import('@ail/automation');

    // Classify tier first
    const classification = classifyTier(pattern);

    // All generators — new tier-aware ones first (preferred)
    const generators = [
      new ShellScriptGenerator(),
      new PythonScriptGenerator(),
      new TemplateGenerator(),
      new RuleEngineGenerator(),
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
          executionTier: generated.executionTier ?? classification.tier,
          templateParams: generated.templateParams ? JSON.stringify(generated.templateParams) : null,
          ruleConfig: generated.ruleConfig ? JSON.stringify(generated.ruleConfig) : null,
        };

        const id = autoRepo.insert(automation);
        const saved = autoRepo.getById(id)!;

        const risk = classifyRisk(saved);
        if (risk !== 'safe') autoRepo.update(id, { riskLevel: risk });

        results.push({ ...saved, riskLevel: risk, classification });
      }
    }

    return results;
  });

  // Execute with optional context (for template params)
  app.post('/api/automations/:id/execute', async (req) => {
    const { id } = req.params as { id: string };
    const automation = autoRepo.getById(Number(id));
    if (!automation) return { error: 'Not found' };

    const body = (req.body || {}) as { params?: Record<string, string>; env?: Record<string, string> };
    const { AutomationExecutor } = await import('@ail/automation');
    const executor = new AutomationExecutor(execRepo);
    return executor.execute(automation, body);
  });

  app.post('/api/automations/:id/dry-run', async (req) => {
    const { id } = req.params as { id: string };
    const automation = autoRepo.getById(Number(id));
    if (!automation) return { error: 'Not found' };

    const { AutomationExecutor } = await import('@ail/automation');
    const executor = new AutomationExecutor(execRepo);
    return executor.dryRun(automation);
  });

  // Schedule management
  app.get('/api/automations/:id/schedule', async (req) => {
    const { id } = req.params as { id: string };
    return scheduleRepo.getByAutomationId(Number(id)) || null;
  });

  app.post<{ Params: { id: string }; Body: { cronExpression: string; enabled?: boolean } }>(
    '/api/automations/:id/schedule', async (req) => {
      const automationId = Number(req.params.id);
      const existing = scheduleRepo.getByAutomationId(automationId);

      if (existing) {
        scheduleRepo.update(existing.id!, {
          cronExpression: req.body.cronExpression,
          enabled: req.body.enabled ?? true,
          nextRunAt: Date.now() + 60_000, // Next run in 1 min
        });
        return { id: existing.id, updated: true };
      }

      const id = scheduleRepo.insert({
        automationId,
        cronExpression: req.body.cronExpression,
        enabled: req.body.enabled ?? true,
        lastRunAt: null,
        nextRunAt: Date.now() + 60_000,
      });
      return { id, created: true };
    }
  );

  app.delete('/api/automations/:id/schedule', async (req) => {
    const { id } = req.params as { id: string };
    return { success: scheduleRepo.deleteByAutomationId(Number(id)) };
  });

  // Tier statistics
  app.get('/api/automations/stats/tiers', async () => {
    const counts = autoRepo.getTierCounts();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const deterministicCount = (counts[1] || 0) + (counts[2] || 0) + (counts[3] || 0);
    const agenticCount = counts[4] || 0;

    return {
      counts,
      total,
      deterministicCount,
      agenticCount,
      deterministicPercentage: total > 0 ? Math.round((deterministicCount / total) * 100) : 0,
      estimatedTokenSavings: deterministicCount * 1500, // ~1500 tokens per avoided agentic execution
    };
  });

  app.get('/api/automations/:id/export/:format', async (req) => {
    const { id, format } = req.params as { id: string; format: string };
    const automation = autoRepo.getById(Number(id));
    if (!automation) return { error: 'Not found' };
    const ext = format === 'n8n' ? 'json' : format === 'python' ? 'py' : format === 'shell' ? 'sh' : format === 'applescript' ? 'scpt' : 'ts';
    return { content: automation.scriptContent, filename: `ail-automation-${id}.${ext}` };
  });

  app.get('/api/automations/:id/executions', async (req) => {
    const { id } = req.params as { id: string };
    return execRepo.getByAutomationId(Number(id));
  });

  app.patch('/api/automations/:id', async (req) => {
    const { id } = req.params as { id: string };
    autoRepo.update(Number(id), req.body as Record<string, unknown>);
    return { success: true };
  });

  app.delete('/api/automations/:id', async (req) => {
    const { id } = req.params as { id: string };
    return { success: autoRepo.delete(Number(id)) };
  });
}
