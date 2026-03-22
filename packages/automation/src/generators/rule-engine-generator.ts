import type { Pattern, CompoundPatternData, RuleConfig, Rule } from '@ail/common';
import { AutomationGenerator, type GeneratedAutomation } from './base-generator.js';

/**
 * Generates rule engine configurations (Tier 3).
 * Conditional workflows codified as decision trees — pure code at runtime, no LLM.
 */
export class RuleEngineGenerator extends AutomationGenerator {
  readonly type = 'rule_engine' as const;

  canGenerate(pattern: Pattern): boolean {
    return pattern.type === 'compound';
  }

  generate(pattern: Pattern): GeneratedAutomation {
    const data = JSON.parse(pattern.dataJson) as CompoundPatternData;

    const rules: Rule[] = data.componentPatternIds.map((id, i) => ({
      conditions: [{
        field: 'pattern_active',
        operator: 'eq' as const,
        value: id,
      }],
      action: {
        type: 'execute_automation' as const,
        config: { patternId: id, priority: data.componentPatternIds.length - i },
      },
      priority: data.componentPatternIds.length - i,
    }));

    const ruleConfig: RuleConfig = {
      rules,
      defaultAction: {
        type: 'notify' as const,
        config: { message: `Compound pattern active but no matching rule — ${pattern.description}` },
      },
    };

    return {
      type: 'rule_engine',
      name: `Rules: ${pattern.description.substring(0, 40)}`,
      description: `Decision tree with ${rules.length} rules for compound pattern. Evaluates conditions and dispatches to appropriate automation — pure code, no LLM.`,
      scriptContent: JSON.stringify(ruleConfig, null, 2),
      executionTier: 3,
      ruleConfig,
    };
  }

  preview(scriptContent: string): string {
    try {
      const config = JSON.parse(scriptContent) as RuleConfig;
      const lines = [`Rule Engine (${config.rules.length} rules):`];
      for (const rule of config.rules) {
        const conds = rule.conditions.map(c => `${c.field} ${c.operator} ${c.value}`).join(' AND ');
        lines.push(`  IF ${conds} THEN ${rule.action.type}(${JSON.stringify(rule.action.config)})`);
      }
      lines.push(`  DEFAULT: ${config.defaultAction.type}`);
      return lines.join('\n');
    } catch {
      return scriptContent;
    }
  }
}
