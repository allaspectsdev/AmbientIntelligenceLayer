import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function ApprovalsPage() {
  const qc = useQueryClient()
  const { data: approvals } = useQuery({ queryKey: ['approvals'], queryFn: () => api.getApprovals() })
  const approve = useMutation({ mutationFn: (id: number) => api.approveRequest(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }) })
  const deny = useMutation({ mutationFn: (id: number) => api.denyRequest(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }) })

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl animate-in" style={{ '--delay': 0 } as React.CSSProperties}>Pending Approvals</h2>
      {approvals && approvals.length > 0 ? (
        <div className="space-y-3">
          {approvals.map((a, i) => (
            <div key={a.id} className="glass glass-hover p-4 flex items-center justify-between animate-in"
              style={{ '--delay': i + 1, borderLeft: '3px solid var(--color-accent)' } as React.CSSProperties}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--color-accent)' }}>{a.actionType}</span>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-dim)' }}>{new Date(a.requestedAt).toLocaleString()}</span>
                </div>
                <p className="text-sm font-mono">Automation #{a.automationId} &middot; Task #{a.agentTaskId}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approve.mutate(a.id)} className="btn-primary px-3 py-1.5 text-xs" style={{ background: 'linear-gradient(135deg, var(--color-success), #059669)' }}>Approve</button>
                <button onClick={() => deny.mutate(a.id)} className="btn-ghost px-3 py-1.5 text-xs" style={{ borderColor: 'rgba(239,68,68,0.2)', color: 'var(--color-danger)' }}>Deny</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-16 flex flex-col items-center gap-4 animate-in" style={{ '--delay': 1 } as React.CSSProperties}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" style={{ color: 'var(--color-text-dim)' }}>
            <path d="M9 12l2 2 4-4 M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>No pending approvals.</p>
        </div>
      )}
    </div>
  )
}
