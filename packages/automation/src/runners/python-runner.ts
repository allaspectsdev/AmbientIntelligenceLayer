import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { Automation } from '@ail/common';
import type { AutomationRunner, RunResult, ExecutionContext } from './types.js';

export class PythonRunner implements AutomationRunner {
  canRun(automation: Automation): boolean {
    return automation.type === 'python';
  }

  async run(automation: Automation, context?: ExecutionContext): Promise<RunResult> {
    const start = Date.now();
    const tmpFile = join(tmpdir(), `ail-automation-${automation.id || 'tmp'}.py`);

    try {
      writeFileSync(tmpFile, automation.scriptContent || 'print("empty script")');

      // Build args as array — prevents shell injection
      const args: string[] = [tmpFile];
      if (context?.params) {
        for (const [k, v] of Object.entries(context.params)) {
          args.push(`--${k.replace(/_/g, '-')}`, v);
        }
      }

      const output = execFileSync('python3', args, {
        encoding: 'utf-8',
        timeout: 60_000,
        env: { ...process.env, ...(context?.env) },
      }).trim();

      return { success: true, output, error: null, executionTimeMs: Date.now() - start };
    } catch (err) {
      const error = err as { stderr?: string; message?: string };
      return { success: false, output: '', error: error.stderr || error.message || 'Python execution failed', executionTimeMs: Date.now() - start };
    } finally {
      try { unlinkSync(tmpFile); } catch { /* cleanup best-effort */ }
    }
  }

  async dryRun(automation: Automation): Promise<{ preview: string; riskLevel: string }> {
    return {
      preview: `--- PYTHON SCRIPT (Tier ${automation.executionTier}) ---\n\n${automation.scriptContent || '(empty)'}`,
      riskLevel: automation.riskLevel,
    };
  }
}
