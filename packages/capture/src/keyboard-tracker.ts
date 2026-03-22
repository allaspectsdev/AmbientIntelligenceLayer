import type { KeyboardEvent as KbEvent, CaptureConfig, ExclusionRule } from '@ail/common';
import { shouldExclude } from '@ail/common';

export interface KeyboardWriter {
  writeKeyboardEvents(events: Omit<KbEvent, 'id' | 'createdAt'>[]): void;
}

/**
 * Tracks keyboard events using iohook (if available) or gracefully degrades.
 * iohook requires native compilation and macOS accessibility permissions.
 */
export class KeyboardTracker {
  private buffer: Omit<KbEvent, 'id' | 'createdAt'>[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private stopHook: (() => void) | null = null;
  private currentApp: string = '';

  constructor(
    private writer: KeyboardWriter,
    private config: CaptureConfig,
    private exclusions: ExclusionRule[]
  ) {}

  updateCurrentApp(appName: string): void {
    this.currentApp = appName;
  }

  async start(): Promise<boolean> {
    if (!this.config.keyboardEnabled) {
      console.log('[KeyboardTracker] Disabled');
      return false;
    }

    try {
      // Try to load iohook dynamically
      const iohook = await this.loadIoHook();
      if (iohook) {
        iohook.on('keydown', (event: { keycode: number; rawcode: number; shiftKey: boolean; altKey: boolean; ctrlKey: boolean; metaKey: boolean }) => {
          if (shouldExclude({ appName: this.currentApp, windowTitle: '', url: null }, this.exclusions)) return;

          const modifiers: string[] = [];
          if (event.shiftKey) modifiers.push('shift');
          if (event.altKey) modifiers.push('alt');
          if (event.ctrlKey) modifiers.push('ctrl');
          if (event.metaKey) modifiers.push('meta');

          this.buffer.push({
            timestamp: Date.now(),
            keyCode: String(event.rawcode),
            modifiers: modifiers.length > 0 ? modifiers.join('+') : null,
            eventType: 'keydown',
            appName: this.currentApp || null,
          });
        });

        iohook.start();
        this.stopHook = () => iohook.stop();
        console.log('[KeyboardTracker] Started (iohook)');
      } else {
        console.log('[KeyboardTracker] iohook not available — keyboard tracking disabled');
        console.log('[KeyboardTracker] To enable: npm install iohook and grant accessibility permissions');
        return false;
      }
    } catch (err) {
      console.log('[KeyboardTracker] Could not start:', (err as Error).message);
      return false;
    }

    // Flush buffer every 1s
    this.flushTimer = setInterval(() => this.flush(), 1000);
    return true;
  }

  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
    if (this.stopHook) {
      this.stopHook();
      this.stopHook = null;
    }
    console.log('[KeyboardTracker] Stopped');
  }

  private flush(): void {
    if (this.buffer.length === 0) return;
    const events = this.buffer.splice(0);
    this.writer.writeKeyboardEvents(events);
  }

  private async loadIoHook(): Promise<{ on: (event: string, cb: (e: unknown) => void) => void; start: () => void; stop: () => void } | null> {
    try {
      const mod = await import('iohook' as string);
      return mod.default || mod;
    } catch {
      try {
        const mod = await import('iohook-raub' as string);
        return mod.default || mod;
      } catch {
        return null;
      }
    }
  }
}
