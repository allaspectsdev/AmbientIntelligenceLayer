import type { Pattern, AnalysisConfig } from '@ail/common';
import type { ActivityRepository, PatternRepository, KeyboardEventRepository, ClipboardEventRepository, FileEventRepository } from '@ail/storage';
import { detectAppSequences } from './sequence-tracker.js';
import { detectTimeSinks } from './time-sink-detector.js';
import { detectTabSwitching } from './switch-detector.js';
import { detectKeyboardSequences } from './keyboard-pattern-detector.js';
import { detectClipboardBridges } from './clipboard-pattern-detector.js';
import { detectFileWorkflows } from './file-pattern-detector.js';
import { detectCompoundPatterns } from './compound-detector.js';
import { scorePattern } from './confidence-scorer.js';

export class PatternDetector {
  constructor(
    private activityRepo: ActivityRepository,
    private patternRepo: PatternRepository,
    private config: AnalysisConfig,
    private keyboardRepo?: KeyboardEventRepository,
    private clipboardRepo?: ClipboardEventRepository,
    private fileRepo?: FileEventRepository,
  ) {}

  async detectAll(): Promise<Pattern[]> {
    const since = Date.now() - this.config.analysisIntervalMs * 2;
    const events = this.activityRepo.getEventsSince(since);
    const allPatterns: Pattern[] = [];

    // Original detectors (window-based)
    if (events.length >= 3) {
      allPatterns.push(
        ...detectAppSequences(events, this.config.sequenceMinLength, this.config.sequenceMinOccurrences),
        ...detectTimeSinks(events, this.config.timeSinkThresholdMs),
        ...detectTabSwitching(events, this.config.tabSwitchWindowMs, this.config.tabSwitchThreshold),
      );
    }

    // Keyboard pattern detection
    if (this.keyboardRepo) {
      const kbEvents = this.keyboardRepo.getEventsSince(since);
      if (kbEvents.length >= 10) {
        allPatterns.push(...detectKeyboardSequences(kbEvents));
      }
    }

    // Clipboard bridge detection
    if (this.clipboardRepo) {
      const cbEvents = this.clipboardRepo.getEventsSince(since);
      if (cbEvents.length >= 3) {
        allPatterns.push(...detectClipboardBridges(cbEvents));
      }
    }

    // File workflow detection
    if (this.fileRepo) {
      const fileEvents = this.fileRepo.getEventsSince(since);
      if (fileEvents.length >= 3) {
        allPatterns.push(...detectFileWorkflows(fileEvents));
      }
    }

    // Score and persist all patterns
    for (const pattern of allPatterns) {
      pattern.confidence = scorePattern(pattern, this.config);
      this.patternRepo.upsert(pattern);
    }

    // Compound pattern detection (runs on persisted patterns)
    const activePatterns = this.patternRepo.getActive();
    const compounds = detectCompoundPatterns(activePatterns);
    for (const compound of compounds) {
      this.patternRepo.upsert(compound);
    }
    allPatterns.push(...compounds);

    if (allPatterns.length > 0) {
      console.log(`[PatternDetector] Found ${allPatterns.length} patterns (${compounds.length} compound)`);
    }

    return allPatterns;
  }
}
