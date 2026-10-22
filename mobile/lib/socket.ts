// Cliente de Socket.io (sección 12). Una sola conexión para toda la app.
import { io, type Socket } from 'socket.io-client';
import { SERVER_URL } from './config';
import type { ApiError, Direction, GameEnded, GameEvent, SessionState } from './types';

// Eventos que el servidor manda al móvil
export interface ServerToClientEvents {
  'pairing:linked': (data: { watch: unknown }) => void;
  'session:state': (state: SessionState) => void;
  'game:event': (event: GameEvent) => void;
  'game:ended': (data: GameEnded) => void;
  error: (err: ApiError) => void;
}

// Eventos que el móvil manda al servidor (solo intenciones, el servidor decide)
export interface ClientToServerEvents {
  'session:join': (data: { sessionId: string }) => void;
  'game:move': (data: { dir: Direction }) => void;
  'game:wait': (data: Record<string, never>) => void;
  'session:leave': (data: Record<string, never>) => void;
}

export type NexoSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: NexoSocket | null = null;

export function connectSocket(token: string): NexoSocket {
  if (socket) return socket;
  socket = io(SERVER_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true, // reconexión automática (ver riesgos, sección 19)
  });
  return socket;
}

export function getSocket(): NexoSocket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
