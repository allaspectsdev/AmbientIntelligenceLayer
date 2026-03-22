import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { AppUsageSummary } from '../api/client'

const COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4',
]

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  if (ms < 3600_000) return `${Math.round(ms / 60_000)}m`
  const h = Math.floor(ms / 3600_000)
  const m = Math.round((ms % 3600_000) / 60_000)
  return `${h}h ${m}m`
}

interface Props {
  data: AppUsageSummary[]
}

export function AppUsageChart({ data }: Props) {
  const top8 = data.slice(0, 8)
  const barData = top8.map(d => ({
    name: d.appName.length > 15 ? d.appName.substring(0, 15) + '...' : d.appName,
    minutes: Math.round(d.totalDurationMs / 60_000),
    fullName: d.appName,
    duration: formatDuration(d.totalDurationMs),
  }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm"
        style={{ color: 'var(--color-text-muted)' }}>
        No activity data yet. Start the capture service to begin tracking.
      </div>
    )
  }

  return (
    <div className="flex gap-6 flex-wrap">
      <div className="flex-shrink-0">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={top8}
              dataKey="percentage"
              nameKey="appName"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={2}
            >
              {top8.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1e1e2e', border: '1px solid #3b3b54', borderRadius: '6px', fontSize: '12px' }}
              formatter={(value: number, name: string) => [`${value}%`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 min-w-[300px]">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} layout="vertical" margin={{ left: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#9898b0', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#1e1e2e', border: '1px solid #3b3b54', borderRadius: '6px', fontSize: '12px' }}
            />
            <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
              {barData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
