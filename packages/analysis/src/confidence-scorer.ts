import type { Pattern, AnalysisConfig } from '@ail/common';

/**
 * Computes a confidence score (0.0–1.0) for a pattern based on:
 * - Frequency (more occurrences = higher)
 * - Recency (seen recently = higher)
 * - Consistency (regular timing = higher)
 * - Duration (pattern spans longer time = more established)
 */
export function scorePattern(pattern: Pattern, config: AnalysisConfig): number {
  const now = Date.now();

  // Frequency score: logarithmic scaling, caps at 20 occurrences
  const freqScore = Math.min(1.0, Math.log2(pattern.frequency + 1) / Math.log2(21));

  // Recency score: exponential decay, half-life = patternAgingDays
  const daysSinceLastSeen = (now - pattern.lastSeen) / (24 * 60 * 60_000);
  const halfLife = config.patternAgingDays;
  const recencyScore = Math.pow(0.5, daysSinceLastSeen / halfLife);

  // Duration score: how long the pattern has been observed (established patterns score higher)
  const durationDays = (pattern.lastSeen - pattern.firstSeen) / (24 * 60 * 60_000);
  const durationScore = Math.min(1.0, durationDays / 7); // Caps at 7 days

  // Consistency: frequency relative to observation window
  // Higher frequency in shorter time = more consistent
  const observationHours = Math.max(1, (pattern.lastSeen - pattern.firstSeen) / 3600_000);
  const eventsPerHour = pattern.frequency / observationHours;
  const consistencyScore = Math.min(1.0, eventsPerHour / 2); // Caps at 2/hour

  // Weighted combination
  const confidence =
    freqScore * 0.35 +
    recencyScore * 0.30 +
    consistencyScore * 0.20 +
    durationScore * 0.15;

  return Math.round(confidence * 1000) / 1000; // 3 decimal places
}
