import { NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { NotificationCenter } from './NotificationCenter'

const Icon = ({ d, ...props }: { d: string } & React.SVGProps<SVGSVGElement>) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d={d} />
  </svg>
)

const sections = [
  {
    label: 'Core',
    items: [
      { path: '/', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M9 22V12h6v10' },
      { path: '/activity', label: 'Activity', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
      { path: '/screenshots', label: 'Screenshots', icon: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8z' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { path: '/patterns', label: 'Patterns', icon: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5' },
      { path: '/automations', label: 'Automations', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
      { path: '/agents', label: 'Agents', icon: 'M12 8a4 4 0 100-8 4 4 0 000 8z M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 8v4 M10 10h4' },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/approvals', label: 'Approvals', icon: 'M9 12l2 2 4-4 M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z' },
      { path: '/audit', label: 'Audit Log', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
      { path: '/settings', label: 'Settings', icon: 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6' },
    ],
  },
]

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <nav className="w-60 flex-shrink-0 flex flex-col glass" style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}>
        {/* Brand */}
        <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl tracking-tight" style={{ color: 'var(--color-primary-light)' }}>
                Ambient Intelligence
              </h1>
              <p className="text-[11px] mt-0.5 font-mono" style={{ color: 'var(--color-text-dim)' }}>
                observatory v0.2.0
              </p>
            </div>
            <NotificationCenter />
          </div>
        </div>

        {/* Nav sections */}
        <div className="flex-1 py-2 overflow-auto">
          {sections.map((section, si) => (
            <div key={section.label}>
              {si > 0 && <div className="mx-5 my-2 border-t" style={{ borderColor: 'var(--color-border)' }} />}
              <div className="px-5 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-dim)' }}>
                  {section.label}
                </span>
              </div>
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-5 py-2 mx-2 rounded-lg text-[13px] transition-all ${isActive ? 'font-medium' : ''}`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                    background: isActive ? 'rgba(14, 165, 233, 0.08)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                    boxShadow: isActive ? 'inset 3px 0 8px -4px rgba(14, 165, 233, 0.3)' : 'none',
                  })}
                >
                  <Icon d={item.icon} style={{ opacity: 0.7 }} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center gap-2" style={{ borderColor: 'var(--color-border)' }}>
          <span className="w-1.5 h-1.5 rounded-full status-pulse" style={{ background: 'var(--color-success)' }} />
          <span className="text-[11px] font-mono" style={{ color: 'var(--color-text-dim)' }}>system active</span>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">
        <div key={location.pathname} className="animate-in" style={{ '--delay': 0 } as React.CSSProperties}>
          {children}
        </div>
      </main>
    </div>
  )
}
