import type { Automation, AutomationExecution } from '@ail/common';
import type { AutomationExecutionRepository } from '@ail/storage';
import { runAppleScript } from './runners/applescript-runner.js';
import { exportN8nWorkflow } from './runners/n8n-runner.js';

export class AutomationExecutor {
  constructor(private execRepo: AutomationExecutionRepository) {}

  async execute(automation: Automation): Promise<AutomationExecution> {
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
      const result = await this.dispatch(automation);

      exec.completedAt = Date.now();
      exec.status = result.success ? 'success' : 'failed';
      exec.output = result.output;
      exec.error = result.error;
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
    const preview = automation.scriptContent || '(no script content)';
    return {
      preview: `--- DRY RUN (${automation.type}) ---\n\n${preview}`,
      riskLevel: automation.riskLevel,
    };
  }

  private async dispatch(automation: Automation): Promise<{ success: boolean; output: string; error: string | null }> {
    switch (automation.type) {
      case 'applescript':
        return runAppleScript(automation.scriptContent || '');

      case 'n8n':
        return exportN8nWorkflow(automation.scriptContent || '');

      case 'playwright':
        // Playwright scripts are TypeScript files — execution would require a separate runtime
        return {
          success: true,
          output: 'Playwright script generated. Run with: npx tsx <script.ts>',
          error: null,
        };

      case 'api_stub':
        return {
          success: true,
          output: 'API stub generated. Requires manual configuration of API keys and endpoints.',
          error: null,
        };

      default:
        return { success: false, output: '', error: `Unknown automation type: ${automation.type}` };
    }
  }
}
