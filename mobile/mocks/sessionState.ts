// AVISO: SOLO PARA PRUEBAS. Estado falso de `session:state` (10x10) para el modo demo.
// Nivel 1: Bóveda Central (Laberíntico, alta dificultad con guardias patrullando activamente cada turno).
import type { SessionState } from '../lib/types';

export const mockLevel1State: SessionState = {
  sessionId: 'demo',
  type: 'SOLO',
  turn: 0,
  alert: 0,
  status: 'PLAYING',
  theme: 'BANK',
  width: 10,
  height: 10,
  tiles: [
    // y=0: Muro exterior norte
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    // y=1: Inicio en (1,1); pasillo hacia la derecha; nodo de energía en (8,1)
    [1, 6, 0, 0, 1, 0, 0, 0, 4, 1],
    // y=2: Bifurcaciones de pasillos
    [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
    // y=3: Puerta 1 en (4,3) conectando sector oeste con este
    [1, 0, 1, 0, 2, 0, 0, 1, 0, 1],
    // y=4: Pasillos con recovecos y cruces tácticos
    [1, 0, 0, 0, 1, 1, 0, 1, 0, 1],
    // y=5: Cruce transversal este-oeste
    [1, 1, 1, 0, 1, 0, 0, 0, 0, 1],
    // y=6: Nodo de energía oculto en recámara de mantenimiento (1,6)
    [1, 4, 1, 0, 1, 0, 1, 1, 0, 1],
    // y=7: Pasillo sur de circunvalación; terminal de datos en (7,7)
    [1, 0, 0, 0, 0, 0, 0, 7, 1, 1],
    // y=8: Acceso a la bóveda: Puerta 2 en (6,8); Extracción en (8,8)
    [1, 1, 1, 1, 1, 0, 2, 0, 5, 1],
    // y=9: Muro exterior sur
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  players: [
    { playerId: 7, slot: 1, x: 1, y: 1, battery: 80, maxBattery: 100, camouflageTurns: 0 },
  ],
  entities: [
    // Cámara de seguridad 1: rotativa en sector superior
    {
      id: 'CAM_1',
      type: 'camera',
      x: 5,
      y: 1,
      dir: 'down',
      range: 2,
      rotating: true,
      disabledTurns: 0,
      visionTiles: [[5, 2], [5, 3]],
    },
    // Cámara de seguridad 2: vigilancia fija del corredor este
    {
      id: 'CAM_2',
      type: 'camera',
      x: 8,
      y: 6,
      dir: 'up',
      range: 2,
      disabledTurns: 0,
      visionTiles: [[8, 5], [8, 4]],
    },
    // Guardia 1: patrulla activa del corredor central (columna 3)
    {
      id: 'GRD_1',
      type: 'guard',
      x: 3,
      y: 2,
      dir: 'down',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [3, 2], [3, 3], [3, 4], [3, 5], [3, 4], [3, 3],
      ],
      visionTiles: [[3, 3], [3, 4]],
    },
    // Guardia 2: patrulla perimetral del sector este de bóvedas
    {
      id: 'GRD_2',
      type: 'guard',
      x: 6,
      y: 1,
      dir: 'right',
      range: 2,
      disabledTurns: 0,
      pathIndex: 1,
      path: [
        [5, 1], [6, 1], [7, 1], [8, 1],
        [8, 2], [8, 3], [8, 4], [8, 5],
        [7, 5], [6, 5], [6, 4], [6, 3],
        [5, 3], [5, 2],
      ],
      visionTiles: [[7, 1], [8, 1]],
    },
    // Guardia 3: patrulla del pasillo sur (circunvalación hacia terminal y bóveda)
    {
      id: 'GRD_3',
      type: 'guard',
      x: 2,
      y: 7,
      dir: 'right',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [5, 7], [4, 7], [3, 7],
      ],
      visionTiles: [[3, 7], [4, 7]],
    },
    // Puerta 1: acceso directo al sector este
    { id: 'DOOR_1', type: 'door', x: 4, y: 3, open: false, minigame: 'SEQUENCE' },
    // Puerta 2: puerta acorazada de la bóveda de extracción
    { id: 'DOOR_2', type: 'door', x: 6, y: 8, open: false, minigame: 'SEQUENCE' },
    // Terminal de datos secundaria
    { id: 'TERM_1', type: 'terminal', x: 7, y: 7, minigame: 'SEQUENCE' },
    // Nodos de energía
    { id: 'EN_1', type: 'energy', x: 1, y: 6 },
    { id: 'EN_2', type: 'energy', x: 8, y: 1 },
    // Trampas de seguridad (invisibles al inicio)
    { id: 'TRP_1', type: 'trap', x: 2, y: 7 },
    { id: 'TRP_2', type: 'trap', x: 6, y: 3 },
    { id: 'TRP_3', type: 'trap', x: 5, y: 6 },
  ],
  // Trampa ya revelada en demostración inicial
  revealedTraps: [[2, 7]],
  fog: null,
};
