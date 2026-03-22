import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function SettingsPage() {
  const qc = useQueryClient()
  const [exc, setExc] = useState({ type: 'app', pattern: '' })
  const [result, setResult] = useState<string | null>(null)
  const { data: exclusions } = useQuery({ queryKey: ['exclusions'], queryFn: () => api.getExclusions() })
  const { data: credentials } = useQuery({ queryKey: ['credentials'], queryFn: () => api.getCredentials() })
  const addExc = useMutation({ mutationFn: () => api.addExclusion(exc.type, exc.pattern), onSuccess: () => { qc.invalidateQueries({ queryKey: ['exclusions'] }); setExc(p => ({ ...p, pattern: '' })) } })
  const rmExc = useMutation({ mutationFn: (id: number) => api.removeExclusion(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['exclusions'] }) })
  const rmCred = useMutation({ mutationFn: (id: number) => api.deleteCredential(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['credentials'] }) })
  const analyze = useMutation({
    mutationFn: () => api.triggerAnalysis(),
    onSuccess: (d) => { setResult(`${d.patternsFound} patterns, ${d.suggestionsGenerated} suggestions`); qc.invalidateQueries({ queryKey: ['patterns'] }); qc.invalidateQueries({ queryKey: ['suggestions'] }) },
    onError: (e) => setResult(`Error: ${(e as Error).message}`),
  })
  const { data: health } = useQuery({ queryKey: ['health'], queryFn: () => api.health(), retry: false })

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="font-display text-3xl animate-in" style={{ '--delay': 0 } as React.CSSProperties}>Settings</h2>

      <Sec title="System Status" delay={1}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${health ? 'status-pulse' : ''}`} style={{ background: health ? 'var(--color-success)' : 'var(--color-danger)' }} />
          <span className="text-sm font-mono">{health ? 'Connected' : 'Disconnected'}</span>
        </div>
      </Sec>

      <Sec title="Analysis" delay={2}>
        <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>Trigger pattern detection and AI coaching analysis.</p>
        <button onClick={() => analyze.mutate()} disabled={analyze.isPending} className="btn-primary px-4 py-2 text-sm">
          {analyze.isPending ? 'Analyzing...' : 'Run Analysis Now'}
        </button>
        {result && <p className="text-xs font-mono mt-2" style={{ color: 'var(--color-primary-light)' }}>{result}</p>}
      </Sec>

      <Sec title="Privacy Exclusions" delay={3}>
        <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>Excluded apps and patterns are never recorded.</p>
        <div className="flex gap-2 mb-4">
          <select value={exc.type} onChange={e => setExc(p => ({ ...p, type: e.target.value }))} className="input-glass px-3 py-2 text-sm">
            <option value="app">App Name</option>
            <option value="title_regex">Title Regex</option>
            <option value="url_regex">URL Regex</option>
            <option value="path_regex">Path Regex</option>
          </select>
          <input type="text" placeholder="e.g., 1Password" value={exc.pattern}
            onChange={e => setExc(p => ({ ...p, pattern: e.target.value }))}
            className="flex-1 input-glass px-3 py-2 text-sm" />
          <button onClick={() => exc.pattern && addExc.mutate()} className="btn-primary px-3 py-2 text-sm">Add</button>
        </div>
        {exclusions?.map(r => (
          <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg mb-2" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2">
              <span className="badge" style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--color-primary)' }}>{r.type}</span>
              <span className="text-sm font-mono">{r.pattern}</span>
            </div>
            <button onClick={() => rmExc.mutate(r.id)} className="text-xs font-mono" style={{ color: 'var(--color-danger)' }}>Remove</button>
          </div>
        ))}
      </Sec>

      <Sec title="Credentials" delay={4}>
        <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>Encrypted credentials for agent automations.</p>
        {credentials?.map(c => (
          <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg mb-2" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{c.name}</span>
              {c.service && <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-dim)' }}>{c.service}</span>}
            </div>
            <button onClick={() => rmCred.mutate(c.id)} className="text-xs font-mono" style={{ color: 'var(--color-danger)' }}>Delete</button>
          </div>
        ))}
        {(!credentials || credentials.length === 0) && <p className="text-xs font-mono" style={{ color: 'var(--color-text-dim)' }}>No credentials stored.</p>}
      </Sec>

      <Sec title="About" delay={5}>
        <div className="text-xs font-mono space-y-1" style={{ color: 'var(--color-text-dim)' }}>
          <p>Ambient Intelligence Layer v0.2.0</p>
          <p>All data stored locally. AES-256-GCM encrypted credentials.</p>
        </div>
      </Sec>
    </div>
  )
}

function Sec({ title, delay, children }: { title: string; delay: number; children: React.ReactNode }) {
  return (
    <div className="glass p-5 animate-in" style={{ '--delay': delay } as React.CSSProperties}>
      <h3 className="text-[11px] font-mono uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-dim)' }}>{title}</h3>
      {children}
    </div>
  )
}
