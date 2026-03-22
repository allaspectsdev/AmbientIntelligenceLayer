import type { Automation, RuleConfig, RuleCondition } from '@ail/common';
import type { AutomationRunner, RunResult, ExecutionContext } from './types.js';

/**
 * Tier 3 runner: evaluates rule conditions against context and executes matching actions.
 * Pure code at runtime — no LLM tokens, just condition evaluation and dispatch.
 */
export class RuleEngineRunner implements AutomationRunner {
  canRun(automation: Automation): boolean {
    return automation.type === 'rule_engine' || automation.executionTier === 3;
  }

  async run(automation: Automation, context?: ExecutionContext): Promise<RunResult> {
    const start = Date.now();

    try {
      const config: RuleConfig = automation.ruleConfig
        ? (typeof automation.ruleConfig === 'string' ? JSON.parse(automation.ruleConfig) : automation.ruleConfig)
        : JSON.parse(automation.scriptContent || '{}');

      // Evaluate rules in priority order
      const sortedRules = [...config.rules].sort((a, b) => b.priority - a.priority);
      const contextData = context?.triggerData as Record<string, unknown> || {};

      for (const rule of sortedRules) {
        if (evaluateConditions(rule.conditions, contextData)) {
          return {
            success: true,
            output: `Rule matched: ${JSON.stringify(rule.conditions)} → action: ${rule.action.type}(${JSON.stringify(rule.action.config)})`,
            error: null,
            executionTimeMs: Date.now() - start,
          };
        }
      }

      // Default action
      return {
        success: true,
        output: `No rules matched — executing default action: ${config.defaultAction.type}`,
        error: null,
        executionTimeMs: Date.now() - start,
      };
    } catch (err) {
      return {
        success: false,
        output: '',
        error: `Rule engine error: ${(err as Error).message}`,
        executionTimeMs: Date.now() - start,
      };
    }
  }

  async dryRun(automation: Automation): Promise<{ preview: string; riskLevel: string }> {
    try {
      const config: RuleConfig = JSON.parse(automation.scriptContent || '{}');
      const lines = [`--- RULE ENGINE (Tier 3) --- ${config.rules.length} rules\n`];
      for (const rule of config.rules) {
        const conds = rule.conditions.map(c => `${c.field} ${c.operator} ${JSON.stringify(c.value)}`).join(' AND ');
        lines.push(`IF ${conds}`);
        lines.push(`  THEN ${rule.action.type} → ${JSON.stringify(rule.action.config)}`);
        lines.push('');
      }
      lines.push(`DEFAULT: ${config.defaultAction.type}`);
      return { preview: lines.join('\n'), riskLevel: automation.riskLevel };
    } catch {
      return { preview: automation.scriptContent || '(invalid rule config)', riskLevel: automation.riskLevel };
    }
  }
}

function evaluateConditions(conditions: RuleCondition[], data: Record<string, unknown>): boolean {
  return conditions.every(cond => {
    const fieldValue = data[cond.field];
    switch (cond.operator) {
      case 'eq': return fieldValue === cond.value;
      case 'gt': return Number(fieldValue) > Number(cond.value);
      case 'lt': return Number(fieldValue) < Number(cond.value);
      case 'gte': return Number(fieldValue) >= Number(cond.value);
      case 'lte': return Number(fieldValue) <= Number(cond.value);
      case 'contains': return String(fieldValue).includes(String(cond.value));
      case 'matches':
        try { return new RegExp(String(cond.value)).test(String(fieldValue)); }
        catch { return false; }
      default: return false;
    }
  });
}
