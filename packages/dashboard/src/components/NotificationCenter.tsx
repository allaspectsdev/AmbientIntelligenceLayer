import { useState } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'

export function NotificationCenter() {
  const { isConnected, messages, clearMessages } = useWebSocket()
  const [isOpen, setIsOpen] = useState(false)

  const unread = messages.filter(m => m.type !== 'pong').length

  return (
    <div className="relative">
      {/* Bell icon */}
      <button onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg transition-colors hover:opacity-80"
        style={{ color: 'var(--color-text-muted)' }}>
        <span className="text-lg">{'\u{1F514}'}</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: '#f43f5e', color: '#fff' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-auto rounded-lg border shadow-lg z-50"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-sm font-medium">Notifications</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {messages.length > 0 && (
                <button onClick={clearMessages} className="text-xs" style={{ color: 'var(--color-primary-light)' }}>
                  Clear
                </button>
              )}
            </div>
          </div>
          {messages.length === 0 ? (
            <p className="p-4 text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              No notifications yet
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {messages.map((msg, i) => (
                <div key={i} className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: typeColor(msg.type), color: '#fff' }}>
                      {msg.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {formatPayload(msg.payload)}
                  </p>
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
    case 'coaching_nudge': return '#6366f1'
    case 'pattern_alert': return '#f97316'
    case 'automation_ready': return '#22c55e'
    case 'approval_request': return '#f43f5e'
    default: return '#6366f1'
  }
}

function formatPayload(payload: unknown): string {
  if (typeof payload === 'string') return payload
  if (payload && typeof payload === 'object' && 'title' in payload) return (payload as {title: string}).title
  if (payload && typeof payload === 'object' && 'message' in payload) return (payload as {message: string}).message
  return JSON.stringify(payload).substring(0, 100)
}
