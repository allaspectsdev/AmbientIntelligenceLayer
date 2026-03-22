import type { Pattern, TierClassification, ExecutionTier, AutomationType } from '@ail/common';

/**
 * Classifies the optimal execution tier for a pattern.
 * Always prefers the cheapest, most reliable option:
 * Tier 1 (hardcoded) > Tier 2 (template) > Tier 3 (rules) > Tier 4 (agentic)
 *
 * A bash script beats an agent loop every time for deterministic tasks.
 */
export function classifyTier(pattern: Pattern): TierClassification {
  const confidence = pattern.confidence ?? 0.5;
  const data = JSON.parse(pattern.dataJson);

  // High-confidence deterministic patterns → Tier 1 (hardcoded)
  if (isTier1Candidate(pattern, data, confidence)) {
    return {
      tier: 1,
      confidence: Math.min(0.95, confidence + 0.1),
      reasoning: tier1Reasoning(pattern),
      suggestedType: suggestType1(pattern),
    };
  }

  // Structurally consistent but with variable inputs → Tier 2 (parameterized)
  if (isTier2Candidate(pattern, data, confidence)) {
    return {
      tier: 2,
      confidence: Math.min(0.9, confidence + 0.05),
      reasoning: tier2Reasoning(pattern),
      suggestedType: 'template',
    };
  }

  // Conditional/branching patterns → Tier 3 (rule engine)
  if (isTier3Candidate(pattern, data)) {
    return {
      tier: 3,
      confidence: Math.min(0.85, confidence),
      reasoning: `Compound pattern with ${(data.componentPatternIds || []).length} components requires conditional logic — rule engine`,
      suggestedType: 'rule_engine',
    };
  }

  // Everything else → Tier 4 (agentic, last resort)
  return {
    tier: 4,
    confidence: Math.max(0.3, confidence - 0.1),
    reasoning: `Pattern has low confidence (${Math.round(confidence * 100)}%) or high input variability — requires runtime reasoning`,
    suggestedType: 'api_stub',
  };
}

function isTier1Candidate(pattern: Pattern, data: Record<string, unknown>, confidence: number): boolean {
  // High confidence + deterministic pattern types
  if (confidence < 0.5) return false;

  switch (pattern.type) {
    case 'app_sequence':
      // Fixed app sequence with consistent ordering → shell script
      return pattern.frequency >= 5 && Array.isArray(data.apps);

    case 'time_sink':
      // Time sink notifications are deterministic reminders
      return true;

    case 'tab_switching':
      // Tab switching can be resolved with a script that opens both side-by-side
      return pattern.frequency >= 5;

    case 'keyboard_sequence':
      // Repeated keyboard sequences are perfectly deterministic
      return pattern.frequency >= 10;

    case 'file_workflow':
      // File operations with fixed paths
      return pattern.frequency >= 3 && !hasVariablePaths(data);

    default:
      return false;
  }
}

function isTier2Candidate(pattern: Pattern, data: Record<string, unknown>, confidence: number): boolean {
  if (confidence < 0.4) return false;

  switch (pattern.type) {
    case 'clipboard_bridge':
      // Content varies but structure (source → target) is consistent
      return pattern.frequency >= 3;

    case 'file_workflow':
      // File paths vary (date-based, user-generated filenames)
      return hasVariablePaths(data);

    case 'app_sequence':
      // If the sequence involves URLs that change (e.g., different Jira tickets)
      return pattern.frequency >= 3 && confidence < 0.7;

    default:
      return false;
  }
}

function isTier3Candidate(pattern: Pattern, data: Record<string, unknown>): boolean {
  return pattern.type === 'compound' && Array.isArray(data.componentPatternIds) && data.componentPatternIds.length >= 2;
}

function hasVariablePaths(data: Record<string, unknown>): boolean {
  const paths = data.paths as string[] | undefined;
  if (!paths || paths.length === 0) return false;
  // Check if paths contain date-like patterns or seem dynamic
  return paths.some(p => /\d{4}[-/]\d{2}[-/]\d{2}|latest|temp|tmp|new/i.test(p));
}

function suggestType1(pattern: Pattern): AutomationType {
  switch (pattern.type) {
    case 'app_sequence':
    case 'tab_switching':
      return 'shell'; // `open -a` commands
    case 'keyboard_sequence':
      return 'applescript'; // keystroke simulation
    case 'file_workflow':
      return 'shell'; // cp/mv/mkdir
    default:
      return 'shell';
  }
}

function tier1Reasoning(pattern: Pattern): string {
  const freq = pattern.frequency;
  switch (pattern.type) {
    case 'app_sequence':
      return `App sequence repeated ${freq}x with consistent ordering — deterministic shell script (open -a commands)`;
    case 'keyboard_sequence':
      return `Keyboard shortcut pattern repeated ${freq}x — deterministic AppleScript macro`;
    case 'tab_switching':
      return `Frequent switching between app pair (${freq}x) — shell script to open side-by-side`;
    case 'file_workflow':
      return `File operations repeated ${freq}x with fixed paths — deterministic shell script`;
    default:
      return `Deterministic pattern repeated ${freq}x — hardcoded script`;
  }
}

function tier2Reasoning(pattern: Pattern): string {
  switch (pattern.type) {
    case 'clipboard_bridge':
      return `Data bridge pattern — structure is consistent but content varies per execution. Parameterized template with runtime variable resolution.`;
    case 'file_workflow':
      return `File workflow with variable paths (likely date-based) — template with {{today}} parameter resolution`;
    default:
      return `Pattern structure is consistent but inputs vary — parameterized template`;
  }
}
