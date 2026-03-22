import type { Automation } from '@ail/common';

export interface RunResult {
  success: boolean;
  output: string;
  error: string | null;
  tokensUsed?: number;
  executionTimeMs?: number;
}

export interface ExecutionContext {
  params?: Record<string, string>;
  env?: Record<string, string>;
  triggerData?: unknown;
}

export interface AutomationRunner {
  canRun(automation: Automation): boolean;
  run(automation: Automation, context?: ExecutionContext): Promise<RunResult>;
  dryRun(automation: Automation): Promise<{ preview: string; riskLevel: string }>;
}
