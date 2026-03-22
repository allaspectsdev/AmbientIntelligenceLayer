import type { ActivityEvent, Screenshot } from '@ail/common';
import type { ActivityRepository, ScreenshotRepository } from '@ail/storage';

export class ActivityWriter {
  constructor(
    private activityRepo: ActivityRepository,
    private screenshotRepo: ScreenshotRepository
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
}
