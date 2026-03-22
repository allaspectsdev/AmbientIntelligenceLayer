import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { PatternCard } from '../components/PatternCard'

export function PatternsPage() {
  const { data } = useQuery({ queryKey: ['patterns'], queryFn: () => api.getPatterns() })
  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl animate-in" style={{ '--delay': 0 } as React.CSSProperties}>Detected Patterns</h2>
      {data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((p, i) => (
            <div key={p.id} className="animate-in" style={{ '--delay': i + 1 } as React.CSSProperties}>
              <PatternCard pattern={p} />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-16 flex flex-col items-center gap-4 animate-in" style={{ '--delay': 1 } as React.CSSProperties}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" style={{ color: 'var(--color-text-dim)' }}>
            <path d="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>No patterns detected yet.</p>
          <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Keep using your computer with the capture service running.</p>
        </div>
      )}
    </div>
  )
}
