import { createHash } from 'node:crypto';
import type { ClipboardEvent as CbEvent, CaptureConfig, ExclusionRule } from '@ail/common';

export interface ClipboardWriter {
  writeClipboardEvent(event: Omit<CbEvent, 'id' | 'createdAt'>): void;
}

/**
 * Monitors clipboard changes by polling.
 * Stores content hash (not full content) for privacy.
 * Tracks source app (app active when copy happened) and target app (app active when paste happens).
 */
export class ClipboardMonitor {
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastHash: string | null = null;
  private lastCopyApp: string | null = null;
  private currentApp: string = '';

  constructor(
    private writer: ClipboardWriter,
    private _config: CaptureConfig,
    private _exclusions: ExclusionRule[]
  ) {}

  updateCurrentApp(appName: string): void {
    this.currentApp = appName;
  }

  async start(): Promise<boolean> {
    if (!this._config.clipboardEnabled) {
      console.log('[ClipboardMonitor] Disabled');
      return false;
    }

    console.log('[ClipboardMonitor] Starting (poll every 500ms)');
    this.timer = setInterval(() => this.poll(), 500);
    return true;
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[ClipboardMonitor] Stopped');
  }

  private async poll(): Promise<void> {
    try {
      const { default: clipboardy } = await import('clipboardy');
      const text = await clipboardy.read();
      if (!text) return;

      const hash = createHash('sha256').update(text.substring(0, 1024)).digest('hex');

      if (hash === this.lastHash) return;

      // New clipboard content detected
      const preview = text.substring(0, 100).replace(/[\n\r\t]/g, ' ');

      this.writer.writeClipboardEvent({
        timestamp: Date.now(),
        contentType: 'text',
        contentHash: hash,
        sourceApp: this.currentApp || null,
        targetApp: null, // Will be inferred by analysis layer
        contentPreview: preview,
      });

      this.lastCopyApp = this.currentApp;
      this.lastHash = hash;
    } catch {
      // Clipboard may be empty or inaccessible
    }
  }
}
