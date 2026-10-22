// ⚠️ SOLO PARA PRUEBAS. Simula de forma MUY simplificada lo que hará el servidor
// para poder probar los controles y el HUD sin backend.
// En el juego real el móvil solo manda `game:move` / `game:wait` y dibuja lo que llega.
import { Tile, type Direction, type SessionState } from '../lib/types';

export const DIR_DELTA: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

function endTurn(state: SessionState): SessionState {
  const me = state.players[0];
  let alert = state.alert;

  // Sumar alerta si el jugador termina el turno dentro de un cono de visión
  for (const e of state.entities) {
    const active = !e.disabledTurns;
    const seen = e.visionTiles?.some(([vx, vy]) => vx === me.x && vy === me.y);
    if (active && seen && me.camouflageTurns === 0) {
      alert += e.type === 'guard' ? 50 : 35;
    }
  }
  alert = Math.min(100, alert);

  return {
    ...state,
    turn: state.turn + 1,
    alert,
    status: alert >= 100 ? 'LOST' : state.status,
  };
}

export function mockMove(state: SessionState, dir: Direction): SessionState {
  if (state.status !== 'PLAYING') return state;
  const me = state.players[0];
  const [dx, dy] = DIR_DELTA[dir];
  const nx = me.x + dx;
  const ny = me.y + dy;

  const tile = state.tiles[ny]?.[nx];
  if (tile === undefined || tile === Tile.WALL || tile === Tile.ABYSS) return state;

  const door = state.entities.find((e) => e.type === 'door' && e.x === nx && e.y === ny);
  if (door && !door.open) return state;

  let battery = me.battery;
  let entities = state.entities;
  const energy = entities.find((e) => e.type === 'energy' && e.x === nx && e.y === ny);
  if (energy) {
    battery = Math.min(me.maxBattery, battery + 30);
    entities = entities.filter((e) => e.id !== energy.id);
  }

  const moved: SessionState = {
    ...state,
    entities,
    players: [{ ...me, x: nx, y: ny, battery }, ...state.players.slice(1)],
  };
  const next = endTurn(moved);
  if (tile === Tile.EXTRACTION) return { ...next, status: 'WON' };
  return next;
}

export function mockWait(state: SessionState): SessionState {
  if (state.status !== 'PLAYING') return state;
  return endTurn(state);
}
