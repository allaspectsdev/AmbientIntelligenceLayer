import type { Pattern } from '../api/client'

const typeColors: Record<string, string> = {
  app_sequence: '#6366f1',
  time_sink: '#f97316',
  tab_switching: '#ec4899',
}

const typeLabels: Record<string, string> = {
  app_sequence: 'Sequence',
  time_sink: 'Time Sink',
  tab_switching: 'Tab Switching',
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3600_000) return `${Math.round(diff / 60_000)}m ago`
  if (diff < 86400_000) return `${Math.round(diff / 3600_000)}h ago`
  return `${Math.round(diff / 86400_000)}d ago`
}

export function PatternCard({ pattern }: { pattern: Pattern }) {
  const color = typeColors[pattern.type] || '#6366f1'
  return (
    <div className="rounded-lg p-4 border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ background: `${color}22`, color }}>
          {typeLabels[pattern.type] || pattern.type}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
          {pattern.frequency}x observed
        </span>
      </div>
      <p className="text-sm mb-2">{pattern.description}</p>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Last seen: {timeAgo(pattern.lastSeen)}
      </p>
    </div>
  )
}
