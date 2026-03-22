import type { ActivityEvent, TabSwitchData, Pattern } from '@ail/common';

/**
 * Detects excessive switching between the same pair of applications
 * within a time window.
 */
export function detectTabSwitching(
  events: ActivityEvent[],
  windowMs: number = 5 * 60_000,
  threshold: number = 10
): Pattern[] {
  if (events.length < threshold) return [];

  const patterns: Pattern[] = [];
  const now = Date.now();

  // Slide a time window across events
  let windowStart = 0;

  for (let windowEnd = 0; windowEnd < events.length; windowEnd++) {
    // Move window start forward
    while (
      windowStart < windowEnd &&
      events[windowEnd].timestamp - events[windowStart].timestamp > windowMs
    ) {
      windowStart++;
    }

    // Count pair switches in current window
    const pairCounts = new Map<string, number>();
    for (let i = windowStart; i < windowEnd; i++) {
      if (events[i].appName !== events[i + 1]?.appName) {
        const pair = [events[i].appName, events[i + 1].appName].sort().join(' ↔ ');
        pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
      }
    }

    for (const [pair, count] of pairCounts) {
      if (count >= threshold) {
        const apps = pair.split(' ↔ ') as [string, string];

        // Check if we already have this pattern
        if (patterns.some(p => p.description.includes(pair))) continue;

        const data: TabSwitchData = {
          apps,
          switchCount: count,
          windowMs,
        };

        patterns.push({
          type: 'tab_switching',
          description: `Frequent switching: ${pair} (${count} times in ${Math.round(windowMs / 60_000)}min)`,
          dataJson: JSON.stringify(data),
          frequency: count,
          firstSeen: events[windowStart].timestamp,
          lastSeen: now,
          isActive: true,
        });
      }
    }
  }

  return patterns;
}
