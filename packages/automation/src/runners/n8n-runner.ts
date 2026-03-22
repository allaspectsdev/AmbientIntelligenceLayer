import type { RunResult } from './applescript-runner.js';

/**
 * n8n workflows are exported as JSON, not executed directly.
 * This "runner" validates the JSON and returns it for import into n8n.
 */
export function exportN8nWorkflow(scriptContent: string): RunResult {
  try {
    const workflow = JSON.parse(scriptContent);

    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      return { success: false, output: '', error: 'Invalid n8n workflow: missing nodes array' };
    }

    return {
      success: true,
      output: `n8n workflow "${workflow.name}" with ${workflow.nodes.length} nodes ready for import`,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      output: '',
      error: `Invalid JSON: ${(err as Error).message}`,
    };
  }
}
