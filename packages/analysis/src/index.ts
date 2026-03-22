import { DEFAULT_ANALYSIS_CONFIG } from '@ail/common';
import {
  getDatabase,
  closeDatabase,
  ActivityRepository,
  PatternRepository,
  SuggestionRepository,
  ScreenshotRepository,
  KeyboardEventRepository,
  ClipboardEventRepository,
  FileEventRepository,
} from '@ail/storage';
import { PatternDetector } from './pattern-detector.js';
import { ClaudeAnalyzer } from './claude-analyzer.js';
import { PatternLifecycleManager } from './pattern-lifecycle.js';
import { VisionAnalyzer } from './vision-analyzer.js';
import { ShortcutEngine } from './shortcut-engine.js';

async function main() {
  const config = { ...DEFAULT_ANALYSIS_CONFIG };

  console.log('[Analysis] Initializing...');
  const db = getDatabase('./data');

  const activityRepo = new ActivityRepository(db);
  const patternRepo = new PatternRepository(db);
  const suggestionRepo = new SuggestionRepository(db);
  const screenshotRepo = new ScreenshotRepository(db);
  const keyboardRepo = new KeyboardEventRepository(db);
  const clipboardRepo = new ClipboardEventRepository(db);
  const fileRepo = new FileEventRepository(db);

  const patternDetector = new PatternDetector(
    activityRepo, patternRepo, config, keyboardRepo, clipboardRepo, fileRepo
  );
  const claudeAnalyzer = new ClaudeAnalyzer(activityRepo, patternRepo, suggestionRepo, config);
  const lifecycleManager = new PatternLifecycleManager(patternRepo, suggestionRepo, config);
  const visionAnalyzer = new VisionAnalyzer(screenshotRepo, suggestionRepo, activityRepo, config);
  const shortcutEngine = new ShortcutEngine(activityRepo, suggestionRepo);

  const claudeAvailable = await claudeAnalyzer.isAvailable();
  console.log(`[Analysis] Claude coaching: ${claudeAvailable ? 'enabled' : 'disabled (no API key)'}`);

  // Run initial analysis
  console.log('[Analysis] Running initial pattern detection...');
  await patternDetector.detectAll();
  lifecycleManager.run();
  shortcutEngine.generateSuggestions();

  // Schedule periodic local analysis + lifecycle + shortcuts
  const localTimer = setInterval(async () => {
    try {
      await patternDetector.detectAll();
      lifecycleManager.run();
      shortcutEngine.generateSuggestions();
    } catch (err) {
      console.error('[Analysis] Local analysis error:', (err as Error).message);
    }
  }, config.analysisIntervalMs);

  console.log(`[Analysis] Local analysis every ${config.analysisIntervalMs / 60_000} minutes`);

  // Schedule Claude text coaching (if available)
  let claudeTimer: ReturnType<typeof setInterval> | null = null;
  if (claudeAvailable) {
    claudeTimer = setInterval(async () => {
      try {
        await claudeAnalyzer.analyze();
      } catch (err) {
        console.error('[Analysis] Claude text analysis error:', (err as Error).message);
      }
    }, config.claudeAnalysisIntervalMs);
    console.log(`[Analysis] Claude text coaching every ${config.claudeAnalysisIntervalMs / 60_000} minutes`);
  }

  // Schedule Claude Vision analysis (if available)
  let visionTimer: ReturnType<typeof setInterval> | null = null;
  if (claudeAvailable) {
    visionTimer = setInterval(async () => {
      try {
        await visionAnalyzer.analyzeBatch();
      } catch (err) {
        console.error('[Analysis] Vision analysis error:', (err as Error).message);
      }
    }, config.visionAnalysisIntervalMs);
    console.log(`[Analysis] Vision analysis every ${config.visionAnalysisIntervalMs / 60_000} minutes`);
  }

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[Analysis] Shutting down...');
    clearInterval(localTimer);
    if (claudeTimer) clearInterval(claudeTimer);
    if (visionTimer) clearInterval(visionTimer);
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
