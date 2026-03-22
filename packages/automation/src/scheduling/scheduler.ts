import type { AutomationScheduleRepository, AutomationRepository, AutomationExecutionRepository } from '@ail/storage';
import { AutomationExecutor } from '../executor.js';

/**
 * Cron-like scheduler for Tier 1 hardcoded automations.
 * Polls every 60 seconds for due schedules, executes, and computes next run.
 * Pure timer-based — no external dependencies.
 */
export class AutomationScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private executor: AutomationExecutor;

  constructor(
    private scheduleRepo: AutomationScheduleRepository,
    private automationRepo: AutomationRepository,
    execRepo: AutomationExecutionRepository,
  ) {
    this.executor = new AutomationExecutor(execRepo);
  }

  start(): void {
    console.log('[Scheduler] Starting (poll every 60s)');
    this.timer = setInterval(() => this.tick(), 60_000);
    // Run immediately on start
    this.tick();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[Scheduler] Stopped');
  }

  private async tick(): Promise<void> {
    try {
      const due = this.scheduleRepo.getDueSchedules(Date.now());
      if (due.length === 0) return;

      for (const schedule of due) {
        const automation = this.automationRepo.getById(schedule.automationId);
        if (!automation || automation.status === 'disabled') continue;

        console.log(`[Scheduler] Executing automation #${automation.id}: ${automation.name}`);

        try {
          await this.executor.execute(automation);
        } catch (err) {
          console.error(`[Scheduler] Execution failed for #${automation.id}:`, (err as Error).message);
        }

        // Update schedule timestamps
        const now = Date.now();
        const nextRun = computeNextRun(schedule.cronExpression, now);
        this.scheduleRepo.update(schedule.id!, {
          lastRunAt: now,
          nextRunAt: nextRun,
        });
      }
    } catch (err) {
      console.error('[Scheduler] Tick error:', (err as Error).message);
    }
  }
}

/**
 * Simple next-run calculator for common cron patterns.
 * Supports: * /N (every N), specific values. Fields: min hour dom month dow
 */
function computeNextRun(cronExpression: string, fromMs: number): number {
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length < 5) return fromMs + 60_000; // Invalid, default to 1 min

  // Simple interval parsing for common cases
  const [min] = parts;

  // Every N minutes: */5, */10, */15, etc.
  if (min.startsWith('*/')) {
    const intervalMinutes = parseInt(min.substring(2), 10);
    if (!isNaN(intervalMinutes) && intervalMinutes > 0) {
      return fromMs + intervalMinutes * 60_000;
    }
  }

  // Every hour: 0 * * * *
  if (min === '0' && parts[1] === '*') {
    return fromMs + 60 * 60_000;
  }

  // Every day at specific time: M H * * *
  const minute = parseInt(min, 10);
  const hour = parseInt(parts[1], 10);
  if (!isNaN(minute) && !isNaN(hour) && parts[2] === '*') {
    const next = new Date(fromMs);
    next.setHours(hour, minute, 0, 0);
    if (next.getTime() <= fromMs) next.setDate(next.getDate() + 1);
    return next.getTime();
  }

  // Weekday schedule: M H * * 1-5
  if (!isNaN(minute) && !isNaN(hour) && parts[4] === '1-5') {
    const next = new Date(fromMs);
    next.setHours(hour, minute, 0, 0);
    if (next.getTime() <= fromMs) next.setDate(next.getDate() + 1);
    // Skip to next weekday
    while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
    return next.getTime();
  }

  // Monthly: M H D * *
  const dom = parseInt(parts[2], 10);
  if (!isNaN(minute) && !isNaN(hour) && !isNaN(dom)) {
    const next = new Date(fromMs);
    next.setDate(dom);
    next.setHours(hour, minute, 0, 0);
    if (next.getTime() <= fromMs) next.setMonth(next.getMonth() + 1);
    return next.getTime();
  }

  // Unsupported expression — log warning and default to 1 hour
  console.warn(`[Scheduler] Unsupported cron expression "${cronExpression}" — defaulting to 1 hour interval`);
  return fromMs + 60 * 60_000;
}
