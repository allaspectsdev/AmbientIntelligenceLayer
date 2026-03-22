import type { KeyboardEvent as KbEvent, Pattern, KeyboardSequenceData } from '@ail/common';

/**
 * Detects repeated keyboard sequences, e.g.:
 * - Cmd+C → Cmd+Tab → Cmd+V (copy-switch-paste) repeated many times
 * - Same key combo used frequently in same app
 */
export function detectKeyboardSequences(
  events: KbEvent[],
  minOccurrences: number = 5
): Pattern[] {
  if (events.length < 10) return [];

  const patterns: Pattern[] = [];
  const now = Date.now();

  // Look for repeated modifier+key combos (shortcuts used frequently)
  const comboCounts = new Map<string, { count: number; appName: string | null }>();
  for (const e of events) {
    if (e.eventType !== 'keydown' || !e.modifiers) continue;
    const combo = `${e.modifiers}+${e.keyCode}`;
    const key = `${combo}@${e.appName || 'unknown'}`;
    const existing = comboCounts.get(key) || { count: 0, appName: e.appName };
    existing.count++;
    comboCounts.set(key, existing);
  }

  for (const [key, { count, appName }] of comboCounts) {
    if (count >= minOccurrences) {
      const combo = key.split('@')[0];
      const data: KeyboardSequenceData = {
        keys: [combo],
        appName,
        frequency: count,
        avgIntervalMs: 0,
      };

      patterns.push({
        type: 'keyboard_sequence',
        description: `Frequent shortcut: ${combo} in ${appName || 'multiple apps'} (${count}x)`,
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

  // Look for copy-switch-paste sequences (Cmd+C → Cmd+Tab → Cmd+V)
  const cspCount = detectCopySwitchPaste(events);
  if (cspCount >= minOccurrences) {
    const data: KeyboardSequenceData = {
      keys: ['meta+67', 'meta+48', 'meta+86'], // Cmd+C, Cmd+Tab, Cmd+V
      appName: null,
      frequency: cspCount,
      avgIntervalMs: 0,
    };
    patterns.push({
      type: 'keyboard_sequence',
      description: `Copy-Switch-Paste pattern detected (${cspCount}x) — consider using clipboard manager or automation`,
      dataJson: JSON.stringify(data),
      frequency: cspCount,
      firstSeen: events[0]?.timestamp || now,
      lastSeen: now,
      isActive: true,
      confidence: 0.5,
      riskLevel: 'safe',
    });
  }

  return patterns;
}

function detectCopySwitchPaste(events: KbEvent[]): number {
  let count = 0;
  for (let i = 0; i < events.length - 2; i++) {
    const e1 = events[i];
    const e2 = events[i + 1];
    const e3 = events[i + 2];
    if (
      e1.modifiers?.includes('meta') && e1.keyCode === '67' && // Cmd+C
      e2.modifiers?.includes('meta') && e2.keyCode === '48' && // Cmd+Tab
      e3.modifiers?.includes('meta') && e3.keyCode === '86'    // Cmd+V
    ) {
      count++;
      i += 2; // Skip past this sequence
    }
  }
  return count;
}
