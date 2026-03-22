import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { NotificationCenter } from './NotificationCenter'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '\u25C9' },
  { path: '/activity', label: 'Activity', icon: '\u2261' },
  { path: '/screenshots', label: 'Screenshots', icon: '\u25FB' },
  { path: '/patterns', label: 'Patterns', icon: '\u27C1' },
  { path: '/automations', label: 'Automations', icon: '\u2699' },
  { path: '/agents', label: 'Agents', icon: '\u2B21' },
  { path: '/approvals', label: 'Approvals', icon: '\u2713' },
  { path: '/audit', label: 'Audit Log', icon: '\u2637' },
  { path: '/settings', label: 'Settings', icon: '\u2630' },
]

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <nav className="w-56 flex-shrink-0 flex flex-col border-r"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--color-primary-light)' }}>AIL</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Ambient Intelligence Layer</p>
          </div>
          <NotificationCenter />
        </div>
        <div className="flex-1 py-3 overflow-auto">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2 text-sm transition-colors ${isActive ? 'font-medium' : ''}`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              })}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="p-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>v0.2.0</div>
      </nav>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
