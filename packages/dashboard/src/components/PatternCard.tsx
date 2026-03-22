import type { Pattern } from '../api/client'

const typeColors: Record<string, string> = {
  app_sequence: '#6366f1',
  time_sink: '#f97316',
  tab_switching: '#ec4899',
  keyboard_sequence: '#22c55e',
  clipboard_bridge: '#06b6d4',
  file_workflow: '#eab308',
  compound: '#8b5cf6',
}

const typeLabels: Record<string, string> = {
  app_sequence: 'Sequence',
  time_sink: 'Time Sink',
  tab_switching: 'Tab Switching',
  keyboard_sequence: 'Keyboard',
  clipboard_bridge: 'Clipboard Bridge',
  file_workflow: 'File Workflow',
  compound: 'Compound',
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3600_000) return `${Math.round(diff / 60_000)}m ago`
  if (diff < 86400_000) return `${Math.round(diff / 3600_000)}h ago`
  return `${Math.round(diff / 86400_000)}d ago`
}

function confidenceColor(c: number): string {
  if (c >= 0.7) return '#22c55e'
  if (c >= 0.4) return '#eab308'
  return '#f43f5e'
}

export function PatternCard({ pattern }: { pattern: Pattern }) {
  const color = typeColors[pattern.type] || '#6366f1'
  const conf = pattern.confidence ?? 0.5
  const confColor = confidenceColor(conf)

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
        {pattern.riskLevel && pattern.riskLevel !== 'safe' && (
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: pattern.riskLevel === 'risky' ? '#f43f5e22' : '#f9731622',
                     color: pattern.riskLevel === 'risky' ? '#f43f5e' : '#f97316' }}>
            {pattern.riskLevel}
          </span>
        )}
      </div>
      <p className="text-sm mb-2">{pattern.description}</p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Confidence</span>
          <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--color-surface-alt)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${conf * 100}%`, background: confColor }} />
          </div>
          <span className="text-[10px] font-medium" style={{ color: confColor }}>{Math.round(conf * 100)}%</span>
        </div>
        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
          {timeAgo(pattern.lastSeen)}
        </span>
      </div>
    </div>
  )
}
