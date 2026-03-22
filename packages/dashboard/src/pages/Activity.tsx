import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { TimeRangeSelector } from '../components/TimeRangeSelector'

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString()
}

function formatDuration(ms: number | null): string {
  if (!ms) return '--'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  return `${Math.round(ms / 60_000)}m`
}

export function ActivityPage() {
  const now = Date.now()
  const [range, setRange] = useState({ start: now - 24 * 60 * 60_000, end: now })

  const { data: events } = useQuery({
    queryKey: ['activity', range.start, range.end],
    queryFn: () => api.getActivity(range.start, range.end),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Activity Log</h2>
        <TimeRangeSelector onChange={(s, e) => setRange({ start: s, end: e })} />
      </div>

      <div className="rounded-lg border overflow-hidden"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--color-surface-alt)' }}>
              <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Time</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Application</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Window Title</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            {events?.map(event => (
              <tr key={event.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-2 text-xs whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                  {formatTime(event.timestamp)}
                </td>
                <td className="px-4 py-2 font-medium">{event.appName}</td>
                <td className="px-4 py-2 truncate max-w-md" style={{ color: 'var(--color-text-muted)' }}>
                  {event.windowTitle}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap" style={{ color: 'var(--color-primary-light)' }}>
                  {formatDuration(event.durationMs)}
                </td>
              </tr>
            ))}
            {(!events || events.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  No activity recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
