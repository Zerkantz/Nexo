// AVISO: SOLO PARA PRUEBAS. Simula de forma simplificada el motor del servidor (sección 4)
// para probar los turnos, patrullas dinámicas de guardias, cámaras y conos de visión sin backend.
import { Tile, type Direction, type GameEntity, type Point, type SessionState } from '../lib/types';

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
      break; // Visión bloqueada por pared o abismo
    }
    const door = entities.find((e) => e.type === 'door' && e.x === vx && e.y === vy);
    if (door && !door.open) {
      vision.push([vx, vy]); // Puede ver la puerta, pero no a través
      break;
    }
    vision.push([vx, vy]);
  }
  return vision;
}

/** Avanza los guardias por sus rutas de patrulla y gira cámaras rotativas cada turno */
function advanceGuardsAndCameras(
  entities: GameEntity[],
  tiles: number[][],
  alert: number,
): GameEntity[] {
  const isSuspicion = alert >= 50;

  return entities.map((entity) => {
    const nextEntity = { ...entity };

    // Si está incapacitada (saboteada o PEM)
    if (nextEntity.disabledTurns && nextEntity.disabledTurns > 0) {
      nextEntity.disabledTurns -= 1;
      nextEntity.visionTiles = [];
      return nextEntity;
    }

    // Guardias: avanzan 1 paso en su ruta de patrulla cada turno
    if (nextEntity.type === 'guard' && nextEntity.path && nextEntity.path.length > 0) {
      const curIdx = nextEntity.pathIndex ?? 0;
      const nextIdx = (curIdx + 1) % nextEntity.path.length;
      const [nx, ny] = nextEntity.path[nextIdx];

      // Determinar la dirección hacia donde se mueve
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

    // Cámaras rotativas: giran 90 grados cada turno
    if (nextEntity.type === 'camera' && nextEntity.rotating && nextEntity.dir) {
      nextEntity.dir = NEXT_DIR[nextEntity.dir];
    }

    // Recalcular cono de visión
    if ((nextEntity.type === 'guard' || nextEntity.type === 'camera' || nextEntity.type === 'drone') && nextEntity.dir) {
      const baseRange = nextEntity.range ?? 2;
      const effectiveRange = isSuspicion ? baseRange + 1 : baseRange; // Sospecha: +1 casilla
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

  // 1. Reducir camuflaje del jugador si está activo
  let camouflageTurns = me.camouflageTurns;
  if (camouflageTurns > 0) {
    camouflageTurns -= 1;
  }

  // 2. Verificar detección por guardias y cámaras activas
  for (const e of updatedEntities) {
    const active = !e.disabledTurns;
    const seen = e.visionTiles?.some(([vx, vy]) => vx === me.x && vy === me.y);
    if (active && seen && camouflageTurns === 0) {
      alert += e.type === 'guard' ? 50 : 35;
    }
  }

  // 3. Verificar si el jugador pisó una trampa
  const revealedTraps = [...state.revealedTraps];
  const trap = updatedEntities.find((e) => e.type === 'trap' && e.x === me.x && e.y === me.y);
  if (trap) {
    const alreadyRevealed = revealedTraps.some(([tx, ty]) => tx === me.x && ty === me.y);
    if (!alreadyRevealed) {
      revealedTraps.push([me.x, me.y]);
      alert += 25; // Pisar trampa: +25% de alerta
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

export function mockMove(state: SessionState, dir: Direction): SessionState {
  if (state.status !== 'PLAYING') return state;
  const me = state.players[0];
  const [dx, dy] = DIR_DELTA[dir];
  const nx = me.x + dx;
  const ny = me.y + dy;

  // Verificar límites y colisión con paredes o abismo
  const tile = state.tiles[ny]?.[nx];
  if (tile === undefined || tile === Tile.WALL || tile === Tile.ABYSS) return state;

  // Verificar si hay una puerta cerrada
  const entities = [...state.entities];
  let battery = me.battery;
  const doorIndex = entities.findIndex((e) => e.type === 'door' && e.x === nx && e.y === ny);

  if (doorIndex >= 0 && !entities[doorIndex].open) {
    // En modo demo sin reloj físico: si el jugador intenta pasar por una puerta cerrada y tiene >= 20% de batería,
    // se simula el hackeo exitoso (gasta 20% de batería y abre la puerta sin gastar turno)
    if (battery >= 20) {
      battery -= 20;
      entities[doorIndex] = { ...entities[doorIndex], open: true };
      return {
        ...state,
        entities,
        players: [{ ...me, battery }, ...state.players.slice(1)],
      };
    }
    // Si no alcanza la batería, la puerta bloquea el paso
    return state;
  }

  // Si hay un nodo de energía en la casilla de destino
  const energyIndex = entities.findIndex((e) => e.type === 'energy' && e.x === nx && e.y === ny);
  if (energyIndex >= 0) {
    battery = Math.min(me.maxBattery, battery + 30);
    entities.splice(energyIndex, 1);
  }

  // Mover jugador
  const updatedPlayer = { ...me, x: nx, y: ny, battery };

  // Avanzar guardias y cámaras para el siguiente turno
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
  // Al esperar, los guardias y cámaras avanzan 1 turno
  const updatedEntities = advanceGuardsAndCameras(state.entities, state.tiles, state.alert);
  return endTurn(state, updatedEntities);
}
