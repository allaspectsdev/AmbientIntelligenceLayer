import type { Pattern, Automation, AutomationType, ExecutionTier, TemplateParam, RuleConfig } from '@ail/common';

export interface GeneratedAutomation {
  type: AutomationType;
  name: string;
  description: string;
  scriptContent: string;
  executionTier?: ExecutionTier;
  templateParams?: TemplateParam[];
  ruleConfig?: RuleConfig;
}

export abstract class AutomationGenerator {
  abstract readonly type: AutomationType;

  abstract canGenerate(pattern: Pattern): boolean;
  abstract generate(pattern: Pattern): GeneratedAutomation;
  abstract preview(scriptContent: string): string;
}
