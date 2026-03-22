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

export interface KeyboardEvent {
  id?: number;
  timestamp: number;
  keyCode: string;
  modifiers: string | null;
  eventType: 'keydown' | 'keyup';
  appName: string | null;
  createdAt?: number;
}

export interface MouseEvent {
  id?: number;
  timestamp: number;
  x: number;
  y: number;
  button: number;
  eventType: 'click' | 'scroll' | 'move';
  appName: string | null;
  createdAt?: number;
}

export interface ClipboardEvent {
  id?: number;
  timestamp: number;
  contentType: string;
  contentHash: string | null;
  sourceApp: string | null;
  targetApp: string | null;
  contentPreview: string | null;
  createdAt?: number;
}

export interface FileEvent {
  id?: number;
  timestamp: number;
  path: string;
  eventType: 'create' | 'modify' | 'delete';
  appName: string | null;
  createdAt?: number;
}

// ---- Pattern Recognition ----

export type PatternType =
  | 'app_sequence'
  | 'time_sink'
  | 'tab_switching'
  | 'keyboard_sequence'
  | 'clipboard_bridge'
  | 'file_workflow'
  | 'compound';

export interface Pattern {
  id?: number;
  type: PatternType;
  description: string;
  dataJson: string;
  frequency: number;
  firstSeen: number;
  lastSeen: number;
  isActive: boolean;
  confidence: number;
  riskLevel: RiskLevel;
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

export interface KeyboardSequenceData {
  keys: string[];
  appName: string | null;
  frequency: number;
  avgIntervalMs: number;
}

export interface ClipboardBridgeData {
  sourceApp: string;
  targetApp: string;
  frequency: number;
  contentTypes: string[];
}

export interface FileWorkflowData {
  paths: string[];
  eventTypes: string[];
  appNames: string[];
  frequency: number;
}

export interface CompoundPatternData {
  componentPatternIds: number[];
  description: string;
  correlationScore: number;
}

export type PatternData =
  | AppSequenceData
  | TimeSinkData
  | TabSwitchData
  | KeyboardSequenceData
  | ClipboardBridgeData
  | FileWorkflowData
  | CompoundPatternData;

// ---- Coaching / Suggestions ----

export type SuggestionSource = 'heuristic' | 'claude' | 'claude_vision';
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

// ---- Automation ----

export type AutomationType = 'applescript' | 'playwright' | 'n8n' | 'api_stub';
export type AutomationStatus = 'draft' | 'ready' | 'active' | 'disabled';
export type RiskLevel = 'safe' | 'moderate' | 'risky';

export interface Automation {
  id?: number;
  patternId: number | null;
  type: AutomationType;
  name: string;
  description: string | null;
  scriptContent: string | null;
  status: AutomationStatus;
  confidence: number;
  riskLevel: RiskLevel;
  createdAt?: number;
  updatedAt?: number;
}

export interface AutomationExecution {
  id?: number;
  automationId: number;
  startedAt: number;
  completedAt: number | null;
  status: 'running' | 'success' | 'failed';
  output: string | null;
  error: string | null;
}

// ---- Agent Orchestration ----

export type AgentStatus = 'idle' | 'running' | 'paused' | 'stopped';
export type ApprovalStatus = 'pending' | 'approved' | 'denied';

export interface Agent {
  id?: number;
  name: string;
  type: string;
  configJson: string | null;
  status: AgentStatus;
  createdAt?: number;
}

export interface AgentTask {
  id?: number;
  agentId: number;
  automationId: number | null;
  scheduledAt: number | null;
  startedAt: number | null;
  completedAt: number | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: number;
  retryCount: number;
  error: string | null;
}

export interface Approval {
  id?: number;
  agentTaskId: number | null;
  automationId: number | null;
  actionType: string;
  status: ApprovalStatus;
  requestedAt: number;
  decidedAt: number | null;
  decidedBy: string | null;
}

export interface Credential {
  id?: number;
  name: string;
  service: string | null;
  scope: string | null;
  createdAt?: number;
  updatedAt?: number;
}

export interface AuditEntry {
  id?: number;
  timestamp: number;
  actor: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  detailsJson: string | null;
  riskLevel: RiskLevel;
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

// ---- WebSocket Messages ----

export type WsMessageType = 'coaching_nudge' | 'pattern_alert' | 'automation_ready' | 'approval_request';

export interface WsMessage {
  type: WsMessageType;
  payload: unknown;
  timestamp: number;
}

// ---- Configuration ----

export interface CaptureConfig {
  windowPollIntervalMs: number;
  screenshotIntervalMs: number;
  screenshotFormat: 'png' | 'jpg';
  screenshotQuality: number;
  screenshotsEnabled: boolean;
  keyboardEnabled: boolean;
  mouseEnabled: boolean;
  clipboardEnabled: boolean;
  fileWatchEnabled: boolean;
  fileWatchPaths: string[];
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
  confidenceThreshold: number;
  promotionConfidence: number;
  patternAgingDays: number;
  visionAnalysisIntervalMs: number;
  visionBatchSize: number;
}

export interface ExclusionRule {
  id?: number;
  type: 'app' | 'title_regex' | 'url_regex' | 'path_regex';
  pattern: string;
}
