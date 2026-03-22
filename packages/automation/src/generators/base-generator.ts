import type { Pattern, Automation, AutomationType } from '@ail/common';

export interface GeneratedAutomation {
  type: AutomationType;
  name: string;
  description: string;
  scriptContent: string;
}

export abstract class AutomationGenerator {
  abstract readonly type: AutomationType;

  abstract canGenerate(pattern: Pattern): boolean;
  abstract generate(pattern: Pattern): GeneratedAutomation;
  abstract preview(scriptContent: string): string;
}
