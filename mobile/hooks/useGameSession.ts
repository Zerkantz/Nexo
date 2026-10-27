// Conecta la pantalla de juego con el Backend y el Smartwatch Wear OS en tiempo real:
// - En cada turno o movimiento del móvil, sincroniza el estado con el servidor (`session:sync`),
//   lo cual actualiza al instante el Deck Táctico del Smartwatch (`watch:context`).
// - Escucha en tiempo real las acciones ejecutadas en el Smartwatch (`watch:command`: hackeos
//   resueltos en los 5 minijuegos y habilidades activadas desde la muñeca) y las aplica al tablero.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_MISSIONS,
  loadPlayerProfile,
  recordMissionCompletion,
  type PlayerProfileState,
} from '../lib/playerStore';
import { connectSocket, type WatchCommandPayload } from '../lib/socket';
import type {
  Direction,
  GameEnded,
  GameEntity,
  GameEvent,
  Point,
  SessionState,
} from '../lib/types';
import { mockLevel1State } from '../mocks/sessionState';
import {
  applyWatchHackResolved,
  applyWatchSkill,
  mockMove,
  mockWait,
} from '../mocks/mockEngine';

export const DEMO_SESSION_ID = 'demo';

function buildInitialLocalState(
  sessionId: string,
  profile?: PlayerProfileState,
): SessionState {
  const maxBattery =
    profile?.upgrades.battery === 3 ? 150 : profile?.upgrades.battery === 2 ? 125 : 100;

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
    sessionId: sessionId || 'demo',
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
  const isDemo = true;
  const profileRef = useRef<PlayerProfileState | undefined>(undefined);

  const [state, setState] = useState<SessionState | null>(() =>
    buildInitialLocalState(sessionId),
  );
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [ended, setEnded] = useState<GameEnded | null>(null);
  const [error] = useState<string | null>(null);
  const [transitioningRoom, setTransitioningRoom] = useState<string | null>(null);

  // Cargar perfil del jugador al iniciar partida
  useEffect(() => {
    loadPlayerProfile().then((prof) => {
      profileRef.current = prof;
      setState(buildInitialLocalState(sessionId, prof));
    });
  }, [sessionId]);

  // Conectar Socket.io para sincronizar en tiempo real con el Smartwatch Wear OS
  useEffect(() => {
    const socket = connectSocket('nexo_mobile_jwt_1');

    const onWatchCommand = (cmd: WatchCommandPayload) => {
      if (cmd.type === 'HACK_STARTED') {
        setLastEvent({
          type: 'SKILL_USED',
          data: { message: `MINIJUEGO ACTIVO EN EL RELOJ (${cmd.minigame})` },
        });
      } else if (cmd.type === 'HACK_RESOLVED' && cmd.targetId) {
        setState((prev) => {
          if (!prev) return prev;
          return applyWatchHackResolved(
            prev,
            cmd.targetId!,
            !!cmd.success,
            cmd.cost ?? 20,
            (nextRoom) => {
              setTransitioningRoom(nextRoom.roomName ?? 'NUEVO SECTOR');
            },
          );
        });
        setLastEvent({
          type: cmd.success ? 'DOOR_OPENED' : 'DETECTED',
          data: { targetId: cmd.targetId, success: cmd.success },
        });
      } else if (cmd.type === 'SKILL_ACTIVATED' && cmd.skill) {
        setState((prev) => {
          if (!prev) return prev;
          return applyWatchSkill(prev, cmd.skill!, cmd.cost ?? 15);
        });
        setLastEvent({
          type: 'SKILL_USED',
          data: { skill: cmd.skill },
        });
      } else if (cmd.type === 'COOP_TRANSFER_BATTERY') {
        setState((prev) => {
          if (!prev) return prev;
          const me = prev.players[0];
          const nextBat = Math.min(me.maxBattery, me.battery + (cmd.amount ?? 25));
          return {
            ...prev,
            players: [{ ...me, battery: nextBat }, ...prev.players.slice(1)],
          };
        });
      }
    };

    socket.on('watch:command', onWatchCommand);
    socket.emit('session:join', { sessionId: sessionId || 'demo' });

    return () => {
      socket.off('watch:command', onWatchCommand);
    };
  }, [sessionId]);

  // Emitir `session:sync` al Backend cada vez que cambia `state` para actualizar el Smartwatch
  useEffect(() => {
    if (!state) return;
    const socket = connectSocket('nexo_mobile_jwt_1');
    socket.emit('session:sync', {
      state,
      profile: profileRef.current,
    });
  }, [state]);

  // Verificar fin de la partida y guardar recompensas
  useEffect(() => {
    if (!state || ended) return;
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
  }, [state, ended, sessionId]);

  const move = useCallback((dir: Direction) => {
    setState((s) => {
      if (!s) return s;
      return mockMove(s, dir, (nextRoom) => {
        setTransitioningRoom(nextRoom.roomName ?? 'NUEVO SECTOR');
      });
    });
  }, []);

  const wait = useCallback(() => {
    setState((s) => (s ? mockWait(s) : s));
  }, []);

  const leave = useCallback(() => {
    connectSocket('nexo_mobile_jwt_1').emit('session:leave', {});
  }, []);

  const clearTransition = useCallback(() => {
    setTransitioningRoom(null);
  }, []);

  const resetDemo = useCallback(() => {
    loadPlayerProfile().then((prof) => {
      profileRef.current = prof;
      setState(buildInitialLocalState(sessionId, prof));
      setEnded(null);
      setTransitioningRoom(null);
    });
  }, [sessionId]);

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
