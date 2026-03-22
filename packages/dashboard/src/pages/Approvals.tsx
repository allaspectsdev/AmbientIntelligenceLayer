import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function ApprovalsPage() {
  const qc = useQueryClient()
  const { data: approvals } = useQuery({ queryKey: ['approvals'], queryFn: () => api.getApprovals() })
  const approve = useMutation({ mutationFn: (id: number) => api.approveRequest(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }) })
  const deny = useMutation({ mutationFn: (id: number) => api.denyRequest(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }) })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Pending Approvals</h2>
      {approvals && approvals.length > 0 ? (
        <div className="space-y-3">
          {approvals.map(a => (
            <div key={a.id} className="rounded-lg p-4 border flex items-center justify-between"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full"
                    style={{ background: '#f9731622', color: '#f97316' }}>{a.actionType}</span>
                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(a.requestedAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">Automation #{a.automationId} - Task #{a.agentTaskId}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approve.mutate(a.id)} className="px-3 py-1.5 rounded text-xs font-medium"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>Approve</button>
                <button onClick={() => deny.mutate(a.id)} className="px-3 py-1.5 rounded text-xs"
                  style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}>Deny</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg p-12 border text-center" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No pending approvals.</p>
        </div>
      )}
    </div>
  )
}
