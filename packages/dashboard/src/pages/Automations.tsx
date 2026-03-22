import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

const riskColors: Record<string, string> = { safe: '#22c55e', moderate: '#f97316', risky: '#f43f5e' }
const statusColors: Record<string, string> = { draft: '#9898b0', ready: '#6366f1', active: '#22c55e', disabled: '#f43f5e' }

export function AutomationsPage() {
  const qc = useQueryClient()
  const { data: automations } = useQuery({ queryKey: ['automations'], queryFn: () => api.getAutomations() })

  const execute = useMutation({
    mutationFn: (id: number) => api.executeAutomation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  })

  const dryRun = useMutation({
    mutationFn: (id: number) => api.dryRunAutomation(id),
  })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Automations</h2>
      {automations && automations.length > 0 ? (
        <div className="space-y-3">
          {automations.map(a => (
            <div key={a.id} className="rounded-lg p-4 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full"
                      style={{ background: `${statusColors[a.status] || '#6366f1'}22`, color: statusColors[a.status] || '#6366f1' }}>
                      {a.status}
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full"
                      style={{ background: `${riskColors[a.riskLevel] || '#22c55e'}22`, color: riskColors[a.riskLevel] || '#22c55e' }}>
                      {a.riskLevel}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}>
                      {a.type}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium">{a.name}</h4>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{a.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => dryRun.mutate(a.id)}
                    className="px-3 py-1.5 rounded text-xs" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}>
                    Preview
                  </button>
                  <button onClick={() => execute.mutate(a.id)}
                    className="px-3 py-1.5 rounded text-xs font-medium" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                    Run
                  </button>
                </div>
              </div>
              {dryRun.data && dryRun.variables === a.id && (
                <pre className="mt-3 p-3 rounded text-xs overflow-auto max-h-48"
                  style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}>
                  {(dryRun.data as {preview: string}).preview}
                </pre>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg p-12 border text-center" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>No automations generated yet.</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Go to Patterns and generate automations from high-confidence patterns.
          </p>
        </div>
      )}
    </div>
  )
}
