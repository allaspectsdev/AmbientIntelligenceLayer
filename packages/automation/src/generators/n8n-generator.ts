import type { Pattern, ClipboardBridgeData, AppSequenceData } from '@ail/common';
import { AutomationGenerator, type GeneratedAutomation } from './base-generator.js';

// Map common app names to n8n node types
const APP_TO_N8N_NODE: Record<string, string> = {
  'Slack': 'n8n-nodes-base.slack',
  'Google Chrome': 'n8n-nodes-base.httpRequest',
  'Microsoft Excel': 'n8n-nodes-base.spreadsheetFile',
  'Numbers': 'n8n-nodes-base.spreadsheetFile',
  'Mail': 'n8n-nodes-base.emailSend',
  'Microsoft Outlook': 'n8n-nodes-base.microsoftOutlook',
  'Notion': 'n8n-nodes-base.notion',
  'Jira': 'n8n-nodes-base.jira',
  'GitHub': 'n8n-nodes-base.github',
};

export class N8nGenerator extends AutomationGenerator {
  readonly type = 'n8n' as const;

  canGenerate(pattern: Pattern): boolean {
    return pattern.type === 'clipboard_bridge' || pattern.type === 'app_sequence' || pattern.type === 'compound';
  }

  generate(pattern: Pattern): GeneratedAutomation {
    const nodes: Array<Record<string, unknown>> = [];
    const connections: Record<string, unknown> = {};
    let yPos = 0;

    // Start with a manual trigger
    nodes.push({
      parameters: {},
      id: 'trigger',
      name: 'Manual Trigger',
      type: 'n8n-nodes-base.manualTrigger',
      typeVersion: 1,
      position: [250, yPos],
    });

    if (pattern.type === 'clipboard_bridge') {
      const data = JSON.parse(pattern.dataJson) as ClipboardBridgeData;
      const sourceNode = APP_TO_N8N_NODE[data.sourceApp] || 'n8n-nodes-base.httpRequest';
      const targetNode = APP_TO_N8N_NODE[data.targetApp] || 'n8n-nodes-base.httpRequest';

      nodes.push({
        parameters: { url: '={{ $json.url }}', method: 'GET' },
        id: 'source',
        name: `Get from ${data.sourceApp}`,
        type: sourceNode,
        typeVersion: 1,
        position: [450, yPos],
      });

      nodes.push({
        parameters: { url: '={{ $json.url }}', method: 'POST', body: '={{ $json.data }}' },
        id: 'target',
        name: `Send to ${data.targetApp}`,
        type: targetNode,
        typeVersion: 1,
        position: [650, yPos],
      });

      connections['Manual Trigger'] = { main: [[{ node: `Get from ${data.sourceApp}`, type: 'main', index: 0 }]] };
      connections[`Get from ${data.sourceApp}`] = { main: [[{ node: `Send to ${data.targetApp}`, type: 'main', index: 0 }]] };
    } else {
      const data = JSON.parse(pattern.dataJson) as AppSequenceData;
      let prevName = 'Manual Trigger';

      for (let i = 0; i < data.apps.length; i++) {
        const app = data.apps[i];
        const nodeType = APP_TO_N8N_NODE[app] || 'n8n-nodes-base.httpRequest';
        const nodeName = `Step ${i + 1}: ${app}`;
        yPos += 150;

        nodes.push({
          parameters: {},
          id: `step_${i}`,
          name: nodeName,
          type: nodeType,
          typeVersion: 1,
          position: [450 + i * 200, 0],
        });

        connections[prevName] = { main: [[{ node: nodeName, type: 'main', index: 0 }]] };
        prevName = nodeName;
      }
    }

    const workflow = {
      name: `AIL: ${pattern.description.substring(0, 50)}`,
      nodes,
      connections,
      active: false,
      settings: {},
      tags: [{ name: 'ail-generated' }],
    };

    return {
      type: 'n8n',
      name: `n8n: ${pattern.description.substring(0, 40)}`,
      description: `n8n workflow generated from pattern: ${pattern.description}`,
      scriptContent: JSON.stringify(workflow, null, 2),
    };
  }

  preview(scriptContent: string): string {
    try {
      const wf = JSON.parse(scriptContent);
      return `n8n Workflow: ${wf.name}\nNodes: ${wf.nodes.length}\n${wf.nodes.map((n: { name: string }) => `  - ${n.name}`).join('\n')}`;
    } catch {
      return scriptContent;
    }
  }
}
