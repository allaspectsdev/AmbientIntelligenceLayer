import type { Automation } from '@ail/common';
import type { AutomationRunner, RunResult, ExecutionContext } from './types.js';

/**
 * Tier 4 runner: invokes Claude/LLM at runtime for tasks requiring judgment.
 * LAST RESORT — only used when the task genuinely requires runtime reasoning.
 * Tracks token usage for cost transparency.
 */
export class AgenticRunner implements AutomationRunner {
  canRun(automation: Automation): boolean {
    return automation.executionTier === 4;
  }

  async run(automation: Automation, _context?: ExecutionContext): Promise<RunResult> {
    const start = Date.now();

    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          output: '',
          error: 'Agentic execution requires ANTHROPIC_API_KEY — this is a Tier 4 automation that needs runtime reasoning',
          executionTimeMs: Date.now() - start,
        };
      }

      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: `You are an automation agent. Execute the following task and return the result. Be concise.`,
        messages: [{
          role: 'user',
          content: `Task: ${automation.description || automation.name}\n\nScript reference:\n${automation.scriptContent?.substring(0, 500) || 'No script'}`,
        }],
      }) as { content: Array<{ type: string; text?: string }>; usage?: { input_tokens: number; output_tokens: number } };

      const text = response.content.find((b: { type: string }) => b.type === 'text');
      const tokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

      return {
        success: true,
        output: (text as { text?: string })?.text || 'No response',
        error: null,
        tokensUsed: tokens,
        executionTimeMs: Date.now() - start,
      };
    } catch (err) {
      return {
        success: false,
        output: '',
        error: `Agentic execution failed: ${(err as Error).message}`,
        executionTimeMs: Date.now() - start,
      };
    }
  }

  async dryRun(automation: Automation): Promise<{ preview: string; riskLevel: string }> {
    return {
      preview: `--- AGENTIC (Tier 4 — LLM Required) ---\n\nThis automation requires Claude at runtime.\nEstimated cost: ~500-2000 tokens per execution.\nTask: ${automation.description || automation.name}\n\n${automation.scriptContent || ''}`,
      riskLevel: automation.riskLevel,
    };
  }
}
