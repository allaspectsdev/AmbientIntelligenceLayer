import { execSync } from 'node:child_process';
import type { Automation } from '@ail/common';
import type { AutomationRunner, RunResult, ExecutionContext } from './types.js';

export class ShellRunner implements AutomationRunner {
  canRun(automation: Automation): boolean {
    return automation.type === 'shell';
  }

  async run(automation: Automation, _context?: ExecutionContext): Promise<RunResult> {
    const start = Date.now();
    try {
      const output = execSync(automation.scriptContent || 'echo "empty script"', {
        encoding: 'utf-8',
        timeout: 30_000,
        shell: '/bin/bash',
        env: { ...process.env, ..._context?.env },
      }).trim();

      return {
        success: true,
        output,
        error: null,
        executionTimeMs: Date.now() - start,
      };
    } catch (err) {
      const error = err as { stderr?: string; message?: string };
      return {
        success: false,
        output: '',
        error: error.stderr || error.message || 'Shell execution failed',
        executionTimeMs: Date.now() - start,
      };
    }
  }

  async dryRun(automation: Automation): Promise<{ preview: string; riskLevel: string }> {
    return {
      preview: `--- SHELL SCRIPT (Tier 1 Hardcoded) ---\n\n${automation.scriptContent || '(empty)'}`,
      riskLevel: automation.riskLevel,
    };
  }
}
