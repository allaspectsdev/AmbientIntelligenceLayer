import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

const statusColors: Record<string, string> = { idle: 'var(--color-text-dim)', running: 'var(--color-success)', paused: 'var(--color-warning)', stopped: 'var(--color-danger)' }

export function AgentsPage() {
  const qc = useQueryClient()
  const [newAgent, setNewAgent] = useState({ name: '', type: 'general' })
  const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: () => api.getAgents() })
  const create = useMutation({ mutationFn: () => api.createAgent(newAgent.name, newAgent.type), onSuccess: () => { qc.invalidateQueries({ queryKey: ['agents'] }); setNewAgent({ name: '', type: 'general' }) } })
  const start = useMutation({ mutationFn: (id: number) => api.startAgent(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }) })
  const stop = useMutation({ mutationFn: (id: number) => api.stopAgent(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }) })

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl animate-in" style={{ '--delay': 0 } as React.CSSProperties}>Agents</h2>
      <div className="glass p-5 animate-in" style={{ '--delay': 1 } as React.CSSProperties}>
        <h3 className="text-[11px] font-mono uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-dim)' }}>Create Agent</h3>
        <div className="flex gap-2">
          <input type="text" placeholder="Agent name" value={newAgent.name}
            onChange={e => setNewAgent(p => ({ ...p, name: e.target.value }))}
            className="flex-1 input-glass px-3 py-2 text-sm" />
          <select value={newAgent.type} onChange={e => setNewAgent(p => ({ ...p, type: e.target.value }))}
            className="input-glass px-3 py-2 text-sm">
            <option value="general">General</option>
            <option value="automation">Automation Runner</option>
            <option value="monitor">Monitor</option>
          </select>
          <button onClick={() => newAgent.name && create.mutate()} className="btn-primary px-4 py-2 text-sm">Create</button>
        </div>
      </div>
      {agents && agents.length > 0 ? (
        <div className="space-y-3">
          {agents.map((a, i) => (
            <div key={a.id} className="glass glass-hover p-4 flex items-center justify-between animate-in" style={{ '--delay': i + 2 } as React.CSSProperties}>
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${a.status === 'running' ? 'status-pulse' : ''}`} style={{ background: statusColors[a.status] || 'var(--color-text-dim)' }} />
                <div>
                  <h4 className="text-sm font-medium">{a.name}</h4>
                  <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-dim)' }}>{a.type} &middot; {a.status}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {a.status !== 'running' && <button onClick={() => start.mutate(a.id)} className="btn-ghost px-3 py-1.5 text-xs" style={{ borderColor: 'rgba(16,185,129,0.2)', color: 'var(--color-success)' }}>Start</button>}
                {a.status === 'running' && <button onClick={() => stop.mutate(a.id)} className="btn-ghost px-3 py-1.5 text-xs" style={{ borderColor: 'rgba(239,68,68,0.2)', color: 'var(--color-danger)' }}>Stop</button>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-16 flex flex-col items-center gap-4 animate-in" style={{ '--delay': 2 } as React.CSSProperties}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" style={{ color: 'var(--color-text-dim)' }}>
            <path d="M12 8a4 4 0 100-8 4 4 0 000 8z M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>No agents created yet.</p>
        </div>
      )}
    </div>
  )
}
