import type { AnalysisConfig, Suggestion, TimeRange, AppUsageSummary, Pattern } from '@ail/common';
import type { ActivityRepository, PatternRepository, SuggestionRepository } from '@ail/storage';

const COACHING_SYSTEM_PROMPT = `You are a productivity coach embedded in the Ambient Intelligence Layer (AIL). You analyze computer activity data and provide actionable coaching suggestions.

Your role:
- Identify inefficiencies, repetitive patterns, and time sinks
- Suggest keyboard shortcuts, workflow optimizations, and better tool usage
- Be specific and actionable — reference the actual apps and patterns you see
- Be encouraging, not judgmental
- Prioritize suggestions by potential time savings

Respond with a JSON array of suggestions. Each suggestion should have:
- "category": one of "coaching", "automation", "focus"
- "title": short title (under 60 chars)
- "body": detailed suggestion (1-3 sentences)
- "priority": 1-10 (10 = highest impact)

Return ONLY the JSON array, no other text.`;

export class ClaudeAnalyzer {
  private anthropic: { messages: { create: (params: unknown) => Promise<unknown> } } | null = null;

  constructor(
    private activityRepo: ActivityRepository,
    private patternRepo: PatternRepository,
    private suggestionRepo: SuggestionRepository,
    private config: AnalysisConfig
  ) {}

  private async getClient() {
    if (this.anthropic) return this.anthropic;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;

    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      this.anthropic = new Anthropic({ apiKey }) as typeof this.anthropic;
      return this.anthropic;
    } catch {
      console.log('[ClaudeAnalyzer] @anthropic-ai/sdk not available');
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!(process.env.ANTHROPIC_API_KEY);
  }

  async analyze(): Promise<Suggestion[]> {
    const client = await this.getClient();
    if (!client) {
      console.log('[ClaudeAnalyzer] Skipped — no API key configured');
      return [];
    }

    try {
      const now = Date.now();
      const range: TimeRange = {
        start: now - this.config.claudeAnalysisIntervalMs,
        end: now,
      };

      const summary = this.buildActivitySummary(range);
      if (!summary) return [];

      const response = await client.messages.create({
        model: this.config.claudeModelId,
        max_tokens: 1024,
        system: COACHING_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: summary }],
      }) as { content: Array<{ type: string; text?: string }> };

      const textBlock = response.content.find((b: { type: string }) => b.type === 'text');
      if (!textBlock || !('text' in textBlock)) return [];

      return this.parseSuggestions(textBlock.text as string);
    } catch (err) {
      console.error('[ClaudeAnalyzer] Error:', (err as Error).message);
      return [];
    }
  }

  private buildActivitySummary(range: TimeRange): string | null {
    const appUsage = this.activityRepo.getAppUsage(range);
    const patterns = this.patternRepo.getActive();
    const totalMs = this.activityRepo.getTotalTrackedMs(range);

    if (totalMs < 60_000) return null; // Need at least 1 min of data

    const lines: string[] = [
      `Activity Summary for the last ${Math.round(this.config.claudeAnalysisIntervalMs / 60_000)} minutes:`,
      `Total tracked time: ${Math.round(totalMs / 60_000)} minutes`,
      '',
      'App Usage (by time):',
      ...appUsage.slice(0, 10).map(
        (a: AppUsageSummary) => `  - ${a.appName}: ${Math.round(a.totalDurationMs / 60_000)}min (${a.percentage}%) — ${a.eventCount} sessions`
      ),
    ];

    if (patterns.length > 0) {
      lines.push('', 'Detected Patterns:');
      for (const p of patterns.slice(0, 10)) {
        lines.push(`  - [${p.type}] ${p.description}`);
      }
    }

    const recentEvents = this.activityRepo.getEventsSince(range.start);
    if (recentEvents.length > 5) {
      lines.push('', `Recent activity flow (${recentEvents.length} window switches):`);
      const last20 = recentEvents.slice(-20);
      for (const e of last20) {
        const dur = e.durationMs ? `${Math.round(e.durationMs / 1000)}s` : '?';
        lines.push(`  ${new Date(e.timestamp).toLocaleTimeString()} — ${e.appName}: ${e.windowTitle.substring(0, 80)} (${dur})`);
      }
    }

    return lines.join('\n');
  }

  private parseSuggestions(text: string): Suggestion[] {
    try {
      // Extract JSON array from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const items = JSON.parse(jsonMatch[0]) as Array<{
        category?: string;
        title?: string;
        body?: string;
        priority?: number;
      }>;

      const suggestions: Suggestion[] = [];

      for (const item of items) {
        if (!item.title || !item.body) continue;

        const suggestion: Suggestion = {
          patternId: null,
          source: 'claude',
          category: (['coaching', 'automation', 'focus'].includes(item.category || '')
            ? item.category as Suggestion['category']
            : 'coaching'),
          title: item.title.substring(0, 100),
          body: item.body.substring(0, 500),
          priority: Math.min(10, Math.max(1, item.priority || 5)),
          status: 'new',
          userFeedback: null,
        };

        this.suggestionRepo.insert(suggestion);
        suggestions.push(suggestion);
      }

      console.log(`[ClaudeAnalyzer] Generated ${suggestions.length} suggestions`);
      return suggestions;
    } catch (err) {
      console.error('[ClaudeAnalyzer] Parse error:', (err as Error).message);
      return [];
    }
  }
}
