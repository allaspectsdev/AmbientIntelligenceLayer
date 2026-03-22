import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Suggestion } from '../api/client'

const catColors: Record<string, string> = {
  coaching: 'var(--color-primary)',
  automation: 'var(--color-success)',
  focus: 'var(--color-accent)',
}

const catLabels: Record<string, string> = {
  coaching: 'Tip',
  automation: 'Automate',
  focus: 'Focus',
}

export function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: ({ status }: { status: string }) => api.updateSuggestion(suggestion.id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suggestions'] }); qc.invalidateQueries({ queryKey: ['summary'] }) },
  })
  const color = catColors[suggestion.category] || 'var(--color-primary)'

  return (
    <div className="glass glass-hover p-4 flex gap-4" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="badge" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
            {catLabels[suggestion.category] || suggestion.category}
          </span>
          {suggestion.source === 'claude' && (
            <span className="badge" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>AI</span>
          )}
          {suggestion.source === 'claude_vision' && (
            <span className="badge" style={{ background: 'rgba(14,165,233,0.12)', color: 'var(--color-primary-light)' }}>Vision</span>
          )}
        </div>
        <h4 className="text-sm font-medium mb-1">{suggestion.title}</h4>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{suggestion.body}</p>
      </div>
      {suggestion.status === 'new' && (
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button onClick={() => m.mutate({ status: 'accepted' })}
            className="btn-primary px-3 py-1.5 text-xs">
            Got it
          </button>
          <button onClick={() => m.mutate({ status: 'dismissed' })}
            className="btn-ghost px-3 py-1.5 text-xs">
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
