import type { Pattern, CompoundPatternData } from '@ail/common';

/**
 * Detects compound patterns by correlating patterns across sources.
 * If an app_sequence pattern and a clipboard_bridge pattern consistently
 * co-occur within a time window, they form a compound pattern.
 */
export function detectCompoundPatterns(
  patterns: Pattern[],
  correlationWindowMs: number = 60_000
): Pattern[] {
  if (patterns.length < 2) return [];

  const compounds: Pattern[] = [];
  const now = Date.now();
  const seen = new Set<string>();

  // Group active patterns by time proximity
  for (let i = 0; i < patterns.length; i++) {
    for (let j = i + 1; j < patterns.length; j++) {
      const p1 = patterns[i];
      const p2 = patterns[j];

      // Different types only
      if (p1.type === p2.type) continue;

      // Check temporal overlap
      const overlap = Math.abs(p1.lastSeen - p2.lastSeen) <= correlationWindowMs;
      if (!overlap) continue;

      // Compute correlation score based on timing proximity and frequency similarity
      const timeDiff = Math.abs(p1.lastSeen - p2.lastSeen);
      const timingScore = 1 - (timeDiff / correlationWindowMs);
      const freqRatio = Math.min(p1.frequency, p2.frequency) / Math.max(p1.frequency, p2.frequency);
      const correlationScore = (timingScore * 0.6 + freqRatio * 0.4);

      if (correlationScore < 0.3) continue;

      const key = [p1.id, p2.id].sort().join('-');
      if (seen.has(key)) continue;
      seen.add(key);

      const data: CompoundPatternData = {
        componentPatternIds: [p1.id!, p2.id!].filter(Boolean),
        description: `${p1.type} + ${p2.type} co-occurring`,
        correlationScore,
      };

      compounds.push({
        type: 'compound',
        description: `Compound: ${p1.description.substring(0, 50)} + ${p2.description.substring(0, 50)}`,
        dataJson: JSON.stringify(data),
        frequency: Math.min(p1.frequency, p2.frequency),
        firstSeen: Math.min(p1.firstSeen, p2.firstSeen),
        lastSeen: now,
        isActive: true,
        confidence: correlationScore,
        riskLevel: 'safe',
      });
    }
  }

  return compounds;
}
