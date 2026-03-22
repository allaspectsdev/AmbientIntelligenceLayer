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
};
