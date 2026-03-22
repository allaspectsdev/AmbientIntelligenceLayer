import type { CaptureConfig, AnalysisConfig } from './types.js';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const DEFAULT_CAPTURE_CONFIG: CaptureConfig = {
  windowPollIntervalMs: 1000,
  screenshotIntervalMs: 30_000,
  screenshotFormat: 'jpg',
  screenshotQuality: 60,
  screenshotsEnabled: true,
  keyboardEnabled: false,
  mouseEnabled: false,
  clipboardEnabled: false,
  fileWatchEnabled: false,
  fileWatchPaths: [join(homedir(), 'Documents'), join(homedir(), 'Desktop')],
  dataDir: process.env.DATA_DIR || './data',
};

export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  analysisIntervalMs: 5 * 60_000,           // 5 minutes
  claudeAnalysisIntervalMs: 60 * 60_000,    // 1 hour
  claudeModelId: 'claude-sonnet-4-20250514',
  timeSinkThresholdMs: 30 * 60_000,         // 30 minutes
  tabSwitchWindowMs: 5 * 60_000,            // 5 minutes
  tabSwitchThreshold: 10,
  sequenceMinLength: 3,
  sequenceMinOccurrences: 3,
  confidenceThreshold: 0.6,
  promotionConfidence: 0.8,
  patternAgingDays: 7,
  visionAnalysisIntervalMs: 15 * 60_000,    // 15 minutes
  visionBatchSize: 5,
};

export const API_PORT = 3333;
export const API_HOST = '127.0.0.1';
export const DASHBOARD_ORIGIN = 'http://localhost:5173';
