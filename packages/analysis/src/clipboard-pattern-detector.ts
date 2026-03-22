import type { ClipboardEvent as CbEvent, Pattern, ClipboardBridgeData } from '@ail/common';

/**
 * Detects clipboard bridges: repeated copy from App A, paste in App B.
 * This suggests data is being manually transferred between two systems.
 */
export function detectClipboardBridges(
  events: CbEvent[],
  minOccurrences: number = 3
): Pattern[] {
  if (events.length < minOccurrences) return [];

  const patterns: Pattern[] = [];
  const now = Date.now();

  // Count source→target app pairs
  const pairCounts = new Map<string, { count: number; contentTypes: Set<string> }>();

  for (const e of events) {
    if (!e.sourceApp || !e.targetApp) continue;
    if (e.sourceApp === e.targetApp) continue; // Ignore same-app clipboard

    const pair = `${e.sourceApp} → ${e.targetApp}`;
    const existing = pairCounts.get(pair) || { count: 0, contentTypes: new Set() };
    existing.count++;
    existing.contentTypes.add(e.contentType);
    pairCounts.set(pair, existing);
  }

  for (const [pair, { count, contentTypes }] of pairCounts) {
    if (count >= minOccurrences) {
      const [sourceApp, targetApp] = pair.split(' → ');
      const data: ClipboardBridgeData = {
        sourceApp,
        targetApp,
        frequency: count,
        contentTypes: [...contentTypes],
      };

      patterns.push({
        type: 'clipboard_bridge',
        description: `Data bridge: copying from ${sourceApp} to ${targetApp} (${count}x) — potential automation candidate`,
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
