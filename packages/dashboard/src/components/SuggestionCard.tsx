import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Suggestion } from '../api/client'

const categoryColors: Record<string, string> = {
  coaching: '#6366f1',
  automation: '#22c55e',
  focus: '#f97316',
}

const categoryLabels: Record<string, string> = {
  coaching: 'Tip',
  automation: 'Automate',
  focus: 'Focus',
}

export function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ status }: { status: string }) => api.updateSuggestion(suggestion.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
    },
  })

  const color = categoryColors[suggestion.category] || '#6366f1'

  return (
    <div className="rounded-lg p-4 border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: `${color}22`, color }}>
              {categoryLabels[suggestion.category] || suggestion.category}
            </span>
            {suggestion.source === 'claude' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
                AI
              </span>
            )}
          </div>
          <h4 className="text-sm font-medium mb-1">{suggestion.title}</h4>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {suggestion.body}
          </p>
        </div>
        {suggestion.status === 'new' && (
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={() => mutation.mutate({ status: 'accepted' })}
              className="px-2.5 py-1 rounded text-xs font-medium"
              style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              Got it
            </button>
            <button onClick={() => mutation.mutate({ status: 'dismissed' })}
              className="px-2.5 py-1 rounded text-xs"
              style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}>
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
