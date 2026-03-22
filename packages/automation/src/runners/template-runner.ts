import type { Automation } from '@ail/common';
import type { AutomationRunner, RunResult, ExecutionContext } from './types.js';
import { resolveTemplate } from '../params/resolver.js';
import { ShellRunner } from './shell-runner.js';

const shellRunner = new ShellRunner();

/**
 * Tier 2 runner: resolves {{parameters}} in the script, then delegates to ShellRunner.
 * Zero LLM tokens — all parameter resolution is deterministic code.
 */
export class TemplateRunner implements AutomationRunner {
  canRun(automation: Automation): boolean {
    return automation.type === 'template' || automation.executionTier === 2;
  }

  async run(automation: Automation, context?: ExecutionContext): Promise<RunResult> {
    const resolvedScript = resolveTemplate(automation.scriptContent || '', context);

    // Create a resolved automation and delegate to shell runner
    const resolvedAutomation = { ...automation, type: 'shell' as const, scriptContent: resolvedScript };
    return shellRunner.run(resolvedAutomation, context);
  }

  async dryRun(automation: Automation): Promise<{ preview: string; riskLevel: string }> {
    const resolved = resolveTemplate(automation.scriptContent || '', {});
    return {
      preview: `--- TEMPLATE (Tier 2 Parameterized) ---\n\nOriginal:\n${automation.scriptContent}\n\nResolved:\n${resolved}`,
      riskLevel: automation.riskLevel,
    };
  }
}
