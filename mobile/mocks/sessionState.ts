// ⚠️ SOLO PARA PRUEBAS. Estado falso de `session:state` para dibujar el tablero
// mientras el backend (Integrante 3) no está listo. Usa el mapa de ejemplo de la sección 13.
import type { SessionState } from '../lib/types';

export const mockLevel1State: SessionState = {
  sessionId: 'demo',
  type: 'SOLO',
  turn: 0,
  alert: 0,
  status: 'PLAYING',
  theme: 'BANK',
  width: 8,
  height: 8,
  tiles: [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 6, 0, 0, 2, 0, 5, 1],
    [1, 0, 1, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 4, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 7, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ],
  players: [{ playerId: 7, slot: 1, x: 1, y: 1, battery: 80, maxBattery: 100, camouflageTurns: 0 }],
  entities: [
    { id: 'CAM_1', type: 'camera', x: 3, y: 2, dir: 'down', range: 2, disabledTurns: 0, visionTiles: [[3, 3]] },
    { id: 'GRD_1', type: 'guard', x: 2, y: 3, dir: 'right', range: 2, visionTiles: [[3, 3], [4, 3]] },
    { id: 'DOOR_1', type: 'door', x: 4, y: 1, open: false, minigame: 'SEQUENCE' },
    { id: 'TERM_1', type: 'terminal', x: 6, y: 5, minigame: 'SEQUENCE' },
    { id: 'EN_1', type: 'energy', x: 1, y: 4 },
  ],
  // Trampa ya revelada (como si se hubiera usado el Escáner) para probar cómo se dibuja.
  revealedTraps: [[5, 3]],
  fog: null,
};
