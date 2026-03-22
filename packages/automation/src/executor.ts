import type { Automation, AutomationExecution } from '@ail/common';
import type { AutomationExecutionRepository } from '@ail/storage';
import type { AutomationRunner, RunResult, ExecutionContext } from './runners/types.js';
import { ShellRunner } from './runners/shell-runner.js';
import { PythonRunner } from './runners/python-runner.js';
import { TemplateRunner } from './runners/template-runner.js';
import { RuleEngineRunner } from './runners/rule-engine-runner.js';
import { AgenticRunner } from './runners/agentic-runner.js';
import { runAppleScript } from './runners/applescript-runner.js';
import { exportN8nWorkflow } from './runners/n8n-runner.js';

/**
 * Strategy-based automation executor.
 * Selects the cheapest, most reliable runner for each automation's tier.
 * Tier 1-3 = zero tokens. Tier 4 = LLM only as last resort.
 */
export class AutomationExecutor {
  private runners: AutomationRunner[];

  constructor(private execRepo: AutomationExecutionRepository) {
    this.runners = [
      new ShellRunner(),
      new PythonRunner(),
      new TemplateRunner(),
      new RuleEngineRunner(),
      new AgenticRunner(),
      // Legacy runners wrapped as AutomationRunner interface
      new LegacyAppleScriptRunner(),
      new LegacyN8nRunner(),
      new LegacyPlaywrightRunner(),
      new LegacyApiStubRunner(),
    ];
  }

  async execute(automation: Automation, context?: ExecutionContext): Promise<AutomationExecution> {
    const exec: AutomationExecution = {
      automationId: automation.id!,
      startedAt: Date.now(),
      completedAt: null,
      status: 'running',
      output: null,
      error: null,
    };

    const execId = this.execRepo.insert(exec);

    try {
      const runner = this.runners.find(r => r.canRun(automation));
      if (!runner) throw new Error(`No runner for type: ${automation.type} (tier ${automation.executionTier})`);

      const result = await runner.run(automation, context);
      exec.completedAt = Date.now();
      exec.status = result.success ? 'success' : 'failed';
      exec.output = result.output;
      exec.error = result.error;

      // Include tier info in output
      if (result.success) {
        const tierLabel = ['', 'Hardcoded', 'Template', 'Rules', 'Agentic'][automation.executionTier || 1];
        const tokenInfo = result.tokensUsed ? ` (${result.tokensUsed} tokens)` : ' (zero tokens)';
        exec.output = `[Tier ${automation.executionTier}: ${tierLabel}${tokenInfo}] ${exec.output}`;
      }
    } catch (err) {
      exec.completedAt = Date.now();
      exec.status = 'failed';
      exec.error = (err as Error).message;
    }

    this.execRepo.update(execId, {
      completedAt: exec.completedAt,
      status: exec.status,
      output: exec.output,
      error: exec.error,
    });

    return { ...exec, id: execId };
  }

  async dryRun(automation: Automation): Promise<{ preview: string; riskLevel: string }> {
    const runner = this.runners.find(r => r.canRun(automation));
    if (runner) return runner.dryRun(automation);
    return {
      preview: `--- DRY RUN (${automation.type}, Tier ${automation.executionTier}) ---\n\n${automation.scriptContent || '(no script content)'}`,
      riskLevel: automation.riskLevel,
    };
  }
}

// Legacy wrappers for backward compatibility with existing automation types

class LegacyAppleScriptRunner implements AutomationRunner {
  canRun(a: Automation) { return a.type === 'applescript'; }
  async run(a: Automation): Promise<RunResult> {
    const r = runAppleScript(a.scriptContent || '');
    return { ...r, executionTimeMs: 0 };
  }
  async dryRun(a: Automation) {
    return { preview: `--- APPLESCRIPT (Tier 1) ---\n\n${a.scriptContent || ''}`, riskLevel: a.riskLevel };
  }
}

class LegacyN8nRunner implements AutomationRunner {
  canRun(a: Automation) { return a.type === 'n8n'; }
  async run(a: Automation): Promise<RunResult> {
    const r = exportN8nWorkflow(a.scriptContent || '');
    return { ...r, executionTimeMs: 0 };
  }
  async dryRun(a: Automation) {
    return { preview: `--- N8N WORKFLOW (Export) ---\n\n${a.scriptContent || ''}`, riskLevel: a.riskLevel };
  }
}

class LegacyPlaywrightRunner implements AutomationRunner {
  canRun(a: Automation) { return a.type === 'playwright'; }
  async run(): Promise<RunResult> {
    return { success: true, output: 'Playwright script generated. Run with: npx tsx <script.ts>', error: null };
  }
  async dryRun(a: Automation) {
    return { preview: `--- PLAYWRIGHT (Tier 1) ---\n\n${a.scriptContent || ''}`, riskLevel: a.riskLevel };
  }
}

class LegacyApiStubRunner implements AutomationRunner {
  canRun(a: Automation) { return a.type === 'api_stub'; }
  async run(): Promise<RunResult> {
    return { success: true, output: 'API stub generated. Requires manual configuration.', error: null };
  }
  async dryRun(a: Automation) {
    return { preview: `--- API STUB ---\n\n${a.scriptContent || ''}`, riskLevel: a.riskLevel };
  }
}
