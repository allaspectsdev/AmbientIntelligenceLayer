import { useEffect, useRef, useState, useCallback } from 'react'

interface WsMessage {
  type: string
  payload: unknown
  timestamp: number
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const mountedRef = useRef(true)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<WsMessage[]>([])
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`)

    ws.onopen = () => {
      if (mountedRef.current) setIsConnected(true)
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      try {
        const msg = JSON.parse(event.data) as WsMessage
        if (msg.type === 'pong') return
        setMessages(prev => [msg, ...prev].slice(0, 50))
      } catch { /* ignore */ }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      setIsConnected(false)
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => ws.close()

    wsRef.current = ws
  }, [])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  const clearMessages = useCallback(() => setMessages([]), [])

  return { isConnected, messages, clearMessages }
}
