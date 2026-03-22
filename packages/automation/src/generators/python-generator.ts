import type { Pattern, ClipboardBridgeData } from '@ail/common';
import { AutomationGenerator, type GeneratedAutomation } from './base-generator.js';

/**
 * Generates Python scripts for data processing patterns.
 * Tier 1 for fully deterministic, Tier 2 when parameterized.
 */
export class PythonScriptGenerator extends AutomationGenerator {
  readonly type = 'python' as const;

  canGenerate(pattern: Pattern): boolean {
    return pattern.type === 'clipboard_bridge' || pattern.type === 'file_workflow';
  }

  generate(pattern: Pattern): GeneratedAutomation {
    if (pattern.type === 'clipboard_bridge') {
      return this.generateClipboardBridge(pattern);
    }
    return this.generateGeneric(pattern);
  }

  preview(scriptContent: string): string {
    return scriptContent;
  }

  private generateClipboardBridge(pattern: Pattern): GeneratedAutomation {
    const data = JSON.parse(pattern.dataJson) as ClipboardBridgeData;

    const script = `#!/usr/bin/env python3
"""
AIL Tier 2 — Parameterized data bridge: ${data.sourceApp} → ${data.targetApp}
Pattern observed ${pattern.frequency}x with ${Math.round((pattern.confidence ?? 0.5) * 100)}% confidence.
Structure is consistent, content varies — template with runtime parameter resolution.
"""
import argparse
import json
import sys
from datetime import datetime

def extract_from_source(source_data: str) -> dict:
    """Extract data from ${data.sourceApp} format."""
    # TODO: Customize extraction logic for ${data.sourceApp}
    return {"data": source_data, "extracted_at": datetime.now().isoformat()}

def transform(data: dict) -> dict:
    """Transform data for ${data.targetApp} format."""
    # TODO: Customize transformation logic
    return data

def load_to_target(data: dict, target: str) -> None:
    """Load transformed data into ${data.targetApp}."""
    # TODO: Customize loading logic for ${data.targetApp}
    print(json.dumps(data, indent=2))

def main():
    parser = argparse.ArgumentParser(description="Data bridge: ${data.sourceApp} → ${data.targetApp}")
    parser.add_argument("--source-data", required=True, help="Input data from ${data.sourceApp}")
    parser.add_argument("--target", default="${data.targetApp}", help="Target application")
    parser.add_argument("--dry-run", action="store_true", help="Preview without executing")
    args = parser.parse_args()

    extracted = extract_from_source(args.source_data)
    transformed = transform(extracted)

    if args.dry_run:
        print("DRY RUN — would send to", args.target)
        print(json.dumps(transformed, indent=2))
    else:
        load_to_target(transformed, args.target)
        print(f"Transferred data from ${data.sourceApp} to {args.target}")

if __name__ == "__main__":
    main()
`;

    return {
      type: 'python',
      name: `Bridge: ${data.sourceApp} → ${data.targetApp}`,
      description: `Python data bridge from ${data.sourceApp} to ${data.targetApp}. Parameterized — content varies per execution but structure is fixed.`,
      scriptContent: script,
      executionTier: 2,
      templateParams: [
        { name: 'source_data', type: 'custom', resolver: 'clipboard', defaultValue: '' },
        { name: 'target', type: 'config', resolver: `config:target_app`, defaultValue: data.targetApp },
      ],
    };
  }

  private generateGeneric(pattern: Pattern): GeneratedAutomation {
    return {
      type: 'python',
      name: `Python: ${pattern.description.substring(0, 40)}`,
      description: pattern.description,
      scriptContent: `#!/usr/bin/env python3\n# AIL — ${pattern.description}\nprint("TODO: implement")`,
      executionTier: 1,
    };
  }
}
