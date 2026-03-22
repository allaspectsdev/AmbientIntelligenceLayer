import type { Pattern, ClipboardBridgeData } from '@ail/common';
import { AutomationGenerator, type GeneratedAutomation } from './base-generator.js';

export class ApiStubGenerator extends AutomationGenerator {
  readonly type = 'api_stub' as const;

  canGenerate(pattern: Pattern): boolean {
    return pattern.type === 'clipboard_bridge';
  }

  generate(pattern: Pattern): GeneratedAutomation {
    const data = JSON.parse(pattern.dataJson) as ClipboardBridgeData;

    const script = `// Auto-generated API integration stub by Ambient Intelligence Layer
// Pattern: ${pattern.description}
// This bridges data from ${data.sourceApp} to ${data.targetApp}

interface SourceData {
  // TODO: Define the shape of data from ${data.sourceApp}
  [key: string]: unknown;
}

interface TargetPayload {
  // TODO: Define the shape of data for ${data.targetApp}
  [key: string]: unknown;
}

async function fetchFromSource(): Promise<SourceData> {
  // TODO: Replace with actual ${data.sourceApp} API endpoint
  const response = await fetch('https://api.${data.sourceApp.toLowerCase().replace(/\\s+/g, '')}.com/v1/data', {
    headers: {
      'Authorization': 'Bearer ' + process.env.SOURCE_API_KEY,
    },
  });
  return response.json() as Promise<SourceData>;
}

function transform(source: SourceData): TargetPayload {
  // TODO: Map source fields to target fields
  return { ...source };
}

async function sendToTarget(payload: TargetPayload): Promise<void> {
  // TODO: Replace with actual ${data.targetApp} API endpoint
  await fetch('https://api.${data.targetApp.toLowerCase().replace(/\\s+/g, '')}.com/v1/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.TARGET_API_KEY,
    },
    body: JSON.stringify(payload),
  });
}

async function run() {
  const source = await fetchFromSource();
  const payload = transform(source);
  await sendToTarget(payload);
  console.log('Data transferred successfully');
}

run().catch(console.error);
`;

    return {
      type: 'api_stub',
      name: `API: ${data.sourceApp} -> ${data.targetApp}`,
      description: `API integration stub bridging ${data.sourceApp} to ${data.targetApp}`,
      scriptContent: script,
    };
  }

  preview(scriptContent: string): string {
    return scriptContent;
  }
}
