import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function AgentsPage() {
  const qc = useQueryClient()
  const [newAgent, setNewAgent] = useState({ name: '', type: 'general' })
  const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: () => api.getAgents() })
  
  const create = useMutation({
    mutationFn: () => api.createAgent(newAgent.name, newAgent.type),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agents'] }); setNewAgent({ name: '', type: 'general' }) },
  })
  const start = useMutation({ mutationFn: (id: number) => api.startAgent(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }) })
  const stop = useMutation({ mutationFn: (id: number) => api.stopAgent(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }) })

  const statusColor: Record<string, string> = { idle: '#9898b0', running: '#22c55e', paused: '#f97316', stopped: '#f43f5e' }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Agents</h2>
      <div className="rounded-lg p-5 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h3 className="text-sm font-medium mb-3">Create Agent</h3>
        <div className="flex gap-2">
          <input type="text" placeholder="Agent name" value={newAgent.name}
            onChange={e => setNewAgent(p => ({ ...p, name: e.target.value }))}
            className="flex-1 rounded px-3 py-1.5 text-sm border"
            style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
          <select value={newAgent.type} onChange={e => setNewAgent(p => ({ ...p, type: e.target.value }))}
            className="rounded px-3 py-1.5 text-sm border"
            style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
            <option value="general">General</option>
            <option value="automation">Automation Runner</option>
            <option value="monitor">Monitor</option>
          </select>
          <button onClick={() => newAgent.name && create.mutate()}
            className="px-4 py-1.5 rounded text-sm font-medium" style={{ background: 'var(--color-primary)', color: '#fff' }}>
            Create
          </button>
        </div>
      </div>
      {agents && agents.length > 0 ? (
        <div className="space-y-3">
          {agents.map(a => (
            <div key={a.id} className="rounded-lg p-4 border flex items-center justify-between"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full" style={{ background: statusColor[a.status] || '#9898b0' }} />
                <div>
                  <h4 className="text-sm font-medium">{a.name}</h4>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{a.type} - {a.status}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {a.status !== 'running' && (
                  <button onClick={() => start.mutate(a.id)} className="px-3 py-1 rounded text-xs"
                    style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>Start</button>
                )}
                {a.status === 'running' && (
                  <button onClick={() => stop.mutate(a.id)} className="px-3 py-1 rounded text-xs"
                    style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}>Stop</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg p-12 border text-center" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No agents created yet.</p>
        </div>
      )}
    </div>
  )
}
