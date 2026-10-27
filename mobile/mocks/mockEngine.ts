// Simula el motor táctico del juego en modo demo (12x12 con múltiples cuartos conectados):
// - Patrullas en circuito cerrado para los 8 guardias y rotación de cámaras.
// - Uso obligatorio y coherente de los recursos del mapa:
//   1. Módulos de Energía (+40% de batería).
//   2. Terminales de Datos (cuestan 25% de batería, desactivan cámaras por 8 turnos y liberan el bloqueo electrónico de las compuertas del sector).
//   3. Compuertas Blindadas y Puertas Moradas de Sector (requieren Terminal hackeada + 25% de batería).
import { Tile, type Direction, type GameEntity, type Point, type SessionState } from '../lib/types';
import { SECTOR_ROOMS } from './sessionState';

export const DIR_DELTA: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

const NEXT_DIR: Record<Direction, Direction> = {
  down: 'right',
  right: 'up',
  up: 'left',
  left: 'down',
};

/** Calcula las casillas que ve una entidad según su posición y dirección */
export function computeVisionTiles(
  x: number,
  y: number,
  dir: Direction,
  range: number,
  tiles: number[][],
  entities: GameEntity[],
): Point[] {
  const [dx, dy] = DIR_DELTA[dir];
  const vision: Point[] = [];
  for (let r = 1; r <= range; r++) {
    const vx = x + dx * r;
    const vy = y + dy * r;
    const tile = tiles[vy]?.[vx];
    if (tile === undefined || tile === Tile.WALL || tile === Tile.ABYSS) {
      break;
    }
    const door = entities.find((e) => e.type === 'door' && e.x === vx && e.y === vy);
    if (door && !door.open) {
      vision.push([vx, vy]);
      break;
    }
    vision.push([vx, vy]);
  }
  return vision;
}

/** Avanza los guardias por sus circuitos cerrados y gira cámaras rotativas cada turno */
function advanceGuardsAndCameras(
  entities: GameEntity[],
  tiles: number[][],
  alert: number,
): GameEntity[] {
  const isSuspicion = alert >= 50;

  return entities.map((entity) => {
    const nextEntity = { ...entity };

    if (nextEntity.disabledTurns && nextEntity.disabledTurns > 0) {
      nextEntity.disabledTurns -= 1;
      nextEntity.visionTiles = [];
      return nextEntity;
    }

    if (nextEntity.type === 'guard' && nextEntity.path && nextEntity.path.length > 0) {
      const curIdx = nextEntity.pathIndex ?? 0;
      const nextIdx = (curIdx + 1) % nextEntity.path.length;
      const [nx, ny] = nextEntity.path[nextIdx];

      let dir: Direction = nextEntity.dir ?? 'down';
      if (nx > nextEntity.x) dir = 'right';
      else if (nx < nextEntity.x) dir = 'left';
      else if (ny > nextEntity.y) dir = 'down';
      else if (ny < nextEntity.y) dir = 'up';

      nextEntity.x = nx;
      nextEntity.y = ny;
      nextEntity.dir = dir;
      nextEntity.pathIndex = nextIdx;
    }

    if (nextEntity.type === 'camera' && nextEntity.rotating && nextEntity.dir) {
      nextEntity.dir = NEXT_DIR[nextEntity.dir];
    }

    if ((nextEntity.type === 'guard' || nextEntity.type === 'camera' || nextEntity.type === 'drone') && nextEntity.dir) {
      const baseRange = nextEntity.range ?? 2;
      const effectiveRange = isSuspicion ? baseRange + 1 : baseRange;
      nextEntity.visionTiles = computeVisionTiles(
        nextEntity.x,
        nextEntity.y,
        nextEntity.dir,
        effectiveRange,
        tiles,
        entities,
      );
    }

    return nextEntity;
  });
}

function endTurn(state: SessionState, updatedEntities: GameEntity[]): SessionState {
  const me = state.players[0];
  let alert = state.alert;

  let camouflageTurns = me.camouflageTurns;
  if (camouflageTurns > 0) {
    camouflageTurns -= 1;
  }

  let detectedThisTurn = false;
  for (const e of updatedEntities) {
    const active = !e.disabledTurns;
    const seen = e.visionTiles?.some(([vx, vy]) => vx === me.x && vy === me.y);
    if (active && seen && camouflageTurns === 0) {
      detectedThisTurn = true;
      alert += e.type === 'guard' ? 35 : 25;
    }
  }

  if (!detectedThisTurn && alert > 0) {
    alert = Math.max(0, alert - 5);
  }

  const revealedTraps = [...state.revealedTraps];
  const trap = updatedEntities.find((e) => e.type === 'trap' && e.x === me.x && e.y === me.y);
  if (trap) {
    const alreadyRevealed = revealedTraps.some(([tx, ty]) => tx === me.x && ty === me.y);
    if (!alreadyRevealed) {
      revealedTraps.push([me.x, me.y]);
      alert += 25;
    }
  }

  alert = Math.min(100, alert);

  return {
    ...state,
    turn: state.turn + 1,
    alert,
    revealedTraps,
    entities: updatedEntities,
    players: [{ ...me, camouflageTurns }, ...state.players.slice(1)],
    status: alert >= 100 ? 'LOST' : state.status,
  };
}

export function mockMove(
  state: SessionState,
  dir: Direction,
  onRoomTransition?: (nextRoomState: SessionState) => void,
): SessionState {
  if (state.status !== 'PLAYING') return state;
  const me = state.players[0];
  const [dx, dy] = DIR_DELTA[dir];
  const nx = me.x + dx;
  const ny = me.y + dy;

  const tile = state.tiles[ny]?.[nx];
  if (tile === undefined || tile === Tile.WALL || tile === Tile.ABYSS) return state;

  let entities = [...state.entities];
  let battery = me.battery;

  // ¿Ya fue hackeada la Terminal de Datos de este sector?
  const unhackedTerminals = entities.some((e) => e.type === 'terminal' && !e.open);

  // 1. Verificar si hay una Compuerta Blindada / Puerta Morada en la casilla destino
  const doorIndex = entities.findIndex((e) => e.type === 'door' && e.x === nx && e.y === ny);
  if (doorIndex >= 0) {
    const door = entities[doorIndex];

    if (!door.open) {
      // Para desbloquear cualquier compuerta cerrada del sector se requiere:
      // a) Haber hackeado la Terminal de Datos del sector (!unhackedTerminals)
      // b) Contar con al menos 25% de batería (obtenida en los Módulos de Energía)
      if (unhackedTerminals || battery < 25) {
        return state;
      }

      battery -= 25;
      entities[doorIndex] = { ...door, open: true };

      // Si es una Puerta Morada hacia otro cuarto, cruzar al desbloquearla
      if (door.targetRoom && SECTOR_ROOMS[door.targetRoom]) {
        const nextRoom = SECTOR_ROOMS[door.targetRoom];
        const transitionedState: SessionState = {
          ...nextRoom,
          sessionId: state.sessionId,
          alert: state.alert,
          turn: state.turn + 1,
          players: [
            {
              ...nextRoom.players[0],
              battery,
              camouflageTurns: me.camouflageTurns,
              x: door.targetX ?? nextRoom.players[0].x,
              y: door.targetY ?? nextRoom.players[0].y,
            },
            ...nextRoom.players.slice(1),
          ],
        };
        onRoomTransition?.(transitionedState);
        return transitionedState;
      }

      return {
        ...state,
        entities,
        players: [{ ...me, battery }, ...state.players.slice(1)],
      };
    }

    // Si la puerta ya estaba abierta y conduce a otro cuarto
    if (door.targetRoom && SECTOR_ROOMS[door.targetRoom]) {
      const nextRoom = SECTOR_ROOMS[door.targetRoom];
      const transitionedState: SessionState = {
        ...nextRoom,
        sessionId: state.sessionId,
        alert: state.alert,
        turn: state.turn + 1,
        players: [
          {
            ...nextRoom.players[0],
            battery,
            camouflageTurns: me.camouflageTurns,
            x: door.targetX ?? nextRoom.players[0].x,
            y: door.targetY ?? nextRoom.players[0].y,
          },
          ...nextRoom.players.slice(1),
        ],
      };
      onRoomTransition?.(transitionedState);
      return transitionedState;
    }
  }

  // 2. Verificar si hay un Módulo de Energía en la casilla destino (+40% batería)
  const energyIndex = entities.findIndex((e) => e.type === 'energy' && e.x === nx && e.y === ny);
  if (energyIndex >= 0) {
    battery = Math.min(me.maxBattery, battery + 40);
    entities.splice(energyIndex, 1);
  }

  // 3. Verificar si hay una Terminal de Datos en la casilla destino
  const termIndex = entities.findIndex((e) => e.type === 'terminal' && e.x === nx && e.y === ny);
  if (termIndex >= 0 && !entities[termIndex].open) {
    if (battery >= 25) {
      battery -= 25;
      entities[termIndex] = { ...entities[termIndex], open: true };
      // Al hackear la terminal del sector, se apagan las cámaras de seguridad por 8 turnos
      entities = entities.map((e) =>
        e.type === 'camera' ? { ...e, disabledTurns: 8, visionTiles: [] } : e,
      );
    }
  }

  const updatedPlayer = { ...me, x: nx, y: ny, battery };
  const updatedEntities = advanceGuardsAndCameras(entities, state.tiles, state.alert);

  const movedState: SessionState = {
    ...state,
    players: [updatedPlayer, ...state.players.slice(1)],
  };

  const next = endTurn(movedState, updatedEntities);
  if (tile === Tile.EXTRACTION) {
    return { ...next, status: 'WON' };
  }
  return next;
}

export function mockWait(state: SessionState): SessionState {
  if (state.status !== 'PLAYING') return state;
  const updatedEntities = advanceGuardsAndCameras(state.entities, state.tiles, state.alert);
  return endTurn(state, updatedEntities);
}

/**
 * Aplica en el tablero móvil el resultado del minijuego de hackeo resuelto en el Smartwatch.
 */
export function applyWatchHackResolved(
  state: SessionState,
  targetId: string,
  success: boolean,
  cost: number,
  onRoomTransition?: (nextRoomState: SessionState) => void,
): SessionState {
  if (state.status !== 'PLAYING') return state;
  const me = state.players[0];

  if (!success) {
    const nextAlert = Math.min(100, state.alert + 20);
    return {
      ...state,
      alert: nextAlert,
      status: nextAlert >= 100 ? 'LOST' : state.status,
    };
  }

  let entities = [...state.entities];
  const battery = Math.max(0, me.battery - cost);

  const idx = entities.findIndex((e) => e.id === targetId);
  if (idx >= 0) {
    const target = entities[idx];
    entities[idx] = { ...target, open: true };

    if (target.type === 'terminal') {
      entities = entities.map((e) =>
        e.type === 'camera' ? { ...e, disabledTurns: 8, visionTiles: [] } : e,
      );
    }

    if (target.type === 'door' && target.targetRoom && SECTOR_ROOMS[target.targetRoom]) {
      const nextRoom = SECTOR_ROOMS[target.targetRoom];
      const transitionedState: SessionState = {
        ...nextRoom,
        sessionId: state.sessionId,
        alert: state.alert,
        turn: state.turn + 1,
        players: [
          {
            ...nextRoom.players[0],
            battery,
            maxBattery: me.maxBattery,
            camouflageTurns: me.camouflageTurns,
            x: target.targetX ?? nextRoom.players[0].x,
            y: target.targetY ?? nextRoom.players[0].y,
          },
          ...nextRoom.players.slice(1),
        ],
      };
      onRoomTransition?.(transitionedState);
      return transitionedState;
    }
  }

  return {
    ...state,
    entities,
    players: [{ ...me, battery }, ...state.players.slice(1)],
  };
}

/**
 * Aplica en el tablero móvil una habilidad activada desde el Smartwatch Wear OS.
 */
export function applyWatchSkill(
  state: SessionState,
  skillCode: string,
  cost: number,
): SessionState {
  if (state.status !== 'PLAYING') return state;
  const me = state.players[0];
  const battery = Math.max(0, me.battery - cost);
  let camouflageTurns = me.camouflageTurns;
  let entities = [...state.entities];
  let revealedTraps = [...state.revealedTraps];

  if (skillCode === 'SCANNER') {
    for (const e of entities) {
      if (e.type === 'trap' && Math.abs(e.x - me.x) + Math.abs(e.y - me.y) <= 3) {
        if (!revealedTraps.some(([tx, ty]) => tx === e.x && ty === e.y)) {
          revealedTraps.push([e.x, e.y]);
        }
      }
    }
  } else if (skillCode === 'SABOTAGE') {
    let bestIdx = -1;
    let bestDist = 999;
    entities.forEach((e, i) => {
      if (e.type === 'camera' && !e.disabledTurns) {
        const d = Math.abs(e.x - me.x) + Math.abs(e.y - me.y);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
    });
    if (bestIdx >= 0) {
      entities[bestIdx] = { ...entities[bestIdx], disabledTurns: 3, visionTiles: [] };
    }
  } else if (skillCode === 'CAMOUFLAGE') {
    camouflageTurns = Math.max(camouflageTurns, 2);
  } else if (skillCode === 'OVERLOAD') {
    entities = entities.filter(
      (e) => !(e.type === 'trap' && Math.abs(e.x - me.x) + Math.abs(e.y - me.y) <= 4),
    );
  } else if (skillCode === 'EMP') {
    let bestIdx = -1;
    let bestDist = 999;
    entities.forEach((e, i) => {
      if ((e.type === 'guard' || e.type === 'drone') && !e.disabledTurns) {
        const d = Math.abs(e.x - me.x) + Math.abs(e.y - me.y);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
    });
    if (bestIdx >= 0) {
      entities[bestIdx] = { ...entities[bestIdx], disabledTurns: 4, visionTiles: [] };
    }
  } else if (skillCode === 'THERMAL') {
    for (const e of entities) {
      if (e.type === 'trap' && !revealedTraps.some(([tx, ty]) => tx === e.x && ty === e.y)) {
        revealedTraps.push([e.x, e.y]);
      }
    }
  } else if (skillCode === 'TIMEDILATE') {
    entities = entities.map((e) =>
      e.type === 'guard' || e.type === 'camera' || e.type === 'drone'
        ? { ...e, disabledTurns: 2, visionTiles: [] }
        : e,
    );
  }

  return {
    ...state,
    revealedTraps,
    entities,
    players: [{ ...me, battery, camouflageTurns }, ...state.players.slice(1)],
  };
}

