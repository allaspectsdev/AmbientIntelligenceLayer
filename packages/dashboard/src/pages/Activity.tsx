import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { TimeRangeSelector } from '../components/TimeRangeSelector'

export function ActivityPage() {
  const now = Date.now()
  const [range, setRange] = useState({ start: now - 24 * 3600_000, end: now })
  const { data: events } = useQuery({ queryKey: ['activity', range.start, range.end], queryFn: () => api.getActivity(range.start, range.end) })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between animate-in" style={{ '--delay': 0 } as React.CSSProperties}>
        <h2 className="font-display text-3xl">Activity Log</h2>
        <TimeRangeSelector onChange={(s, e) => setRange({ start: s, end: e })} />
      </div>
      <div className="glass overflow-hidden animate-in" style={{ '--delay': 1 } as React.CSSProperties}>
        <table className="w-full text-sm table-glass">
          <thead>
            <tr>
              <th className="text-left px-4 py-3 text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Time</th>
              <th className="text-left px-4 py-3 text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Application</th>
              <th className="text-left px-4 py-3 text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Window Title</th>
              <th className="text-right px-4 py-3 text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            {events?.map(e => (
              <tr key={e.id}>
                <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap" style={{ color: 'var(--color-text-dim)' }}>{new Date(e.timestamp).toLocaleTimeString()}</td>
                <td className="px-4 py-2.5 text-sm font-medium">{e.appName}</td>
                <td className="px-4 py-2.5 text-sm truncate max-w-md" style={{ color: 'var(--color-text-muted)' }}>{e.windowTitle}</td>
                <td className="px-4 py-2.5 text-right font-mono text-xs" style={{ color: 'var(--color-primary-light)' }}>
                  {e.durationMs ? (e.durationMs < 60_000 ? `${Math.round(e.durationMs / 1000)}s` : `${Math.round(e.durationMs / 60_000)}m`) : '--'}
                </td>
              </tr>
            ))}
            {(!events || !events.length) && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-text-dim)' }}>No activity recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
