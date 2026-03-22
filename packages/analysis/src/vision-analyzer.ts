import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AnalysisConfig, Suggestion } from '@ail/common';
import type { ScreenshotRepository, SuggestionRepository, ActivityRepository } from '@ail/storage';
import { getAnthropicClient } from './anthropic-client.js';

const VISION_SYSTEM_PROMPT = `You are the visual analysis component of the Ambient Intelligence Layer. You receive screenshots of a user's computer and describe what they are doing.

For each screenshot, provide:
1. What application is visible
2. What the user appears to be working on
3. What task or workflow they seem to be performing
4. Any potential inefficiencies you notice (e.g., manual data entry that could be automated)
5. Suggestions for improving their workflow

Respond with a JSON object:
{
  "activity": "brief description of what user is doing",
  "application": "main app visible",
  "workflow": "description of the workflow/task",
  "suggestions": [
    { "category": "coaching"|"automation"|"focus", "title": "short title", "body": "suggestion detail", "priority": 1-10 }
  ]
}

Return ONLY the JSON, no other text.`;

export class VisionAnalyzer {
  constructor(
    private screenshotRepo: ScreenshotRepository,
    private suggestionRepo: SuggestionRepository,
    private activityRepo: ActivityRepository,
    private config: AnalysisConfig,
    private dataDir: string = './data'
  ) {}

  async analyzeBatch(): Promise<Suggestion[]> {
    const client = await getAnthropicClient();
    if (!client) return [];

    try {
      // Get recent screenshots
      const now = Date.now();
      const screenshots = this.screenshotRepo.getByRange(
        { start: now - this.config.visionAnalysisIntervalMs, end: now },
        this.config.visionBatchSize
      );

      if (screenshots.length === 0) return [];

      // Check if there's been meaningful activity (not idle)
      const recentActivity = this.activityRepo.getEventsSince(now - this.config.visionAnalysisIntervalMs);
      if (recentActivity.length < 3) return []; // Too idle to analyze

      // Build image content blocks
      const imageBlocks: Array<{ type: string; source: { type: string; media_type: string; data: string } }> = [];

      for (const ss of screenshots.slice(0, 3)) { // Max 3 to control cost
        const fullPath = join(this.dataDir, ss.filePath);
        try {
          const data = readFileSync(fullPath);
          const base64 = data.toString('base64');
          const mediaType = ss.filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
          imageBlocks.push({
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          });
        } catch {
          // Screenshot file may have been cleaned up
        }
      }

      if (imageBlocks.length === 0) return [];

      const response = await client.messages.create({
        model: this.config.claudeModelId,
        max_tokens: 1024,
        system: VISION_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            ...imageBlocks,
            { type: 'text', text: `Analyze these ${imageBlocks.length} screenshots taken over the last ${Math.round(this.config.visionAnalysisIntervalMs / 60_000)} minutes. What is the user doing?` },
          ],
        }],
      }) as { content: Array<{ type: string; text?: string }> };

      const textBlock = response.content.find((b: { type: string }) => b.type === 'text');
      if (!textBlock || !('text' in textBlock)) return [];

      return this.parseSuggestions(textBlock.text as string);
    } catch (err) {
      console.error('[VisionAnalyzer] Error:', (err as Error).message);
      return [];
    }
  }

  private parseSuggestions(text: string): Suggestion[] {
    try {
      const json = text.match(/\{[\s\S]*\}/);
      if (!json) return [];

      const result = JSON.parse(json[0]) as {
        suggestions?: Array<{ category?: string; title?: string; body?: string; priority?: number }>;
        activity?: string;
      };

      const suggestions: Suggestion[] = [];

      if (result.activity) {
        // Store the activity description as a focus suggestion
        suggestions.push({
          patternId: null,
          source: 'claude_vision',
          category: 'focus',
          title: 'Visual Activity Analysis',
          body: result.activity,
          priority: 3,
          status: 'new',
          userFeedback: null,
        });
        this.suggestionRepo.insert(suggestions[0]);
      }

      for (const item of result.suggestions || []) {
        if (!item.title || !item.body) continue;
        const suggestion: Suggestion = {
          patternId: null,
          source: 'claude_vision',
          category: (['coaching', 'automation', 'focus'].includes(item.category || '') ? item.category as Suggestion['category'] : 'coaching'),
          title: item.title.substring(0, 100),
          body: item.body.substring(0, 500),
          priority: Math.min(10, Math.max(1, item.priority || 5)),
          status: 'new',
          userFeedback: null,
        };
        this.suggestionRepo.insert(suggestion);
        suggestions.push(suggestion);
      }

      if (suggestions.length > 0) {
        console.log(`[VisionAnalyzer] Generated ${suggestions.length} suggestions from ${text.length} chars`);
      }

      return suggestions;
    } catch (err) {
      console.error('[VisionAnalyzer] Parse error:', (err as Error).message);
      return [];
    }
  }
}
