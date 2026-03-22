import type { FileEvent as FEvent, Pattern, FileWorkflowData } from '@ail/common';

/**
 * Detects file workflow patterns: repeated file operations in consistent sequences.
 * E.g., create file in Downloads, modify in Documents (file processing workflow).
 */
export function detectFileWorkflows(
  events: FEvent[],
  minOccurrences: number = 3
): Pattern[] {
  if (events.length < minOccurrences) return [];

  const patterns: Pattern[] = [];
  const now = Date.now();

  // Track frequently modified files/paths
  const pathCounts = new Map<string, { count: number; types: Set<string>; apps: Set<string> }>();

  for (const e of events) {
    const existing = pathCounts.get(e.path) || { count: 0, types: new Set(), apps: new Set() };
    existing.count++;
    existing.types.add(e.eventType);
    if (e.appName) existing.apps.add(e.appName);
    pathCounts.set(e.path, existing);
  }

  // Files touched frequently across multiple event types = workflow
  for (const [path, { count, types, apps }] of pathCounts) {
    if (count >= minOccurrences && types.size > 1) {
      const data: FileWorkflowData = {
        paths: [path],
        eventTypes: [...types],
        appNames: [...apps],
        frequency: count,
      };

      patterns.push({
        type: 'file_workflow',
        description: `File workflow: ${path} — ${[...types].join('/')} (${count}x across ${[...apps].join(', ') || 'unknown apps'})`,
        dataJson: JSON.stringify(data),
        frequency: count,
        firstSeen: events[0]?.timestamp || now,
        lastSeen: now,
        isActive: true,
        confidence: 0.5,
        riskLevel: 'safe',
      });
    }
  }

  return patterns;
}
