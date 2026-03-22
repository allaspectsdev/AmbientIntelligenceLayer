import { DEFAULT_CAPTURE_CONFIG } from '@ail/common';
import {
  getDatabase,
  closeDatabase,
  ActivityRepository,
  ScreenshotRepository,
  ConfigRepository,
} from '@ail/storage';
import { ActivityWriter } from './activity-writer.js';
import { WindowTracker } from './window-tracker.js';
import { ScreenshotCapture } from './screenshot.js';

async function main() {
  const config = { ...DEFAULT_CAPTURE_CONFIG };

  console.log('[Capture] Initializing...');
  console.log(`[Capture] Data directory: ${config.dataDir}`);

  const db = getDatabase(config.dataDir);
  const activityRepo = new ActivityRepository(db);
  const screenshotRepo = new ScreenshotRepository(db);
  const configRepo = new ConfigRepository(db);

  const writer = new ActivityWriter(activityRepo, screenshotRepo);

  // Load exclusion rules from DB
  const exclusions = configRepo.getExclusions();
  console.log(`[Capture] Loaded ${exclusions.length} exclusion rules`);

  const screenshotCapture = new ScreenshotCapture(writer, config);
  const windowTracker = new WindowTracker(writer, config, exclusions);

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[Capture] Shutting down...');
    windowTracker.stop();
    screenshotCapture.stop();
    closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Start services
  await windowTracker.start();
  await screenshotCapture.start();

  console.log('[Capture] Running. Press Ctrl+C to stop.');
}

main().catch(err => {
  console.error('[Capture] Fatal error:', err);
  process.exit(1);
});
