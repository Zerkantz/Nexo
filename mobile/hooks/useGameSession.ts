// Conecta la pantalla de juego con el servidor (o con el motor local si es una sesión
// de demostración, nivel local, co-op local, asalto PvP o prueba de base propia).
// Además aplica las mejoras del Taller (Batería Máxima) y registra recompensas al terminar.
import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_MISSIONS,
  loadPlayerProfile,
  recordMissionCompletion,
  type PlayerProfileState,
} from '../lib/playerStore';
import { connectSocket, getSocket } from '../lib/socket';
import { getToken } from '../lib/tokenStorage';
import type {
  ApiError,
  Direction,
  GameEnded,
  GameEntity,
  GameEvent,
  Point,
  SessionState,
} from '../lib/types';
import { mockLevel1State } from '../mocks/sessionState';
import { mockMove, mockWait } from '../mocks/mockEngine';

export const DEMO_SESSION_ID = 'demo';

function isLocalSessionId(id: string): boolean {
  return (
    !id ||
    id === 'demo' ||
    id === 'test-base' ||
    id.startsWith('level-') ||
    id.startsWith('coop-') ||
    id.startsWith('raid-')
  );
}

function buildInitialLocalState(
  sessionId: string,
  profile?: PlayerProfileState,
): SessionState {
  const maxBattery =
    profile?.upgrades.battery === 3 ? 150 : profile?.upgrades.battery === 2 ? 125 : 100;

  // Si está probando su propia base 10x10 del editor PvP:
  if (sessionId === 'test-base' && profile?.base) {
    const b = profile.base;
    let startX = 1;
    let startY = 1;
    for (let y = 0; y < b.height; y++) {
      for (let x = 0; x < b.width; x++) {
        if (b.tiles[y][x] === 6) {
          startX = x;
          startY = y;
        }
      }
    }

    const entities: GameEntity[] = b.entities.map((e) => {
      if (e.type === 'camera') {
        const visionTiles: Point[] = [];
        if (e.y + 1 < b.height && b.tiles[e.y + 1][e.x] !== 1) visionTiles.push([e.x, e.y + 1]);
        if (e.y + 2 < b.height && b.tiles[e.y + 2][e.x] !== 1) visionTiles.push([e.x, e.y + 2]);
        return {
          id: e.id,
          type: 'camera',
          x: e.x,
          y: e.y,
          dir: e.dir ?? 'down',
          range: 2,
          rotating: true,
          disabledTurns: 0,
          visionTiles,
        };
      }
      if (e.type === 'guard') {
        const nextX = e.x + 1 < b.width && b.tiles[e.y][e.x + 1] !== 1 ? e.x + 1 : e.x;
        return {
          id: e.id,
          type: 'guard',
          x: e.x,
          y: e.y,
          dir: e.dir ?? 'right',
          range: 2,
          disabledTurns: 0,
          path: [
            [e.x, e.y],
            [nextX, e.y],
          ],
          pathIndex: 0,
          visionTiles: nextX !== e.x ? [[nextX, e.y]] : [],
        };
      }
      if (e.type === 'door') {
        return {
          id: e.id,
          type: 'door',
          x: e.x,
          y: e.y,
          open: false,
          minigame: 'SEQUENCE',
        };
      }
      return {
        id: e.id,
        type: 'trap',
        x: e.x,
        y: e.y,
      };
    });

    return {
      sessionId: 'test-base',
      type: 'RAID',
      turn: 0,
      alert: 0,
      status: 'PLAYING',
      theme: 'SERVERS',
      roomName: `PRUEBA: ${b.name}`,
      roomId: 'custom_base',
      width: b.width,
      height: b.height,
      tiles: b.tiles.map((r) => [...r]),
      players: [
        {
          playerId: profile.player.id,
          slot: 1,
          x: startX,
          y: startY,
          battery: maxBattery,
          maxBattery,
          camouflageTurns: 0,
        },
      ],
      entities,
      revealedTraps: entities.filter((e) => e.type === 'trap').map((e) => [e.x, e.y] as Point),
      fog: null,
    };
  }

  // Configurar tema y nombre según el nivel o modo seleccionado
  let theme = mockLevel1State.theme;
  let roomName = mockLevel1State.roomName;
  let sessionType: SessionState['type'] = 'SOLO';

  if (sessionId.startsWith('level-')) {
    const lv = parseInt(sessionId.replace('level-', ''), 10) || 1;
    const found = DEFAULT_MISSIONS.find((m) => m.levelNumber === lv);
    if (found) {
      theme = found.theme;
      roomName = `NIVEL ${lv}: ${found.name}`;
    }
  } else if (sessionId.startsWith('coop-')) {
    sessionType = 'COOP';
    roomName = `OPERACIÓN CO-OP // ${sessionId.replace('coop-', '').toUpperCase()}`;
  } else if (sessionId.startsWith('raid-')) {
    sessionType = 'RAID';
    theme = 'SERVERS';
    roomName = `ASALTO PvP // BASE #${sessionId.replace('raid-', '')}`;
  }

  return {
    ...mockLevel1State,
    sessionId,
    type: sessionType,
    theme,
    roomName,
    players: mockLevel1State.players.map((p) => ({
      ...p,
      maxBattery,
      battery: Math.min(maxBattery, p.battery + (maxBattery - 100)),
    })),
  };
}

export function useGameSession(sessionId: string) {
  const isDemo = isLocalSessionId(sessionId);

  const [state, setState] = useState<SessionState | null>(
    isDemo ? buildInitialLocalState(sessionId) : null,
  );
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [ended, setEnded] = useState<GameEnded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transitioningRoom, setTransitioningRoom] = useState<string | null>(null);

  // Cargar perfil del jugador para aplicar la mejora de batería máxima
  useEffect(() => {
    if (!isDemo) return;
    loadPlayerProfile().then((prof) => {
      setState(buildInitialLocalState(sessionId, prof));
    });
  }, [isDemo, sessionId]);

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

  // ----- Modo local: simular el fin de la partida y guardar recompensas -----
  useEffect(() => {
    if (!isDemo || !state || ended) return;
    if (state.status === 'WON') {
      const lv = sessionId.startsWith('level-')
        ? parseInt(sessionId.replace('level-', ''), 10) || 1
        : 1;
      const mInfo = DEFAULT_MISSIONS.find((m) => m.levelNumber === lv) ?? DEFAULT_MISSIONS[0];
      const rewards = {
        credits: mInfo.rewardCredits,
        energy: mInfo.rewardEnergy,
        intel: mInfo.rewardIntel,
      };
      setEnded({
        result: 'WON',
        rewards,
        unlockedSkill: mInfo.unlocksSkill,
      });
      recordMissionCompletion({
        sessionId,
        result: 'WON',
        turns: state.turn,
        maxAlert: state.alert,
        rewards,
        unlockedSkill: mInfo.unlocksSkill,
      });
    } else if (state.status === 'LOST') {
      const rewards = { credits: 0, energy: 0, intel: 0 };
      setEnded({ result: 'LOST', rewards });
      recordMissionCompletion({
        sessionId,
        result: 'LOST',
        turns: state.turn,
        maxAlert: state.alert,
        rewards,
      });
    }
  }, [isDemo, state, ended, sessionId]);

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

  /** Reinicia la partida local actual. */
  const resetDemo = useCallback(() => {
    if (!isDemo) return;
    loadPlayerProfile().then((prof) => {
      setState(buildInitialLocalState(sessionId, prof));
      setEnded(null);
      setTransitioningRoom(null);
    });
  }, [isDemo, sessionId]);

  return {
    state,
    lastEvent,
    ended,
    error,
    isDemo,
    transitioningRoom,
    clearTransition,
    move,
    wait,
    leave,
    resetDemo,
  };
}
