import type { ActivityEvent, TimeSinkData, Pattern } from '@ail/common';

/**
 * Detects time sinks — single-app sessions that exceed a threshold.
 */
export function detectTimeSinks(
  events: ActivityEvent[],
  thresholdMs: number = 30 * 60_000
): Pattern[] {
  const patterns: Pattern[] = [];
  const appSessions = new Map<string, { totalMs: number; count: number; maxMs: number }>();

  for (const event of events) {
    if (!event.durationMs) continue;

    const existing = appSessions.get(event.appName) || { totalMs: 0, count: 0, maxMs: 0 };
    existing.totalMs += event.durationMs;
    existing.count += 1;
    existing.maxMs = Math.max(existing.maxMs, event.durationMs);
    appSessions.set(event.appName, existing);
  }

  for (const [appName, stats] of appSessions) {
    // Flag if any single session exceeded threshold or total time is very high
    if (stats.maxMs >= thresholdMs || stats.totalMs >= thresholdMs * 2) {
      const now = Date.now();
      const data: TimeSinkData = {
        appName,
        windowTitlePattern: null,
        avgDurationMs: Math.round(stats.totalMs / stats.count),
        totalDurationMs: stats.totalMs,
        occurrences: stats.count,
      };

      patterns.push({
        type: 'time_sink',
        description: `Time sink: ${appName} — ${Math.round(stats.totalMs / 60_000)}min total (${stats.count} sessions)`,
        dataJson: JSON.stringify(data),
        frequency: stats.count,
        firstSeen: events[0]?.timestamp || now,
        lastSeen: now,
        isActive: true,
      });
    }
  }

  return patterns;
}
