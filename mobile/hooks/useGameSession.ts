// Conecta la pantalla de juego con el servidor (o con el estado falso si sessionId === 'demo').
// El móvil NO calcula el juego: manda intenciones y guarda el último `session:state`.
import { useCallback, useEffect, useState } from 'react';
import { connectSocket, getSocket } from '../lib/socket';
import { getToken } from '../lib/tokenStorage';
import type { ApiError, Direction, GameEnded, GameEvent, SessionState } from '../lib/types';
import { mockLevel1State } from '../mocks/sessionState';
import { mockMove, mockWait } from '../mocks/mockEngine';

export const DEMO_SESSION_ID = 'demo';

export function useGameSession(sessionId: string) {
  const isDemo = sessionId === DEMO_SESSION_ID;

  const [state, setState] = useState<SessionState | null>(isDemo ? mockLevel1State : null);
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [ended, setEnded] = useState<GameEnded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transitioningRoom, setTransitioningRoom] = useState<string | null>(null);

  // ----- Modo real: Socket.io -----
  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;

    const onState = (s: SessionState) => setState(s);
    const onEvent = (e: GameEvent) => setLastEvent(e);
    const onEnded = (data: GameEnded) => setEnded(data);
    const onError = (err: ApiError) => setError(err.message);
    const join = () => getSocket()?.emit('session:join', { sessionId });

    (async () => {
      const token = await getToken();
      if (cancelled) return;
      if (!token) {
        setError('Inicia sesión para jugar');
        return;
      }
      const socket = connectSocket(token);
      socket.on('session:state', onState);
      socket.on('game:event', onEvent);
      socket.on('game:ended', onEnded);
      socket.on('error', onError);
      // Al (re)conectar se vuelve a pedir el estado completo (sección 19)
      socket.on('connect', join);
      if (socket.connected) join();
    })();

    return () => {
      cancelled = true;
      const socket = getSocket();
      socket?.off('session:state', onState);
      socket?.off('game:event', onEvent);
      socket?.off('game:ended', onEnded);
      socket?.off('error', onError);
      socket?.off('connect', join);
    };
  }, [isDemo, sessionId]);

  // ----- Modo demo: simular el fin de la partida -----
  useEffect(() => {
    if (!isDemo || !state || ended) return;
    if (state.status === 'WON') {
      setEnded({ result: 'WON', rewards: { credits: 250, energy: 60, intel: 30 }, unlockedSkill: 'OVERLOAD' });
    } else if (state.status === 'LOST') {
      setEnded({ result: 'LOST', rewards: { credits: 0, energy: 0, intel: 0 } });
    }
  }, [isDemo, state, ended]);

  // ----- Intenciones del jugador -----
  const move = useCallback(
    (dir: Direction) => {
      if (isDemo) {
        setState((s) => {
          if (!s) return s;
          return mockMove(s, dir, (nextRoom) => {
            setTransitioningRoom(nextRoom.roomName ?? 'NUEVO SECTOR');
          });
        });
      } else {
        getSocket()?.emit('game:move', { dir });
      }
    },
    [isDemo],
  );

  const wait = useCallback(() => {
    if (isDemo) setState((s) => (s ? mockWait(s) : s));
    else getSocket()?.emit('game:wait', {});
  }, [isDemo]);

  const leave = useCallback(() => {
    if (!isDemo) getSocket()?.emit('session:leave', {});
  }, [isDemo]);

  const clearTransition = useCallback(() => {
    setTransitioningRoom(null);
  }, []);

  /** Solo demo: reinicia la partida falsa. */
  const resetDemo = useCallback(() => {
    if (!isDemo) return;
    setState(mockLevel1State);
    setEnded(null);
    setTransitioningRoom(null);
  }, [isDemo]);

  return { state, lastEvent, ended, error, isDemo, transitioningRoom, clearTransition, move, wait, leave, resetDemo };
}
