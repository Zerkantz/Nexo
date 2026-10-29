// Motor tactico del juego (12x12 con multiples sectores conectados y dificultad elevada):
// - Patrullas en circuito cerrado para guardias (1 paso/turno) y drones rapidos (2 pasos/turno).
// - Uso obligatorio de todos los recursos del mapa:
//   1. Modulos de Energia (+35% de bateria).
//   2. Terminales de Datos (cuestan 25% de bateria, apagan camaras por 6 turnos y liberan el bloqueo electronico de las compuertas del sector).
//   3. Compuertas Blindadas y Esclusas Moradas de Sector (requieren todas las Terminales del sector hackeadas + 25% de bateria).
import { Tile, type Direction, type GameEntity, type Point, type SessionPlayer, type SessionState } from '../lib/types';
import { SECTOR_ROOMS } from './sessionState';

export interface TacticalFeedbackMessage {
  tone: 'info' | 'success' | 'warn' | 'danger';
  text: string;
}

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

/** Calcula las casillas que ve una entidad segun su posicion y direccion */
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

/** Determina la coordenada del siguiente objetivo tactico obligatorio para guiar visualmente al jugador */
export function getNextObjectiveCoord(
  state: SessionState,
  me: SessionPlayer | undefined,
): { x: number; y: number; label: string } | null {
  if (!me) return null;

  const unhackedTerminals = state.entities.filter((e) => e.type === 'terminal' && !e.open);
  const energyModules = state.entities.filter((e) => e.type === 'energy');
  const closedDoors = state.entities.filter((e) => e.type === 'door' && !e.open);

  const nearest = (items: GameEntity[]) => {
    if (items.length === 0) return null;
    return [...items].sort(
      (a, b) =>
        Math.abs(a.x - me.x) + Math.abs(a.y - me.y) - (Math.abs(b.x - me.x) + Math.abs(b.y - me.y)),
    )[0];
  };

  if (unhackedTerminals.length > 0) {
    if (me.battery < 25 && energyModules.length > 0) {
      const en = nearest(energyModules)!;
      return { x: en.x, y: en.y, label: 'ENERGIA (+35%)' };
    }
    const term = nearest(unhackedTerminals)!;
    return { x: term.x, y: term.y, label: 'TERMINAL (25%)' };
  }

  if (closedDoors.length > 0 && me.battery < 25 && energyModules.length > 0) {
    const en = nearest(energyModules)!;
    return { x: en.x, y: en.y, label: 'ENERGIA (+35%)' };
  }

  if (closedDoors.length > 0) {
    const door = nearest(closedDoors)!;
    return { x: door.x, y: door.y, label: door.targetRoom ? 'ESCLUSA MORADA' : 'COMPUERTA (25%)' };
  }

  const portal = state.entities.find((e) => e.targetRoom && e.id !== 'DOOR_AIRLOCK_S2');
  if (portal) {
    return { x: portal.x, y: portal.y, label: 'SECTOR 2' };
  }

  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      if (state.tiles[y]?.[x] === Tile.EXTRACTION) {
        return { x, y, label: 'EXTRACCION' };
      }
    }
  }

  return null;
}

/** Avanza los guardias (1 paso) y drones rapidos (2 pasos) y gira camaras rotativas cada turno */
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

    if (
      (nextEntity.type === 'guard' || nextEntity.type === 'drone') &&
      nextEntity.path &&
      nextEntity.path.length > 0
    ) {
      const steps = nextEntity.type === 'drone' ? 2 : 1;
      let curIdx = nextEntity.pathIndex ?? 0;
      let curX = nextEntity.x;
      let curY = nextEntity.y;
      let dir: Direction = nextEntity.dir ?? 'down';

      for (let s = 0; s < steps; s++) {
        const nextIdx = (curIdx + 1) % nextEntity.path.length;
        const [nx, ny] = nextEntity.path[nextIdx];
        if (nx > curX) dir = 'right';
        else if (nx < curX) dir = 'left';
        else if (ny > curY) dir = 'down';
        else if (ny < curY) dir = 'up';
        curX = nx;
        curY = ny;
        curIdx = nextIdx;
      }

      nextEntity.x = curX;
      nextEntity.y = curY;
      nextEntity.dir = dir;
      nextEntity.pathIndex = curIdx;
    }

    if (nextEntity.type === 'camera' && nextEntity.rotating && nextEntity.dir) {
      nextEntity.dir = NEXT_DIR[nextEntity.dir];
    }

    if (
      (nextEntity.type === 'guard' ||
        nextEntity.type === 'camera' ||
        nextEntity.type === 'drone') &&
      nextEntity.dir
    ) {
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

function endTurn(
  state: SessionState,
  updatedEntities: GameEntity[],
  onFeedback?: (msg: TacticalFeedbackMessage) => void,
): SessionState {
  const me = state.players[0];
  let alert = state.alert;

  let camouflageTurns = me.camouflageTurns;
  if (camouflageTurns > 0) {
    camouflageTurns -= 1;
  }

  let detectedThisTurn = false;
  for (const e of updatedEntities) {
    const active = !e.disabledTurns;
    if (!active || camouflageTurns > 0) continue;

    // Contacto directo en la misma casilla que un guardia o dron
    if ((e.type === 'guard' || e.type === 'drone') && e.x === me.x && e.y === me.y) {
      detectedThisTurn = true;
      alert += 60;
      onFeedback?.({
        tone: 'danger',
        text: 'CONTACTO DIRECTO CON PATRULLA: +60% de Alerta inmediata.',
      });
      continue;
    }

    const seen = e.visionTiles?.some(([vx, vy]) => vx === me.x && vy === me.y);
    if (seen) {
      detectedThisTurn = true;
      const delta = e.type === 'guard' ? 45 : 35;
      alert += delta;
      onFeedback?.({
        tone: 'danger',
        text:
          e.type === 'guard'
            ? `DETECTADO POR GUARDIA (+${delta}% Alerta) — Sal del cono naranja.`
            : e.type === 'drone'
              ? `DETECTADO POR DRON RAPIDO (+${delta}% Alerta) — Usa Pulso PEM o cobertura.`
              : `DETECTADO POR CAMARA (+${delta}% Alerta) — Hackea la Terminal o usa Sabotaje.`,
      });
    }
  }

  if (!detectedThisTurn && alert > 0) {
    alert = Math.max(0, alert - 4);
  }

  const revealedTraps = [...state.revealedTraps];
  const trap = updatedEntities.find((e) => e.type === 'trap' && e.x === me.x && e.y === me.y);
  if (trap) {
    const alreadyRevealed = revealedTraps.some(([tx, ty]) => tx === me.x && ty === me.y);
    if (!alreadyRevealed) {
      revealedTraps.push([me.x, me.y]);
      alert += 35;
      onFeedback?.({
        tone: 'danger',
        text: 'MINA LASER ACTIVADA (+35% Alerta) — Usa Escaner o Sobrecarga para neutralizarlas.',
      });
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
  onFeedback?: (msg: TacticalFeedbackMessage) => void,
): SessionState {
  if (state.status !== 'PLAYING') return state;
  const me = state.players[0];
  const [dx, dy] = DIR_DELTA[dir];
  const nx = me.x + dx;
  const ny = me.y + dy;

  const tile = state.tiles[ny]?.[nx];
  if (tile === undefined || tile === Tile.WALL || tile === Tile.ABYSS) {
    onFeedback?.({
      tone: 'warn',
      text: 'MURO BLINDADO: Elige una casilla iluminada en verde para avanzar.',
    });
    return state;
  }

  let entities = [...state.entities];
  let battery = me.battery;

  // Cuantas terminales faltan por hackear en este sector
  const unhackedTerminalsCount = entities.filter((e) => e.type === 'terminal' && !e.open).length;

  // 1. Verificar si hay una Compuerta Blindada / Esclusa Morada en la casilla destino
  const doorIndex = entities.findIndex((e) => e.type === 'door' && e.x === nx && e.y === ny);
  if (doorIndex >= 0) {
    const door = entities[doorIndex];

    if (!door.open) {
      if (unhackedTerminalsCount > 0) {
        onFeedback?.({
          tone: 'warn',
          text: `COMPUERTA BLOQUEADA: Faltan ${unhackedTerminalsCount} Terminal(es) de Datos por hackear en este sector.`,
        });
        return state;
      }
      if (battery < 25) {
        onFeedback?.({
          tone: 'warn',
          text: `BATERIA INSUFICIENTE (${battery}%/25%): Recoge un Modulo de Energia (+35%) en el mapa.`,
        });
        return state;
      }

      battery -= 25;
      entities[doorIndex] = { ...door, open: true };
      onFeedback?.({
        tone: 'success',
        text: door.targetRoom
          ? 'ESCLUSA DE SECTOR DESBLOQUEADA (-25% BAT): Cruzando al siguiente sector...'
          : 'COMPUERTA BLINDADA ABIERTA (-25% BAT): Acceso despejado.',
      });

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
              battery: Math.max(30, battery),
              maxBattery: me.maxBattery,
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
            battery: Math.max(30, battery),
            maxBattery: me.maxBattery,
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

  // 2. Verificar si hay un Modulo de Energia en la casilla destino (+35% bateria)
  const energyIndex = entities.findIndex((e) => e.type === 'energy' && e.x === nx && e.y === ny);
  if (energyIndex >= 0) {
    battery = Math.min(me.maxBattery, battery + 35);
    entities.splice(energyIndex, 1);
    onFeedback?.({
      tone: 'success',
      text: `MODULO DE ENERGIA RECOLECTADO (+35% BAT) -> Bateria actual: ${battery}%.`,
    });
  }

  // 3. Verificar si hay una Terminal de Datos en la casilla destino
  const termIndex = entities.findIndex((e) => e.type === 'terminal' && e.x === nx && e.y === ny);
  if (termIndex >= 0 && !entities[termIndex].open) {
    if (battery < 25) {
      onFeedback?.({
        tone: 'warn',
        text: `NECESITAS 25% DE BATERIA PARA HACKEAR ESTA TERMINAL (tienes ${battery}%). Recoge un Modulo de Energia primero.`,
      });
    } else {
      battery -= 25;
      entities[termIndex] = { ...entities[termIndex], open: true };
      const remaining = entities.filter((e) => e.type === 'terminal' && !e.open).length;
      entities = entities.map((e) =>
        e.type === 'camera' ? { ...e, disabledTurns: 6, visionTiles: [] } : e,
      );
      onFeedback?.({
        tone: 'success',
        text:
          remaining === 0
            ? 'TERMINAL HACKEADA (-25% BAT): Todas las compuertas del sector liberadas y camaras apagadas 6 turnos.'
            : `TERMINAL HACKEADA (-25% BAT): Camaras apagadas 6 turnos. Falta ${remaining} Terminal en este sector.`,
      });
    }
  }

  const updatedPlayer = { ...me, x: nx, y: ny, battery };
  const updatedEntities = advanceGuardsAndCameras(entities, state.tiles, state.alert);

  const movedState: SessionState = {
    ...state,
    players: [updatedPlayer, ...state.players.slice(1)],
  };

  const next = endTurn(movedState, updatedEntities, onFeedback);
  if (tile === Tile.EXTRACTION) {
    onFeedback?.({
      tone: 'success',
      text: 'EXTRACCION COMPLETADA: Objetivo asegurado con exito.',
    });
    return { ...next, status: 'WON' };
  }
  return next;
}

export function mockWait(
  state: SessionState,
  onFeedback?: (msg: TacticalFeedbackMessage) => void,
): SessionState {
  if (state.status !== 'PLAYING') return state;
  onFeedback?.({
    tone: 'info',
    text: 'TURNO EN ESPERA: Observando el movimiento de las patrullas...',
  });
  const updatedEntities = advanceGuardsAndCameras(state.entities, state.tiles, state.alert);
  return endTurn(state, updatedEntities, onFeedback);
}

/**
 * Aplica en el tablero movil el resultado del minijuego de hackeo resuelto en el Smartwatch.
 */
export function applyWatchHackResolved(
  state: SessionState,
  targetId: string,
  success: boolean,
  cost: number,
  onRoomTransition?: (nextRoomState: SessionState) => void,
  onFeedback?: (msg: TacticalFeedbackMessage) => void,
): SessionState {
  if (state.status !== 'PLAYING') return state;
  const me = state.players[0];

  if (!success) {
    const nextAlert = Math.min(100, state.alert + 20);
    onFeedback?.({
      tone: 'danger',
      text: 'FALLO EN HACKEO DEL RELOJ: +20% de Alerta.',
    });
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
        e.type === 'camera' ? { ...e, disabledTurns: 6, visionTiles: [] } : e,
      );
      onFeedback?.({
        tone: 'success',
        text: 'HACKEO DESDE RELOJ EXITOSO: Terminal desbloqueada y camaras apagadas 6 turnos.',
      });
    } else {
      onFeedback?.({
        tone: 'success',
        text: 'HACKEO DESDE RELOJ EXITOSO: Compuerta blindada abierta.',
      });
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
            battery: Math.max(30, battery),
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
 * Aplica en el tablero movil una habilidad activada desde el Smartwatch o desde la barra tactica.
 */
export function applyWatchSkill(
  state: SessionState,
  skillCode: string,
  cost: number,
  onFeedback?: (msg: TacticalFeedbackMessage) => void,
): SessionState {
  if (state.status !== 'PLAYING') return state;
  const me = state.players[0];
  if (me.battery < cost) {
    onFeedback?.({
      tone: 'warn',
      text: `BATERIA INSUFICIENTE (${me.battery}%/${cost}%) para activar ${skillCode}.`,
    });
    return state;
  }

  const battery = Math.max(0, me.battery - cost);
  let camouflageTurns = me.camouflageTurns;
  let entities = [...state.entities];
  let revealedTraps = [...state.revealedTraps];

  if (skillCode === 'SCANNER') {
    let count = 0;
    for (const e of entities) {
      if (e.type === 'trap' && Math.abs(e.x - me.x) + Math.abs(e.y - me.y) <= 4) {
        if (!revealedTraps.some(([tx, ty]) => tx === e.x && ty === e.y)) {
          revealedTraps.push([e.x, e.y]);
          count++;
        }
      }
    }
    onFeedback?.({
      tone: 'info',
      text:
        count > 0
          ? `ESCANER DE PULSO (-${cost}% BAT): ${count} mina(s) laser revelada(s) cerca.`
          : `ESCANER DE PULSO (-${cost}% BAT): Sin minas ocultas en radio de 4 casillas.`,
    });
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
      entities[bestIdx] = { ...entities[bestIdx], disabledTurns: 4, visionTiles: [] };
      onFeedback?.({
        tone: 'success',
        text: `SABOTAJE OPTICO (-${cost}% BAT): Camara mas cercana apagada por 4 turnos.`,
      });
    } else {
      onFeedback?.({
        tone: 'warn',
        text: 'SABOTAJE OPTICO: Todas las camaras ya estan desactivadas.',
      });
    }
  } else if (skillCode === 'CAMOUFLAGE') {
    camouflageTurns = Math.max(camouflageTurns, 3);
    onFeedback?.({
      tone: 'success',
      text: `CAMUFLAJE DE SENAL (-${cost}% BAT): Invisible a guardias y camaras por 3 turnos.`,
    });
  } else if (skillCode === 'OVERLOAD') {
    const before = entities.length;
    entities = entities.filter(
      (e) => !(e.type === 'trap' && Math.abs(e.x - me.x) + Math.abs(e.y - me.y) <= 4),
    );
    const removed = before - entities.length;
    onFeedback?.({
      tone: 'success',
      text: `SOBRECARGA (-${cost}% BAT): ${removed} mina(s) laser desactivada(s) en un radio de 4 casillas.`,
    });
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
      onFeedback?.({
        tone: 'success',
        text: `PULSO PEM (-${cost}% BAT): Patrulla mas cercana paralizada por 4 turnos.`,
      });
    }
  } else if (skillCode === 'THERMAL') {
    for (const e of entities) {
      if (e.type === 'trap' && !revealedTraps.some(([tx, ty]) => tx === e.x && ty === e.y)) {
        revealedTraps.push([e.x, e.y]);
      }
    }
    onFeedback?.({
      tone: 'success',
      text: `VISION TERMICA (-${cost}% BAT): Todas las minas laser del sector han sido reveladas.`,
    });
  } else if (skillCode === 'TIMEDILATE') {
    entities = entities.map((e) =>
      e.type === 'guard' || e.type === 'camera' || e.type === 'drone'
        ? { ...e, disabledTurns: 2, visionTiles: [] }
        : e,
    );
    onFeedback?.({
      tone: 'success',
      text: `DILATACION TEMPORAL (-${cost}% BAT): Todos los guardias y camaras congelados 2 turnos.`,
    });
  }

  return {
    ...state,
    revealedTraps,
    entities,
    players: [{ ...me, battery, camouflageTurns }, ...state.players.slice(1)],
  };
}
