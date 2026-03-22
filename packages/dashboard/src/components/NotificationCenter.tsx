import { useState } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'

export function NotificationCenter() {
  const { isConnected, messages, clearMessages } = useWebSocket()
  const [isOpen, setIsOpen] = useState(false)
  const unread = messages.filter(m => m.type !== 'pong').length

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg transition-all hover:bg-white/[0.04]"
        style={{ color: 'var(--color-text-muted)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: 'var(--color-danger)', color: '#fff', boxShadow: '0 0 8px rgba(239,68,68,0.4)' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-auto glass animate-slide-in z-50"
          style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-xs font-medium">Notifications</span>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'status-pulse' : ''}`}
                style={{ background: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }} />
              {messages.length > 0 && (
                <button onClick={clearMessages} className="text-[10px] font-mono" style={{ color: 'var(--color-primary)' }}>Clear</button>
              )}
            </div>
          </div>
          {messages.length === 0 ? (
            <p className="p-6 text-xs text-center" style={{ color: 'var(--color-text-dim)' }}>No notifications</p>
          ) : (
            <div>
              {messages.map((msg, i) => (
                <div key={i} className="p-3 border-b transition-colors hover:bg-white/[0.02]" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge" style={{ background: `${typeColor(msg.type)}1a`, color: typeColor(msg.type) }}>
                      {msg.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-dim)' }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatPayload(msg.payload)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function typeColor(type: string): string {
  switch (type) {
    case 'coaching_nudge': return '#0ea5e9'
    case 'pattern_alert': return '#f59e0b'
    case 'automation_ready': return '#10b981'
    case 'approval_request': return '#ef4444'
    default: return '#0ea5e9'
  }
}

function formatPayload(payload: unknown): string {
  if (typeof payload === 'string') return payload
  if (payload && typeof payload === 'object' && 'title' in payload) return (payload as {title: string}).title
  if (payload && typeof payload === 'object' && 'message' in payload) return (payload as {message: string}).message
  return JSON.stringify(payload).substring(0, 100)
}
