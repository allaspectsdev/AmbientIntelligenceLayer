import type { Pattern } from '../api/client'

const typeColors: Record<string, string> = {
  app_sequence: '#0ea5e9',
  time_sink: '#f59e0b',
  tab_switching: '#ec4899',
  keyboard_sequence: '#10b981',
  clipboard_bridge: '#06b6d4',
  file_workflow: '#eab308',
  compound: '#8b5cf6',
}

const typeLabels: Record<string, string> = {
  app_sequence: 'Sequence',
  time_sink: 'Time Sink',
  tab_switching: 'Tab Switch',
  keyboard_sequence: 'Keyboard',
  clipboard_bridge: 'Clipboard',
  file_workflow: 'File',
  compound: 'Compound',
}

function timeAgo(ts: number): string {
  const d = Date.now() - ts
  if (d < 60_000) return 'just now'
  if (d < 3600_000) return `${Math.round(d / 60_000)}m ago`
  if (d < 86400_000) return `${Math.round(d / 3600_000)}h ago`
  return `${Math.round(d / 86400_000)}d ago`
}

function confColor(c: number): string {
  if (c >= 0.7) return 'var(--color-success)'
  if (c >= 0.4) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

export function PatternCard({ pattern }: { pattern: Pattern }) {
  const color = typeColors[pattern.type] || '#0ea5e9'
  const conf = pattern.confidence ?? 0.5

  return (
    <div className="glass glass-hover p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="badge" style={{ background: `${color}1a`, color }}>
          {typeLabels[pattern.type] || pattern.type}
        </span>
        <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-dim)' }}>
          {pattern.frequency}x
        </span>
        {pattern.riskLevel && pattern.riskLevel !== 'safe' && (
          <span className="badge" style={{
            background: pattern.riskLevel === 'risky' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
            color: pattern.riskLevel === 'risky' ? 'var(--color-danger)' : 'var(--color-warning)',
          }}>
            {pattern.riskLevel}
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-text)' }}>{pattern.description}</p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-dim)' }}>conf</span>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.1)' }}>
            <div className="h-full rounded-full" style={{
              width: `${conf * 100}%`,
              background: confColor(conf),
              animation: 'barFill 0.8s ease-out',
            }} />
          </div>
          <span className="text-[10px] font-mono font-medium" style={{ color: confColor(conf) }}>
            {Math.round(conf * 100)}%
          </span>
        </div>
        <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-dim)' }}>
          {timeAgo(pattern.lastSeen)}
        </span>
      </div>
    </div>
  )
}
