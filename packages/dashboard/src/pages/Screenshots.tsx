import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { TimeRangeSelector } from '../components/TimeRangeSelector'

export function ScreenshotsPage() {
  const now = Date.now()
  const [range, setRange] = useState({ start: now - 24 * 60 * 60_000, end: now })
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data: screenshots } = useQuery({
    queryKey: ['screenshots', range.start, range.end],
    queryFn: () => api.getScreenshots(range.start, range.end),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Screenshots</h2>
        <TimeRangeSelector onChange={(s, e) => setRange({ start: s, end: e })} />
      </div>

      {screenshots && screenshots.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {screenshots.map(s => (
            <div key={s.id}
              className="rounded-lg border overflow-hidden cursor-pointer transition-all hover:opacity-80"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}>
              <img src={api.getScreenshotUrl(s.id)} alt={s.windowTitle || 'Screenshot'}
                className="w-full h-32 object-cover" loading="lazy" />
              <div className="p-2">
                <p className="text-xs font-medium truncate">{s.appName || 'Unknown'}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {new Date(s.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg p-12 border text-center"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No screenshots captured yet. Enable screenshots in Settings and start the capture service.
          </p>
        </div>
      )}

      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer"
          onClick={() => setSelectedId(null)}>
          <img src={api.getScreenshotUrl(selectedId)} alt="Screenshot"
            className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  )
}
