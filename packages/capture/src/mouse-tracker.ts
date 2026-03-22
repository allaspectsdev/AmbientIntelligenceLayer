import type { MouseEvent as MEvent, CaptureConfig, ExclusionRule } from '@ail/common';
import { shouldExclude } from '@ail/common';

export interface MouseWriter {
  writeMouseEvents(events: Omit<MEvent, 'id' | 'createdAt'>[]): void;
}

/**
 * Tracks mouse click and scroll events using iohook (if available).
 * Does NOT track mouse movement to avoid excessive noise.
 */
export class MouseTracker {
  private buffer: Omit<MEvent, 'id' | 'createdAt'>[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private stopHook: (() => void) | null = null;
  private currentApp: string = '';

  constructor(
    private writer: MouseWriter,
    private config: CaptureConfig,
    private exclusions: ExclusionRule[]
  ) {}

  updateCurrentApp(appName: string): void {
    this.currentApp = appName;
  }

  async start(): Promise<boolean> {
    if (!this.config.mouseEnabled) {
      console.log('[MouseTracker] Disabled');
      return false;
    }

    try {
      const iohook = await this.loadIoHook();
      if (iohook) {
        iohook.on('mouseclick', (event: { x: number; y: number; button: number }) => {
          if (shouldExclude({ appName: this.currentApp, windowTitle: '', url: null }, this.exclusions)) return;
          this.buffer.push({
            timestamp: Date.now(),
            x: event.x,
            y: event.y,
            button: event.button,
            eventType: 'click',
            appName: this.currentApp || null,
          });
        });

        iohook.on('mousewheel', (event: { x: number; y: number }) => {
          if (shouldExclude({ appName: this.currentApp, windowTitle: '', url: null }, this.exclusions)) return;
          this.buffer.push({
            timestamp: Date.now(),
            x: event.x,
            y: event.y,
            button: 0,
            eventType: 'scroll',
            appName: this.currentApp || null,
          });
        });

        iohook.start();
        this.stopHook = () => iohook.stop();
        console.log('[MouseTracker] Started (iohook)');
      } else {
        console.log('[MouseTracker] iohook not available — mouse tracking disabled');
        return false;
      }
    } catch (err) {
      console.log('[MouseTracker] Could not start:', (err as Error).message);
      return false;
    }

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
    console.log('[MouseTracker] Stopped');
  }

  private flush(): void {
    if (this.buffer.length === 0) return;
    const events = this.buffer.splice(0);
    this.writer.writeMouseEvents(events);
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
