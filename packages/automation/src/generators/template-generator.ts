import type { Pattern, ClipboardBridgeData, TemplateParam } from '@ail/common';
import { AutomationGenerator, type GeneratedAutomation } from './base-generator.js';

/**
 * Generates parameterized templates (Tier 2).
 * Structure is fixed, inputs vary. {{placeholders}} resolved at runtime — zero LLM tokens.
 */
export class TemplateGenerator extends AutomationGenerator {
  readonly type = 'template' as const;

  canGenerate(pattern: Pattern): boolean {
    return pattern.type === 'clipboard_bridge' || pattern.type === 'file_workflow';
  }

  generate(pattern: Pattern): GeneratedAutomation {
    if (pattern.type === 'clipboard_bridge') {
      return this.generateClipboardTemplate(pattern);
    }
    return this.generateFileTemplate(pattern);
  }

  preview(scriptContent: string): string {
    return scriptContent;
  }

  private generateClipboardTemplate(pattern: Pattern): GeneratedAutomation {
    const data = JSON.parse(pattern.dataJson) as ClipboardBridgeData;

    const params: TemplateParam[] = [
      { name: 'today', type: 'date', resolver: 'today' },
      { name: 'source_app', type: 'config', resolver: 'literal', defaultValue: data.sourceApp },
      { name: 'target_app', type: 'config', resolver: 'literal', defaultValue: data.targetApp },
    ];

    const script = [
      '#!/bin/bash',
      'set -euo pipefail',
      '',
      '# AIL Tier 2 — Parameterized Template',
      `# Data bridge: {{source_app}} → {{target_app}}`,
      `# Date: {{today}}`,
      `# Pattern observed ${pattern.frequency}x — structure fixed, inputs vary`,
      '',
      'echo "Transferring data from {{source_app}} to {{target_app}} on {{today}}"',
      '',
      '# TODO: Add actual transfer logic',
      '# The template parameters above are resolved at runtime',
      '# by the AIL parameter resolver — no LLM tokens needed',
    ].join('\n');

    return {
      type: 'template',
      name: `Template: ${data.sourceApp} → ${data.targetApp}`,
      description: `Parameterized bridge from ${data.sourceApp} to ${data.targetApp}. Variables resolved at runtime.`,
      scriptContent: script,
      executionTier: 2,
      templateParams: params,
    };
  }

  private generateFileTemplate(pattern: Pattern): GeneratedAutomation {
    const data = JSON.parse(pattern.dataJson) as { paths: string[]; eventTypes: string[] };

    const params: TemplateParam[] = [
      { name: 'today', type: 'date', resolver: 'today' },
      { name: 'year', type: 'date', resolver: 'year' },
      { name: 'month', type: 'date', resolver: 'month' },
    ];

    const script = [
      '#!/bin/bash',
      'set -euo pipefail',
      '',
      '# AIL Tier 2 — File workflow template',
      '# Date: {{today}} ({{year}}/{{month}})',
      '',
      ...data.paths.map(p => `# Process: ${p}`),
      '',
      'echo "File workflow completed for {{today}}"',
    ].join('\n');

    return {
      type: 'template',
      name: `File template: ${data.paths[0] || 'workflow'}`,
      description: `Parameterized file workflow. Date-based paths resolved at runtime.`,
      scriptContent: script,
      executionTier: 2,
      templateParams: params,
    };
  }
}
