import { useState } from 'react'

type RangePreset = '1h' | '6h' | '24h' | '7d'

const presets: { key: RangePreset; label: string; ms: number }[] = [
  { key: '1h', label: '1 Hour', ms: 60 * 60_000 },
  { key: '6h', label: '6 Hours', ms: 6 * 60 * 60_000 },
  { key: '24h', label: '24 Hours', ms: 24 * 60 * 60_000 },
  { key: '7d', label: '7 Days', ms: 7 * 24 * 60 * 60_000 },
]

interface Props {
  onChange: (start: number, end: number) => void
}

export function TimeRangeSelector({ onChange }: Props) {
  const [active, setActive] = useState<RangePreset>('24h')

  const handleSelect = (preset: typeof presets[number]) => {
    setActive(preset.key)
    const now = Date.now()
    onChange(now - preset.ms, now)
  }

  return (
    <div className="flex gap-1.5">
      {presets.map(p => (
        <button
          key={p.key}
          onClick={() => handleSelect(p)}
          className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
          style={{
            background: active === p.key ? 'var(--color-primary)' : 'var(--color-surface-alt)',
            color: active === p.key ? '#fff' : 'var(--color-text-muted)',
            border: '1px solid',
            borderColor: active === p.key ? 'var(--color-primary)' : 'var(--color-border)',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
