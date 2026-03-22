import type { ActivityEvent, AppSequenceData, Pattern } from '@ail/common';

/**
 * Detects repeated application sequences in activity data.
 * Looks for ordered sequences of N+ apps that appear multiple times.
 */
export function detectAppSequences(
  events: ActivityEvent[],
  minLength: number = 3,
  minOccurrences: number = 3
): Pattern[] {
  if (events.length < minLength) return [];

  // Extract ordered app names (deduplicate consecutive same-app events)
  const appSequence: string[] = [];
  for (const event of events) {
    if (appSequence.length === 0 || appSequence[appSequence.length - 1] !== event.appName) {
      appSequence.push(event.appName);
    }
  }

  const patterns: Pattern[] = [];
  const seen = new Set<string>();

  // Slide a window of each length from minLength to minLength+2
  for (let len = minLength; len <= Math.min(minLength + 2, appSequence.length); len++) {
    const sequenceCounts = new Map<string, number>();

    for (let i = 0; i <= appSequence.length - len; i++) {
      const seq = appSequence.slice(i, i + len);
      const key = seq.join(' → ');
      sequenceCounts.set(key, (sequenceCounts.get(key) || 0) + 1);
    }

    for (const [key, count] of sequenceCounts) {
      if (count >= minOccurrences && !seen.has(key)) {
        seen.add(key);
        const apps = key.split(' → ');
        const now = Date.now();

        const data: AppSequenceData = {
          apps,
          avgIntervalMs: 0,
          occurrences: count,
        };

        patterns.push({
          type: 'app_sequence',
          description: `Repeated sequence: ${key} (${count} times)`,
          dataJson: JSON.stringify(data),
          frequency: count,
          firstSeen: events[0].timestamp,
          lastSeen: now,
          isActive: true,
        confidence: 0.5,
        riskLevel: 'safe' as const,
        });
      }
    }
  }

  return patterns;
}
