import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { AppUsageSummary } from '../api/client'

const COLORS = ['#0ea5e9', '#06b6d4', '#38bdf8', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#ef4444', '#fbbf24', '#14b8a6']

function fmt(ms: number) {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  if (ms < 3600_000) return `${Math.round(ms / 60_000)}m`
  return `${Math.floor(ms / 3600_000)}h ${Math.round((ms % 3600_000) / 60_000)}m`
}

const tooltipStyle = {
  background: 'rgba(10, 14, 26, 0.95)',
  border: '1px solid rgba(14, 165, 233, 0.15)',
  borderRadius: '8px',
  fontSize: '12px',
  fontFamily: "'DM Sans', sans-serif",
  boxShadow: '0 8px 32px -8px rgba(0,0,0,0.5)',
  padding: '8px 12px',
}

export function AppUsageChart({ data }: { data: AppUsageSummary[] }) {
  const top8 = data.slice(0, 8)
  const barData = top8.map(d => ({
    name: d.appName.length > 16 ? d.appName.substring(0, 16) + '...' : d.appName,
    minutes: Math.round(d.totalDurationMs / 60_000),
    duration: fmt(d.totalDurationMs),
  }))

  if (!data.length) return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" style={{ color: 'var(--color-text-dim)' }}>
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
      <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
        No activity data yet. Start the capture service.
      </p>
    </div>
  )

  return (
    <div className="flex gap-8 flex-wrap" style={{ filter: 'drop-shadow(0 0 8px rgba(14, 165, 233, 0.08))' }}>
      <div className="flex-shrink-0">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie data={top8} dataKey="percentage" nameKey="appName" cx="50%" cy="50%" innerRadius={55} outerRadius={88} paddingAngle={2} strokeWidth={0}>
              {top8.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`${v}%`, n]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 min-w-[300px]">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} layout="vertical" margin={{ left: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={130} tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="minutes" radius={[0, 6, 6, 0]} barSize={14}>
              {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
