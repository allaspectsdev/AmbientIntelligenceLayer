import type Database from 'better-sqlite3';
import { ActivityRepository, PatternRepository, AutomationRepository, SuggestionRepository } from '@ail/storage';

/**
 * MCP Server exposing AIL capabilities as tools.
 * Uses @modelcontextprotocol/sdk for protocol compliance.
 */
export class AilMcpServer {
  private activityRepo: ActivityRepository;
  private patternRepo: PatternRepository;
  private autoRepo: AutomationRepository;
  private suggestionRepo: SuggestionRepository;

  constructor(db: Database.Database) {
    this.activityRepo = new ActivityRepository(db);
    this.patternRepo = new PatternRepository(db);
    this.autoRepo = new AutomationRepository(db);
    this.suggestionRepo = new SuggestionRepository(db);
  }

  async start(): Promise<void> {
    try {
      const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
      const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');

      const server = new McpServer({
        name: 'ambient-intelligence-layer',
        version: '0.2.0',
      });

      // Register tools
      server.tool('get_activity_summary', 'Get a summary of recent user activity', {}, async () => {
        const now = Date.now();
        const range = { start: now - 24 * 60 * 60_000, end: now };
        const apps = this.activityRepo.getAppUsage(range);
        const total = this.activityRepo.getTotalTrackedMs(range);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ totalTrackedMs: total, topApps: apps.slice(0, 10) }, null, 2),
          }],
        };
      });

      server.tool('get_patterns', 'Get detected behavioral patterns', {}, async () => {
        const patterns = this.patternRepo.getActive();
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(patterns, null, 2),
          }],
        };
      });

      server.tool('get_automations', 'Get available automations', {}, async () => {
        const automations = this.autoRepo.getAll();
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(automations, null, 2),
          }],
        };
      });

      server.tool('create_suggestion', 'Create a coaching suggestion for the user', {
        title: { type: 'string', description: 'Suggestion title' },
        body: { type: 'string', description: 'Suggestion body' },
        category: { type: 'string', description: 'coaching, automation, or focus' },
      }, async (params: { title: string; body: string; category: string }) => {
        this.suggestionRepo.insert({
          patternId: null,
          source: 'claude',
          category: (params.category || 'coaching') as 'coaching' | 'automation' | 'focus',
          title: params.title,
          body: params.body,
          priority: 5,
          status: 'new',
          userFeedback: null,
        });
        return { content: [{ type: 'text' as const, text: 'Suggestion created' }] };
      });

      // Start with stdio transport
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.log('[MCP] Server started on stdio');
    } catch (err) {
      console.log('[MCP] Could not start:', (err as Error).message);
      console.log('[MCP] MCP server requires @modelcontextprotocol/sdk');
    }
  }
}
