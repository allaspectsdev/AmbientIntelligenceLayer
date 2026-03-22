import type { Pattern, AnalysisConfig } from '@ail/common';
import type { ActivityRepository, PatternRepository } from '@ail/storage';
import { detectAppSequences } from './sequence-tracker.js';
import { detectTimeSinks } from './time-sink-detector.js';
import { detectTabSwitching } from './switch-detector.js';

export class PatternDetector {
  constructor(
    private activityRepo: ActivityRepository,
    private patternRepo: PatternRepository,
    private config: AnalysisConfig
  ) {}

  async detectAll(): Promise<Pattern[]> {
    const since = Date.now() - this.config.analysisIntervalMs * 2; // Look back 2x the analysis interval
    const events = this.activityRepo.getEventsSince(since);

    if (events.length < 3) return [];

    const allPatterns: Pattern[] = [];

    // Run all detectors
    const sequences = detectAppSequences(
      events,
      this.config.sequenceMinLength,
      this.config.sequenceMinOccurrences
    );
    const timeSinks = detectTimeSinks(events, this.config.timeSinkThresholdMs);
    const tabSwitches = detectTabSwitching(
      events,
      this.config.tabSwitchWindowMs,
      this.config.tabSwitchThreshold
    );

    allPatterns.push(...sequences, ...timeSinks, ...tabSwitches);

    // Persist patterns
    for (const pattern of allPatterns) {
      this.patternRepo.upsert(pattern);
    }

    if (allPatterns.length > 0) {
      console.log(`[PatternDetector] Found ${allPatterns.length} patterns`);
    }

    return allPatterns;
  }
}
