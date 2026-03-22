// ---- Capture Layer ----

export interface WindowInfo {
  appName: string;
  windowTitle: string;
  url: string | null;
  bundleId: string | null;
  processId: number;
}

export interface ActivityEvent {
  id?: number;
  timestamp: number;
  appName: string;
  windowTitle: string;
  url: string | null;
  bundleId: string | null;
  durationMs: number | null;
  createdAt?: number;
}

export interface Screenshot {
  id?: number;
  timestamp: number;
  filePath: string;
  appName: string | null;
  windowTitle: string | null;
  fileSizeBytes: number | null;
  createdAt?: number;
}

// ---- Pattern Recognition ----

export type PatternType = 'app_sequence' | 'time_sink' | 'tab_switching';

export interface Pattern {
  id?: number;
  type: PatternType;
  description: string;
  dataJson: string;
  frequency: number;
  firstSeen: number;
  lastSeen: number;
  isActive: boolean;
  createdAt?: number;
}

export interface AppSequenceData {
  apps: string[];
  avgIntervalMs: number;
  occurrences: number;
}

export interface TimeSinkData {
  appName: string;
  windowTitlePattern: string | null;
  avgDurationMs: number;
  totalDurationMs: number;
  occurrences: number;
}

export interface TabSwitchData {
  apps: [string, string];
  switchCount: number;
  windowMs: number;
}

export type PatternData = AppSequenceData | TimeSinkData | TabSwitchData;

// ---- Coaching / Suggestions ----

export type SuggestionSource = 'heuristic' | 'claude';
export type SuggestionCategory = 'coaching' | 'automation' | 'focus';
export type SuggestionStatus = 'new' | 'shown' | 'accepted' | 'dismissed';

export interface Suggestion {
  id?: number;
  patternId: number | null;
  source: SuggestionSource;
  category: SuggestionCategory;
  title: string;
  body: string;
  priority: number;
  status: SuggestionStatus;
  userFeedback: string | null;
  createdAt?: number;
}

// ---- API Responses ----

export interface TimeRange {
  start: number;
  end: number;
}

export interface AppUsageSummary {
  appName: string;
  totalDurationMs: number;
  percentage: number;
  eventCount: number;
}

export interface TimelineBucket {
  timestamp: number;
  appName: string;
  durationMs: number;
}

export interface DashboardSummary {
  range: TimeRange;
  topApps: AppUsageSummary[];
  totalTrackedMs: number;
  activePatterns: Pattern[];
  newSuggestions: Suggestion[];
}

// ---- Configuration ----

export interface CaptureConfig {
  windowPollIntervalMs: number;
  screenshotIntervalMs: number;
  screenshotFormat: 'png' | 'jpg';
  screenshotQuality: number;
  screenshotsEnabled: boolean;
  dataDir: string;
}

export interface AnalysisConfig {
  analysisIntervalMs: number;
  claudeAnalysisIntervalMs: number;
  claudeModelId: string;
  timeSinkThresholdMs: number;
  tabSwitchWindowMs: number;
  tabSwitchThreshold: number;
  sequenceMinLength: number;
  sequenceMinOccurrences: number;
}

export interface ExclusionRule {
  id?: number;
  type: 'app' | 'title_regex' | 'url_regex';
  pattern: string;
}
