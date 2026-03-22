import type { FastifyInstance } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type { WsMessage, WsMessageType } from '@ail/common';

const clients = new Set<WebSocket>();

export async function setupWebSocket(app: FastifyInstance) {
  const websocketPlugin = await import('@fastify/websocket');
  await app.register(websocketPlugin.default);

  app.get('/api/ws', { websocket: true }, (socket) => {
    clients.add(socket);
    console.log(`[WS] Client connected (${clients.size} total)`);

    socket.on('close', () => {
      clients.delete(socket);
      console.log(`[WS] Client disconnected (${clients.size} total)`);
    });

    socket.on('message', (data) => {
      // Clients can send acknowledgements, but we don't process them yet
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch {
        // Ignore malformed messages
      }
    });
  });
}

/**
 * Broadcast a message to all connected WebSocket clients.
 * Call this from any route handler to push real-time updates.
 */
export function broadcast(type: WsMessageType, payload: unknown): void {
  const message: WsMessage = { type, payload, timestamp: Date.now() };
  const data = JSON.stringify(message);

  for (const client of clients) {
    try {
      if (client.readyState === 1) { // OPEN
        client.send(data);
      }
    } catch {
      clients.delete(client);
    }
  }
}

export function getClientCount(): number {
  return clients.size;
}
