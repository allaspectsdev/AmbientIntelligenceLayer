import { DEFAULT_ANALYSIS_CONFIG } from '@ail/common';
import {
  getDatabase,
  closeDatabase,
  ActivityRepository,
  PatternRepository,
  SuggestionRepository,
} from '@ail/storage';
import { PatternDetector } from './pattern-detector.js';
import { ClaudeAnalyzer } from './claude-analyzer.js';

async function main() {
  const config = { ...DEFAULT_ANALYSIS_CONFIG };

  console.log('[Analysis] Initializing...');
  const db = getDatabase('./data');

  const activityRepo = new ActivityRepository(db);
  const patternRepo = new PatternRepository(db);
  const suggestionRepo = new SuggestionRepository(db);

  const patternDetector = new PatternDetector(activityRepo, patternRepo, config);
  const claudeAnalyzer = new ClaudeAnalyzer(activityRepo, patternRepo, suggestionRepo, config);

  const claudeAvailable = await claudeAnalyzer.isAvailable();
  console.log(`[Analysis] Claude coaching: ${claudeAvailable ? 'enabled' : 'disabled (no API key)'}`);

  // Run initial analysis
  console.log('[Analysis] Running initial pattern detection...');
  await patternDetector.detectAll();

  // Schedule periodic local analysis
  const localTimer = setInterval(async () => {
    try {
      await patternDetector.detectAll();
    } catch (err) {
      console.error('[Analysis] Local analysis error:', (err as Error).message);
    }
  }, config.analysisIntervalMs);

  console.log(`[Analysis] Local analysis every ${config.analysisIntervalMs / 60_000} minutes`);

  // Schedule Claude analysis (if available)
  let claudeTimer: ReturnType<typeof setInterval> | null = null;
  if (claudeAvailable) {
    claudeTimer = setInterval(async () => {
      try {
        await claudeAnalyzer.analyze();
      } catch (err) {
        console.error('[Analysis] Claude analysis error:', (err as Error).message);
      }
    }, config.claudeAnalysisIntervalMs);

    console.log(`[Analysis] Claude analysis every ${config.claudeAnalysisIntervalMs / 60_000} minutes`);
  }

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[Analysis] Shutting down...');
    clearInterval(localTimer);
    if (claudeTimer) clearInterval(claudeTimer);
    closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  console.log('[Analysis] Running. Press Ctrl+C to stop.');
}

main().catch(err => {
  console.error('[Analysis] Fatal error:', err);
  process.exit(1);
});
