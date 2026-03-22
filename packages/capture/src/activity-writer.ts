import type { ActivityEvent, Screenshot, KeyboardEvent as KbEvent, MouseEvent as MEvent, ClipboardEvent as CbEvent, FileEvent as FEvent } from '@ail/common';
import type { ActivityRepository, ScreenshotRepository, KeyboardEventRepository, MouseEventRepository, ClipboardEventRepository, FileEventRepository } from '@ail/storage';
import type { KeyboardWriter } from './keyboard-tracker.js';
import type { MouseWriter } from './mouse-tracker.js';
import type { ClipboardWriter } from './clipboard-monitor.js';
import type { FileWriter } from './file-watcher.js';

export class ActivityWriter implements KeyboardWriter, MouseWriter, ClipboardWriter, FileWriter {
  constructor(
    private activityRepo: ActivityRepository,
    private screenshotRepo: ScreenshotRepository,
    private keyboardRepo?: KeyboardEventRepository,
    private mouseRepo?: MouseEventRepository,
    private clipboardRepo?: ClipboardEventRepository,
    private fileRepo?: FileEventRepository,
  ) {}

  writeActivity(event: Omit<ActivityEvent, 'id' | 'createdAt'>): number {
    return this.activityRepo.insert(event);
  }

  updateDuration(eventId: number, durationMs: number): void {
    this.activityRepo.updateDuration(eventId, durationMs);
  }

  writeScreenshot(screenshot: Omit<Screenshot, 'id' | 'createdAt'>): void {
    this.screenshotRepo.insert(screenshot);
  }

  writeKeyboardEvents(events: Omit<KbEvent, 'id' | 'createdAt'>[]): void {
    this.keyboardRepo?.insertBatch(events);
  }

  writeMouseEvents(events: Omit<MEvent, 'id' | 'createdAt'>[]): void {
    this.mouseRepo?.insertBatch(events);
  }

  writeClipboardEvent(event: Omit<CbEvent, 'id' | 'createdAt'>): void {
    this.clipboardRepo?.insert(event);
  }

  writeFileEvent(event: Omit<FEvent, 'id' | 'createdAt'>): void {
    this.fileRepo?.insert(event);
  }
}
