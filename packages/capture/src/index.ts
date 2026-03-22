import { DEFAULT_CAPTURE_CONFIG } from '@ail/common';
import {
  getDatabase,
  closeDatabase,
  ActivityRepository,
  ScreenshotRepository,
  KeyboardEventRepository,
  MouseEventRepository,
  ClipboardEventRepository,
  FileEventRepository,
  ConfigRepository,
} from '@ail/storage';
import { ActivityWriter } from './activity-writer.js';
import { WindowTracker } from './window-tracker.js';
import { ScreenshotCapture } from './screenshot.js';
import { KeyboardTracker } from './keyboard-tracker.js';
import { MouseTracker } from './mouse-tracker.js';
import { ClipboardMonitor } from './clipboard-monitor.js';
import { FileWatcher } from './file-watcher.js';

async function main() {
  const config = { ...DEFAULT_CAPTURE_CONFIG };

  console.log('[Capture] Initializing...');
  console.log(`[Capture] Data directory: ${config.dataDir}`);

  const db = getDatabase(config.dataDir);
  const configRepo = new ConfigRepository(db);

  const writer = new ActivityWriter(
    new ActivityRepository(db),
    new ScreenshotRepository(db),
    new KeyboardEventRepository(db),
    new MouseEventRepository(db),
    new ClipboardEventRepository(db),
    new FileEventRepository(db),
  );

  // Load exclusion rules from DB
  const exclusions = configRepo.getExclusions();
  console.log(`[Capture] Loaded ${exclusions.length} exclusion rules`);

  // Initialize all trackers
  const windowTracker = new WindowTracker(writer, config, exclusions);
  const screenshotCapture = new ScreenshotCapture(writer, config);
  const keyboardTracker = new KeyboardTracker(writer, config, exclusions);
  const mouseTracker = new MouseTracker(writer, config, exclusions);
  const clipboardMonitor = new ClipboardMonitor(writer, config, exclusions);
  const fileWatcher = new FileWatcher(writer, config, exclusions);

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[Capture] Shutting down...');
    windowTracker.stop();
    screenshotCapture.stop();
    keyboardTracker.stop();
    mouseTracker.stop();
    clipboardMonitor.stop();
    fileWatcher.stop();
    closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Start all services
  await windowTracker.start();
  await screenshotCapture.start();
  await keyboardTracker.start();
  await mouseTracker.start();
  await clipboardMonitor.start();
  await fileWatcher.start();

  console.log('[Capture] Running. Press Ctrl+C to stop.');
}

main().catch(err => {
  console.error('[Capture] Fatal error:', err);
  process.exit(1);
});
