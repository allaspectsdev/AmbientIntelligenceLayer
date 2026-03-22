import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { TimeRangeSelector } from '../components/TimeRangeSelector'

export function ScreenshotsPage() {
  const now = Date.now()
  const [range, setRange] = useState({ start: now - 24 * 3600_000, end: now })
  const [sel, setSel] = useState<number | null>(null)
  const { data } = useQuery({ queryKey: ['screenshots', range.start, range.end], queryFn: () => api.getScreenshots(range.start, range.end) })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between animate-in" style={{ '--delay': 0 } as React.CSSProperties}>
        <h2 className="font-display text-3xl">Screenshots</h2>
        <TimeRangeSelector onChange={(s, e) => setRange({ start: s, end: e })} />
      </div>
      {data && data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((s, i) => (
            <div key={s.id} className="glass glass-hover overflow-hidden cursor-pointer animate-in"
              style={{ '--delay': i + 1 } as React.CSSProperties}
              onClick={() => setSel(sel === s.id ? null : s.id)}>
              <img src={api.getScreenshotUrl(s.id)} alt="" className="w-full h-36 object-cover" loading="lazy" />
              <div className="p-3">
                <p className="text-xs font-medium truncate">{s.appName || 'Unknown'}</p>
                <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--color-text-dim)' }}>{new Date(s.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8z" text="No screenshots captured yet." />
      )}
      {sel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer animate-fade"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSel(null)}>
          <img src={api.getScreenshotUrl(sel)} alt="" className="max-w-[90vw] max-h-[90vh] rounded-xl" style={{ boxShadow: '0 0 60px rgba(14,165,233,0.15)' }} />
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="glass p-16 flex flex-col items-center gap-4 animate-in" style={{ '--delay': 1 } as React.CSSProperties}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" style={{ color: 'var(--color-text-dim)' }}>
        <path d={icon} />
      </svg>
      <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>{text}</p>
    </div>
  )
}
