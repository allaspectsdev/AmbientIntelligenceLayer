import { useState } from 'react'

type Preset = '1h' | '6h' | '24h' | '7d'
const presets: { key: Preset; label: string; ms: number }[] = [
  { key: '1h', label: '1H', ms: 3600_000 },
  { key: '6h', label: '6H', ms: 6 * 3600_000 },
  { key: '24h', label: '24H', ms: 24 * 3600_000 },
  { key: '7d', label: '7D', ms: 7 * 24 * 3600_000 },
]

export function TimeRangeSelector({ onChange }: { onChange: (s: number, e: number) => void }) {
  const [active, setActive] = useState<Preset>('24h')
  return (
    <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--color-surface-alt)' }}>
      {presets.map(p => (
        <button key={p.key}
          onClick={() => { setActive(p.key); onChange(Date.now() - p.ms, Date.now()) }}
          className="px-3 py-1.5 rounded-md text-[11px] font-mono font-medium transition-all"
          style={{
            background: active === p.key ? 'var(--color-primary)' : 'transparent',
            color: active === p.key ? '#fff' : 'var(--color-text-dim)',
            boxShadow: active === p.key ? 'var(--shadow-glow)' : 'none',
          }}>
          {p.label}
        </button>
      ))}
    </div>
  )
}
