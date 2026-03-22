import { useEffect, useRef, useState, useCallback } from 'react'

interface WsMessage {
  type: string
  payload: unknown
  timestamp: number
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<WsMessage[]>([])
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`)

    ws.onopen = () => {
      setIsConnected(true)
      console.log('[WS] Connected')
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsMessage
        if (msg.type === 'pong') return
        setMessages(prev => [msg, ...prev].slice(0, 50))
      } catch { /* ignore */ }
    }

    ws.onclose = () => {
      setIsConnected(false)
      // Reconnect after 3s
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => ws.close()

    wsRef.current = ws
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  const clearMessages = useCallback(() => setMessages([]), [])

  return { isConnected, messages, clearMessages }
}
