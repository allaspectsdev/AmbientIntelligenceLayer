import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { TimeRangeSelector } from '../components/TimeRangeSelector'
import { AppUsageChart } from '../components/AppUsageChart'
import { SuggestionCard } from '../components/SuggestionCard'

function fmt(ms: number) {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  if (ms < 3600_000) return `${Math.round(ms / 60_000)}m`
  return `${Math.floor(ms / 3600_000)}h ${Math.round((ms % 3600_000) / 60_000)}m`
}

const statAccents = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-success)']

export function DashboardPage() {
  const now = Date.now()
  const [range, setRange] = useState({ start: now - 24 * 3600_000, end: now })
  const { data: summary } = useQuery({ queryKey: ['summary', range.start, range.end], queryFn: () => api.getSummary(range.start, range.end) })
  const { data: suggestions } = useQuery({ queryKey: ['suggestions', 'new'], queryFn: () => api.getSuggestions('new') })

  const stats = [
    { label: 'Total Tracked', value: summary ? fmt(summary.totalTrackedMs) : '--' },
    { label: 'Apps Used', value: summary ? String(summary.topApps.length) : '--' },
    { label: 'New Suggestions', value: suggestions ? String(suggestions.length) : '--' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <h2 className="font-display text-3xl" style={{ color: 'var(--color-text)' }}>Dashboard</h2>
        <TimeRangeSelector onChange={(s, e) => setRange({ start: s, end: e })} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat, i) => (
          <div key={stat.label} className="glass glass-hover p-5 animate-in" style={{ '--delay': i + 1 } as React.CSSProperties}>
            <div className="h-0.5 w-8 rounded-full mb-4" style={{ background: statAccents[i] }} />
            <p className="text-[11px] font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-dim)' }}>
              {stat.label}
            </p>
            <p className="font-mono text-3xl font-medium text-gradient">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* App usage chart */}
      <div className="glass glow-border p-6 animate-in" style={{ '--delay': 4 } as React.CSSProperties}>
        <h3 className="text-[11px] font-mono uppercase tracking-wider mb-5" style={{ color: 'var(--color-text-dim)' }}>
          Application Usage
        </h3>
        <AppUsageChart data={summary?.topApps || []} />
      </div>

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="animate-in" style={{ '--delay': 5 } as React.CSSProperties}>
          <h3 className="text-[11px] font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-dim)' }}>
            Coaching Suggestions
          </h3>
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={s.id} className="animate-in" style={{ '--delay': i + 6 } as React.CSSProperties}>
                <SuggestionCard suggestion={s} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active patterns */}
      {summary && summary.activePatterns.length > 0 && (
        <div className="animate-in" style={{ '--delay': 6 } as React.CSSProperties}>
          <h3 className="text-[11px] font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-dim)' }}>
            Active Patterns ({summary.activePatterns.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.activePatterns.slice(0, 4).map((p, i) => (
              <div key={p.id} className="glass glass-hover p-4 animate-in" style={{ '--delay': i + 7 } as React.CSSProperties}>
                <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.12)', color: 'var(--color-primary-light)' }}>
                  {p.type.replace('_', ' ')}
                </span>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
