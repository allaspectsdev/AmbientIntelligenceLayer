import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export function AuditPage() {
  const [filters, setFilters] = useState<{ actor?: string; riskLevel?: string }>({})
  const { data: entries } = useQuery({
    queryKey: ['audit', filters],
    queryFn: () => api.getAuditLog({ ...filters, limit: 200 }),
  })

  const riskColors: Record<string, string> = { safe: '#22c55e', moderate: '#f97316', risky: '#f43f5e' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Audit Log</h2>
        <div className="flex gap-2">
          <select value={filters.riskLevel || ''} onChange={e => setFilters(p => ({ ...p, riskLevel: e.target.value || undefined }))}
            className="rounded px-3 py-1.5 text-xs border"
            style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
            <option value="">All risk levels</option>
            <option value="safe">Safe</option>
            <option value="moderate">Moderate</option>
            <option value="risky">Risky</option>
          </select>
        </div>
      </div>
      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead><tr style={{ background: 'var(--color-surface-alt)' }}>
            <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Time</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Actor</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Action</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Resource</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Risk</th>
          </tr></thead>
          <tbody>
            {entries?.map(e => (
              <tr key={e.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>{new Date(e.timestamp).toLocaleString()}</td>
                <td className="px-4 py-2 text-xs">{e.actor}</td>
                <td className="px-4 py-2 text-xs font-medium">{e.action}</td>
                <td className="px-4 py-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>{e.resourceType} {e.resourceId ? `#${e.resourceId}` : ''}</td>
                <td className="px-4 py-2"><span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: `${riskColors[e.riskLevel] || '#22c55e'}22`, color: riskColors[e.riskLevel] || '#22c55e' }}>{e.riskLevel}</span></td>
              </tr>
            ))}
            {(!entries || !entries.length) && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>No audit entries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
