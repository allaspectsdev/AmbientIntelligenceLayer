const BASE = '/api';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface ActivityEvent {
  id: number;
  timestamp: number;
  appName: string;
  windowTitle: string;
  url: string | null;
  durationMs: number | null;
}

export interface AppUsageSummary {
  appName: string;
  totalDurationMs: number;
  percentage: number;
  eventCount: number;
}

export interface Pattern {
  id: number;
  type: string;
  description: string;
  dataJson: string;
  frequency: number;
  firstSeen: number;
  lastSeen: number;
  isActive: boolean;
  confidence?: number;
  riskLevel?: string;
}

export interface Automation {
  id: number;
  patternId: number | null;
  type: string;
  name: string;
  description: string | null;
  scriptContent: string | null;
  status: string;
  confidence: number;
  riskLevel: string;
  createdAt: number;
}

export interface AutomationExecution {
  id: number;
  automationId: number;
  startedAt: number;
  completedAt: number | null;
  status: string;
  output: string | null;
  error: string | null;
}

export interface Agent {
  id: number;
  name: string;
  type: string;
  status: string;
  createdAt: number;
}

export interface AgentTask {
  id: number;
  agentId: number;
  automationId: number | null;
  status: string;
  priority: number;
}

export interface Approval {
  id: number;
  agentTaskId: number | null;
  automationId: number | null;
  actionType: string;
  status: string;
  requestedAt: number;
  decidedAt: number | null;
}

export interface AuditEntry {
  id: number;
  timestamp: number;
  actor: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  detailsJson: string | null;
  riskLevel: string;
}

export interface Credential {
  id: number;
  name: string;
  service: string | null;
  scope: string | null;
}

export interface Suggestion {
  id: number;
  source: string;
  category: string;
  title: string;
  body: string;
  priority: number;
  status: string;
  createdAt: number;
}

export interface Screenshot {
  id: number;
  timestamp: number;
  filePath: string;
  appName: string | null;
  windowTitle: string | null;
}

export interface DashboardSummary {
  range: { start: number; end: number };
  topApps: AppUsageSummary[];
  totalTrackedMs: number;
  activePatterns: Pattern[];
  newSuggestions: Suggestion[];
}

export interface ExclusionRule {
  id: number;
  type: string;
  pattern: string;
}

export const api = {
  getSummary: (start?: number, end?: number) => {
    const params = new URLSearchParams();
    if (start) params.set('start', String(start));
    if (end) params.set('end', String(end));
    return fetchJson<DashboardSummary>(`/activity/summary?${params}`);
  },

  getActivity: (start?: number, end?: number, limit = 500) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (start) params.set('start', String(start));
    if (end) params.set('end', String(end));
    return fetchJson<ActivityEvent[]>(`/activity?${params}`);
  },

  getApps: (start?: number, end?: number) => {
    const params = new URLSearchParams();
    if (start) params.set('start', String(start));
    if (end) params.set('end', String(end));
    return fetchJson<AppUsageSummary[]>(`/activity/apps?${params}`);
  },

  getPatterns: () => fetchJson<Pattern[]>('/patterns'),

  getSuggestions: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return fetchJson<Suggestion[]>(`/suggestions${params}`);
  },

  updateSuggestion: (id: number, status: string, userFeedback?: string) =>
    fetchJson(`/suggestions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, userFeedback }),
    }),

  getScreenshots: (start?: number, end?: number) => {
    const params = new URLSearchParams();
    if (start) params.set('start', String(start));
    if (end) params.set('end', String(end));
    return fetchJson<Screenshot[]>(`/screenshots?${params}`);
  },

  getScreenshotUrl: (id: number) => `${BASE}/screenshots/${id}/image`,

  getExclusions: () => fetchJson<ExclusionRule[]>('/config/exclusions'),

  addExclusion: (type: string, pattern: string) =>
    fetchJson<{ id: number }>('/config/exclusions', {
      method: 'POST',
      body: JSON.stringify({ type, pattern }),
    }),

  removeExclusion: (id: number) =>
    fetchJson(`/config/exclusions/${id}`, { method: 'DELETE' }),

  triggerAnalysis: () =>
    fetchJson<{ patternsFound: number; suggestionsGenerated: number }>('/analyze/trigger', {
      method: 'POST',
    }),

  health: () => fetchJson<{ status: string }>('/health'),

  // Automations
  getAutomations: (filters?: { status?: string; type?: string }) => {
    const p = new URLSearchParams();
    if (filters?.status) p.set('status', filters.status);
    if (filters?.type) p.set('type', filters.type);
    return fetchJson<Automation[]>(`/automations?${p}`);
  },
  getAutomation: (id: number) => fetchJson<Automation>(`/automations/${id}`),
  generateAutomation: (patternId: number) =>
    fetchJson<Automation>(`/automations/generate/${patternId}`, { method: 'POST' }),
  executeAutomation: (id: number) =>
    fetchJson<AutomationExecution>(`/automations/${id}/execute`, { method: 'POST' }),
  dryRunAutomation: (id: number) =>
    fetchJson<{ preview: string }>(`/automations/${id}/dry-run`, { method: 'POST' }),
  exportAutomation: (id: number, format: string) =>
    fetchJson<{ content: string; filename: string }>(`/automations/${id}/export/${format}`),
  getExecutions: (automationId: number) =>
    fetchJson<AutomationExecution[]>(`/automations/${automationId}/executions`),
  updateAutomation: (id: number, fields: Record<string, unknown>) =>
    fetchJson(`/automations/${id}`, { method: 'PATCH', body: JSON.stringify(fields) }),
  deleteAutomation: (id: number) => fetchJson(`/automations/${id}`, { method: 'DELETE' }),

  // Agents
  getAgents: () => fetchJson<Agent[]>('/agents'),
  createAgent: (name: string, type: string) =>
    fetchJson<{ id: number }>('/agents', { method: 'POST', body: JSON.stringify({ name, type }) }),
  startAgent: (id: number) => fetchJson(`/agents/${id}/start`, { method: 'POST' }),
  stopAgent: (id: number) => fetchJson(`/agents/${id}/stop`, { method: 'POST' }),
  deleteAgent: (id: number) => fetchJson(`/agents/${id}`, { method: 'DELETE' }),
  getAgentTasks: (agentId: number) => fetchJson<AgentTask[]>(`/agents/${agentId}/tasks`),
  enqueueTask: (agentId: number, automationId: number, priority?: number) =>
    fetchJson(`/agents/${agentId}/tasks`, { method: 'POST', body: JSON.stringify({ automationId, priority }) }),

  // Approvals
  getApprovals: () => fetchJson<Approval[]>('/approvals'),
  approveRequest: (id: number) => fetchJson(`/approvals/${id}/approve`, { method: 'POST' }),
  denyRequest: (id: number) => fetchJson(`/approvals/${id}/deny`, { method: 'POST' }),

  // Audit
  getAuditLog: (filters?: { actor?: string; riskLevel?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (filters?.actor) p.set('actor', filters.actor);
    if (filters?.riskLevel) p.set('riskLevel', filters.riskLevel);
    if (filters?.limit) p.set('limit', String(filters.limit));
    return fetchJson<AuditEntry[]>(`/audit?${p}`);
  },

  // Credentials
  getCredentials: () => fetchJson<Credential[]>('/credentials'),
  addCredential: (name: string, service: string, value: string, scope?: string) =>
    fetchJson<{ id: number }>('/credentials', { method: 'POST', body: JSON.stringify({ name, service, value, scope }) }),
  deleteCredential: (id: number) => fetchJson(`/credentials/${id}`, { method: 'DELETE' }),

  // Vision
  triggerVisionAnalysis: () => fetchJson<{ analyzed: number }>('/vision/analyze', { method: 'POST' }),
};
