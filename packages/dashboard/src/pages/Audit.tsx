import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

const riskColors: Record<string, string> = { safe: 'var(--color-success)', moderate: 'var(--color-warning)', risky: 'var(--color-danger)' }

export function AuditPage() {
  const [filters, setFilters] = useState<{ riskLevel?: string }>({})
  const { data: entries } = useQuery({ queryKey: ['audit', filters], queryFn: () => api.getAuditLog({ ...filters, limit: 200 }) })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between animate-in" style={{ '--delay': 0 } as React.CSSProperties}>
        <h2 className="font-display text-3xl">Audit Log</h2>
        <select value={filters.riskLevel || ''} onChange={e => setFilters({ riskLevel: e.target.value || undefined })}
          className="input-glass px-3 py-1.5 text-xs font-mono">
          <option value="">All levels</option>
          <option value="safe">Safe</option>
          <option value="moderate">Moderate</option>
          <option value="risky">Risky</option>
        </select>
      </div>
      <div className="glass overflow-hidden animate-in" style={{ '--delay': 1 } as React.CSSProperties}>
        <table className="w-full text-sm table-glass">
          <thead>
            <tr>
              <th className="text-left px-4 py-3 text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Time</th>
              <th className="text-left px-4 py-3 text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Actor</th>
              <th className="text-left px-4 py-3 text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Action</th>
              <th className="text-left px-4 py-3 text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Resource</th>
              <th className="text-left px-4 py-3 text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Risk</th>
            </tr>
          </thead>
          <tbody>
            {entries?.map(e => (
              <tr key={e.id}>
                <td className="px-4 py-2.5 font-mono text-xs" style={{ color: 'var(--color-text-dim)' }}>{new Date(e.timestamp).toLocaleString()}</td>
                <td className="px-4 py-2.5 text-xs font-medium">{e.actor}</td>
                <td className="px-4 py-2.5 text-xs font-mono" style={{ color: 'var(--color-primary-light)' }}>{e.action}</td>
                <td className="px-4 py-2.5 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{e.resourceType} {e.resourceId ? `#${e.resourceId}` : ''}</td>
                <td className="px-4 py-2.5">
                  <span className="badge" style={{ background: `color-mix(in srgb, ${riskColors[e.riskLevel] || 'var(--color-success)'} 15%, transparent)`, color: riskColors[e.riskLevel] || 'var(--color-success)' }}>{e.riskLevel}</span>
                </td>
              </tr>
            ))}
            {(!entries || !entries.length) && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-text-dim)' }}>No audit entries yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
