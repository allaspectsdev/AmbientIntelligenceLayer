import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

const tierConfig: Record<number, { label: string; color: string; desc: string }> = {
  1: { label: 'Hardcoded', color: 'var(--color-success)', desc: 'Zero tokens — deterministic script' },
  2: { label: 'Template', color: 'var(--color-primary)', desc: 'Zero tokens — params resolved at runtime' },
  3: { label: 'Rules', color: 'var(--color-accent)', desc: 'Zero tokens — conditional logic' },
  4: { label: 'Agentic', color: 'var(--color-danger)', desc: 'LLM required at runtime' },
}
const statusColors: Record<string, string> = { draft: 'var(--color-text-dim)', ready: 'var(--color-primary)', active: 'var(--color-success)', disabled: 'var(--color-danger)' }
const riskColors: Record<string, string> = { safe: 'var(--color-success)', moderate: 'var(--color-warning)', risky: 'var(--color-danger)' }

export function AutomationsPage() {
  const qc = useQueryClient()
  const { data: automations } = useQuery({ queryKey: ['automations'], queryFn: () => api.getAutomations() })
  const { data: stats } = useQuery({ queryKey: ['tier-stats'], queryFn: () => api.getTierStats() })
  const execute = useMutation({ mutationFn: (id: number) => api.executeAutomation(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }) })
  const dryRun = useMutation({ mutationFn: (id: number) => api.dryRunAutomation(id) })

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl animate-in" style={{ '--delay': 0 } as React.CSSProperties}>Automations</h2>

      {/* Tier distribution summary */}
      {stats && (stats as Record<string, unknown>).total ? (
        <div className="glass p-5 animate-in" style={{ '--delay': 1 } as React.CSSProperties}>
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-dim)' }}>Execution Strategy</p>
              <div className="flex gap-3">
                {[1, 2, 3, 4].map(t => {
                  const tier = tierConfig[t]
                  const count = ((stats as Record<string, Record<number, number>>).counts || {})[t] || 0
                  return (
                    <div key={t} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: tier.color }} />
                      <span className="text-xs font-mono">{count} {tier.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="ml-auto text-right">
              <p className="font-mono text-xl text-gradient font-medium">{(stats as Record<string, unknown>).deterministicPercentage || 0}%</p>
              <p className="text-[10px] font-mono" style={{ color: 'var(--color-text-dim)' }}>zero-token execution</p>
            </div>
            {((stats as Record<string, unknown>).estimatedTokenSavings as number) > 0 && (
              <div className="text-right">
                <p className="font-mono text-xl text-gradient-accent font-medium">~{((stats as Record<string, unknown>).estimatedTokenSavings as number).toLocaleString()}</p>
                <p className="text-[10px] font-mono" style={{ color: 'var(--color-text-dim)' }}>tokens saved</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Automation list */}
      {automations && automations.length > 0 ? (
        <div className="space-y-3">
          {automations.map((a, i) => {
            const tier = tierConfig[a.executionTier || 1] || tierConfig[1]
            return (
              <div key={a.id} className="glass glass-hover p-5 animate-in" style={{ '--delay': i + 2 } as React.CSSProperties}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {/* Tier badge — most prominent */}
                      <span className="badge font-mono" style={{ background: `color-mix(in srgb, ${tier.color} 15%, transparent)`, color: tier.color, border: `1px solid color-mix(in srgb, ${tier.color} 25%, transparent)` }}>
                        T{a.executionTier || 1} {tier.label}
                      </span>
                      <span className="badge" style={{ background: `color-mix(in srgb, ${statusColors[a.status] || '#94a3b8'} 15%, transparent)`, color: statusColors[a.status] }}>{a.status}</span>
                      <span className="badge" style={{ background: `color-mix(in srgb, ${riskColors[a.riskLevel] || '#10b981'} 15%, transparent)`, color: riskColors[a.riskLevel] }}>{a.riskLevel}</span>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-dim)' }}>{a.type}</span>
                    </div>
                    <h4 className="text-sm font-medium mb-1">{a.name}</h4>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{a.description}</p>
                    <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--color-text-dim)' }}>{tier.desc}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-4">
                    <button onClick={() => dryRun.mutate(a.id)} className="btn-ghost px-3 py-1.5 text-xs">Preview</button>
                    <button onClick={() => execute.mutate(a.id)} className="btn-primary px-3 py-1.5 text-xs">Run</button>
                  </div>
                </div>
                {dryRun.data && dryRun.variables === a.id && (
                  <pre className="mt-3 p-3 rounded-lg font-mono text-xs overflow-auto max-h-48" style={{ background: 'rgba(10,14,26,0.6)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                    {(dryRun.data as {preview: string}).preview}
                  </pre>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass p-16 flex flex-col items-center gap-4 animate-in" style={{ '--delay': 2 } as React.CSSProperties}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" style={{ color: 'var(--color-text-dim)' }}>
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>No automations generated yet.</p>
          <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Generate from high-confidence patterns — the AI writes it once, it runs forever.</p>
        </div>
      )}
    </div>
  )
}
