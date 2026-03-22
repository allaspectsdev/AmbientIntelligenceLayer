import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { TimeRangeSelector } from '../components/TimeRangeSelector'
import { AppUsageChart } from '../components/AppUsageChart'
import { SuggestionCard } from '../components/SuggestionCard'

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  if (ms < 3600_000) return `${Math.round(ms / 60_000)}m`
  const h = Math.floor(ms / 3600_000)
  const m = Math.round((ms % 3600_000) / 60_000)
  return `${h}h ${m}m`
}

export function DashboardPage() {
  const now = Date.now()
  const [range, setRange] = useState({ start: now - 24 * 60 * 60_000, end: now })

  const { data: summary } = useQuery({
    queryKey: ['summary', range.start, range.end],
    queryFn: () => api.getSummary(range.start, range.end),
  })

  const { data: suggestions } = useQuery({
    queryKey: ['suggestions', 'new'],
    queryFn: () => api.getSuggestions('new'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <TimeRangeSelector onChange={(s, e) => setRange({ start: s, end: e })} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Tracked" value={summary ? formatDuration(summary.totalTrackedMs) : '--'} />
        <StatCard label="Apps Used" value={summary ? String(summary.topApps.length) : '--'} />
        <StatCard label="New Suggestions" value={suggestions ? String(suggestions.length) : '--'} />
      </div>

      <div className="rounded-lg p-5 border"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Application Usage
        </h3>
        <AppUsageChart data={summary?.topApps || []} />
      </div>

      {suggestions && suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Coaching Suggestions
          </h3>
          <div className="space-y-3">
            {suggestions.map(s => <SuggestionCard key={s.id} suggestion={s} />)}
          </div>
        </div>
      )}

      {summary && summary.activePatterns.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Active Patterns ({summary.activePatterns.length})
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {summary.activePatterns.slice(0, 4).map(p => (
              <div key={p.id} className="rounded-lg p-3 border text-sm"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <span className="text-xs font-medium" style={{ color: 'var(--color-primary-light)' }}>
                  {p.type.replace('_', ' ')}
                </span>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-4 border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      <p className="text-2xl font-semibold" style={{ color: 'var(--color-primary-light)' }}>{value}</p>
    </div>
  )
}
