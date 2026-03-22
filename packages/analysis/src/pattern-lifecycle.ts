import type { AnalysisConfig } from '@ail/common';
import type { PatternRepository, SuggestionRepository } from '@ail/storage';
import { scorePattern } from './confidence-scorer.js';

/**
 * Manages pattern lifecycle: aging, confidence updates, deactivation, and promotion.
 */
export class PatternLifecycleManager {
  constructor(
    private patternRepo: PatternRepository,
    private suggestionRepo: SuggestionRepository,
    private config: AnalysisConfig
  ) {}

  /**
   * Run full lifecycle: score → age → deactivate → promote
   */
  run(): { aged: number; deactivated: number; promoted: number } {
    const patterns = this.patternRepo.getActive();
    let aged = 0;
    let deactivated = 0;
    let promoted = 0;

    for (const pattern of patterns) {
      // Recalculate confidence
      const newConfidence = scorePattern(pattern, this.config);

      if (newConfidence !== pattern.confidence) {
        this.patternRepo.updateConfidence(pattern.id!, newConfidence);
        aged++;
      }

      // Deactivate patterns below threshold
      if (newConfidence < this.config.confidenceThreshold * 0.5) {
        this.patternRepo.deactivateBelowConfidence(this.config.confidenceThreshold * 0.5);
        deactivated++;
      }

      // Promote high-confidence patterns: generate automation suggestion
      if (newConfidence >= this.config.promotionConfidence && pattern.type !== 'compound') {
        this.generatePromotionSuggestion(pattern.id!, pattern.description, newConfidence);
        promoted++;
      }
    }

    if (aged > 0 || deactivated > 0 || promoted > 0) {
      console.log(`[Lifecycle] Scored: ${aged}, Deactivated: ${deactivated}, Promoted: ${promoted}`);
    }

    return { aged, deactivated, promoted };
  }

  private generatePromotionSuggestion(patternId: number, description: string, confidence: number): void {
    // Check if we already have a promotion suggestion for this pattern
    const existing = this.suggestionRepo.getByStatus('new');
    const alreadySuggested = existing.some(
      s => s.patternId === patternId && s.category === 'automation'
    );

    if (!alreadySuggested) {
      this.suggestionRepo.insert({
        patternId,
        source: 'heuristic',
        category: 'automation',
        title: `Ready for automation (${Math.round(confidence * 100)}% confidence)`,
        body: `Pattern: ${description}. This pattern has high confidence and consistency — consider generating an automation.`,
        priority: Math.round(confidence * 10),
        status: 'new',
        userFeedback: null,
      });
    }
  }
}
