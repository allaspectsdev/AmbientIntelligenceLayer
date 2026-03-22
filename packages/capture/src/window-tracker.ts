import { execSync } from 'node:child_process';
import type { WindowInfo, CaptureConfig, ExclusionRule } from '@ail/common';
import { shouldExclude } from '@ail/common';
import type { ActivityWriter } from './activity-writer.js';

/**
 * Gets active window info using macOS native methods.
 * Tries get-windows first (requires screen recording permission),
 * falls back to AppleScript (works without special permissions).
 */
async function getActiveWindow(): Promise<WindowInfo | null> {
  // Try get-windows first
  try {
    const { activeWindow } = await import('get-windows');
    const win = await activeWindow();
    if (win) {
      return {
        appName: win.owner.name,
        windowTitle: win.title,
        url: 'url' in win ? (win as { url?: string }).url ?? null : null,
        bundleId: 'bundleId' in win.owner
          ? (win.owner as { bundleId?: string }).bundleId ?? null
          : null,
        processId: win.owner.processId,
      };
    }
  } catch {
    // Fall through to AppleScript fallback
  }

  // AppleScript fallback — works without screen recording permission
  try {
    const script = `
      tell application "System Events"
        set frontApp to first application process whose frontmost is true
        set appName to name of frontApp
        set bundleId to bundle identifier of frontApp
        try
          set winTitle to name of front window of frontApp
        on error
          set winTitle to ""
        end try
        return appName & "|||" & winTitle & "|||" & bundleId
      end tell
    `;
    const result = execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      encoding: 'utf-8',
      timeout: 3000,
    }).trim();

    const [appName, windowTitle, bundleId] = result.split('|||');
    if (appName) {
      return {
        appName,
        windowTitle: windowTitle || appName,
        url: null,
        bundleId: bundleId || null,
        processId: 0,
      };
    }
  } catch {
    // Both methods failed
  }

  return null;
}

export class WindowTracker {
  private lastWindow: WindowInfo | null = null;
  private lastEventId: number | null = null;
  private lastSwitchTime: number = Date.now();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private writer: ActivityWriter,
    private config: CaptureConfig,
    private exclusions: ExclusionRule[]
  ) {}

  async start(): Promise<void> {
    console.log(`[WindowTracker] Starting (poll every ${this.config.windowPollIntervalMs}ms)`);
    await this.poll();
    this.timer = setInterval(() => this.poll(), this.config.windowPollIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.finalizeCurrent();
    console.log('[WindowTracker] Stopped');
  }

  private async poll(): Promise<void> {
    try {
      const current = await getActiveWindow();
      if (!current) return;

      // Check if window changed
      if (
        this.lastWindow &&
        this.lastWindow.appName === current.appName &&
        this.lastWindow.windowTitle === current.windowTitle
      ) {
        return;
      }

      // Finalize previous event duration
      this.finalizeCurrent();

      // Check exclusion rules before recording
      if (shouldExclude(current, this.exclusions)) {
        this.lastWindow = current;
        this.lastEventId = null;
        this.lastSwitchTime = Date.now();
        return;
      }

      // Record new event
      const now = Date.now();
      this.lastEventId = this.writer.writeActivity({
        timestamp: now,
        appName: current.appName,
        windowTitle: current.windowTitle,
        url: current.url,
        bundleId: current.bundleId,
        durationMs: null,
      });

      this.lastWindow = current;
      this.lastSwitchTime = now;
    } catch (err) {
      if (err instanceof Error && !err.message.includes('Could not find')) {
        console.error('[WindowTracker] Poll error:', err.message);
      }
    }
  }

  private finalizeCurrent(): void {
    if (this.lastEventId !== null) {
      const duration = Date.now() - this.lastSwitchTime;
      this.writer.updateDuration(this.lastEventId, duration);
    }
  }
}
