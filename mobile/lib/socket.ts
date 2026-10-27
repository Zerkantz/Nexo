// Cliente de Socket.io (sección 12). Conecta el Móvil con el Backend y el Smartwatch Wear OS.
import { io, type Socket } from 'socket.io-client';
import { SERVER_URL } from './config';
import type { ApiError, Direction, GameEnded, GameEvent, SessionState } from './types';

export interface WatchCommandPayload {
  type:
    | 'HACK_STARTED'
    | 'HACK_RESOLVED'
    | 'SKILL_ACTIVATED'
    | 'COOP_PING'
    | 'COOP_TRANSFER_BATTERY';
  targetId?: string;
  minigame?: string;
  success?: boolean;
  skill?: string;
  cost?: number;
  pingType?: string;
  amount?: number;
}

// Eventos que el servidor manda al móvil
export interface ServerToClientEvents {
  'pairing:linked': (data: { watch: unknown }) => void;
  'pairing:code_requested': (data: { code: string; expiresAt: string }) => void;
  'session:state': (state: SessionState) => void;
  'watch:command': (cmd: WatchCommandPayload) => void;
  'game:event': (event: GameEvent) => void;
  'game:ended': (data: GameEnded) => void;
  error: (err: ApiError) => void;
}

// Eventos que el móvil manda al servidor
export interface ClientToServerEvents {
  'session:join': (data: { sessionId: string }) => void;
  'session:sync': (data: { state: SessionState; profile?: unknown }) => void;
  'mobile:request_watch_hack': (data: { targetId?: string }) => void;
  'game:move': (data: { dir: Direction }) => void;
  'game:wait': (data: Record<string, never>) => void;
  'session:leave': (data: Record<string, never>) => void;
}

export type NexoSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: NexoSocket | null = null;

export function connectSocket(token = 'nexo_mobile_jwt_1'): NexoSocket {
  if (socket) return socket;
  socket = io(SERVER_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
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
