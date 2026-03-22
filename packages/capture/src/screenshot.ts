import { join } from 'node:path';
import { mkdirSync, statSync } from 'node:fs';
import type { CaptureConfig } from '@ail/common';
import type { ActivityWriter } from './activity-writer.js';

export class ScreenshotCapture {
  private timer: ReturnType<typeof setInterval> | null = null;
  private currentApp: string | null = null;
  private currentTitle: string | null = null;

  constructor(
    private writer: ActivityWriter,
    private config: CaptureConfig
  ) {}

  /** Called by WindowTracker on window change to keep context current */
  updateContext(appName: string, windowTitle: string): void {
    this.currentApp = appName;
    this.currentTitle = windowTitle;
  }

  async start(): Promise<void> {
    if (!this.config.screenshotsEnabled) {
      console.log('[ScreenshotCapture] Disabled');
      return;
    }
    console.log(`[ScreenshotCapture] Starting (every ${this.config.screenshotIntervalMs}ms)`);
    this.timer = setInterval(() => this.capture(), this.config.screenshotIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[ScreenshotCapture] Stopped');
  }

  private async capture(): Promise<void> {
    try {
      const screenshot = await import('screenshot-desktop');
      const now = new Date();
      const dateDir = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
      const ms = String(now.getMilliseconds()).padStart(3, '0');

      const dir = join(this.config.dataDir, 'screenshots', dateDir);
      mkdirSync(dir, { recursive: true });

      const filename = `${timeStr}-${ms}.${this.config.screenshotFormat}`;
      const filePath = join(dir, filename);

      await screenshot.default({ filename: filePath, format: this.config.screenshotFormat });

      let fileSize: number | null = null;
      try {
        fileSize = statSync(filePath).size;
      } catch {
        // File size is optional
      }

      // Store relative path from data dir
      const relativePath = join('screenshots', dateDir, filename);

      this.writer.writeScreenshot({
        timestamp: now.getTime(),
        filePath: relativePath,
        appName: this.currentApp,
        windowTitle: this.currentTitle,
        fileSizeBytes: fileSize,
      });
    } catch (err) {
      console.error('[ScreenshotCapture] Error:', (err as Error).message);
    }
  }
}
