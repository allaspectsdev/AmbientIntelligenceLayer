import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { PatternCard } from '../components/PatternCard'

export function PatternsPage() {
  const { data: patterns } = useQuery({
    queryKey: ['patterns'],
    queryFn: () => api.getPatterns(),
  })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Detected Patterns</h2>
      {patterns && patterns.length > 0 ? (
        <div className="space-y-3">
          {patterns.map(p => <PatternCard key={p.id} pattern={p} />)}
        </div>
      ) : (
        <div className="rounded-lg p-12 border text-center"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
            No patterns detected yet.
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            The analysis engine looks for repeated app sequences, time sinks, and excessive tab switching.
          </p>
        </div>
      )}
    </div>
  )
}
