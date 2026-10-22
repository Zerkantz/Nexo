// AVISO: SOLO PARA PRUEBAS. Estado de `session:state` (12x12 con cuartos conectados y rutas complejas).
// Nivel 1: Bóveda Central (Sector 1: Acceso Perimetral // Sector 2: Cámara Acorazada).
import type { SessionState } from '../lib/types';

export const mockSector1State: SessionState = {
  sessionId: 'demo',
  type: 'SOLO',
  turn: 0,
  alert: 0,
  status: 'PLAYING',
  theme: 'BANK',
  roomName: 'SECTOR 1: ACCESO PERIMETRAL',
  roomId: 'sector_1',
  width: 12,
  height: 12,
  tiles: [
    // 0  1  2  3  4  5  6  7  8  9 10 11
    [6, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0], // y=0: (0,0) Inicio en esquina noroeste
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0], // y=1
    [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 4, 0], // y=2: (10,2) Nodo de energía
    [0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0], // y=3
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1], // y=4: Cruces y escondites tácticos
    [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 2, 0], // y=5: (10,5) Puerta 1; (11,5) Compuerta con borde morado a Sector 2!
    [4, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], // y=6: (0,6) Nodo de energía en esquina oeste
    [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0], // y=7
    [0, 0, 0, 1, 0, 0, 0, 1, 7, 0, 0, 0], // y=8: (8,8) Terminal de datos
    [0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0], // y=9
    [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0], // y=10
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0], // y=11: Conexión sur aprovechando esquina (11,11)
  ],
  players: [
    { playerId: 7, slot: 1, x: 0, y: 0, battery: 100, maxBattery: 100, camouflageTurns: 0 },
  ],
  entities: [
    // Cámara de seguridad norte (rotativa)
    {
      id: 'CAM_1',
      type: 'camera',
      x: 6,
      y: 0,
      dir: 'down',
      range: 2,
      rotating: true,
      disabledTurns: 0,
      visionTiles: [[6, 1], [6, 2]],
    },
    // Cámara de seguridad secundaria en pasillo este
    {
      id: 'CAM_S1_2',
      type: 'camera',
      x: 10,
      y: 0,
      dir: 'down',
      range: 2,
      rotating: false,
      disabledTurns: 0,
      visionTiles: [[10, 1], [10, 2]],
    },
    // Guardia 1: patrulla en L del cuadrante noroeste (16 pasos)
    {
      id: 'GRD_1',
      type: 'guard',
      x: 2,
      y: 0,
      dir: 'down',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [2, 0], [2, 1], [2, 2], [3, 2], [4, 2], [4, 1], [4, 0], [5, 0], [6, 0],
        [5, 0], [4, 0], [4, 1], [4, 2], [3, 2], [2, 2], [2, 1],
      ],
      visionTiles: [[2, 1], [2, 2]],
    },
    // Guardia 2: patrulla de cruces centrales (16 pasos)
    {
      id: 'GRD_2',
      type: 'guard',
      x: 4,
      y: 4,
      dir: 'right',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [8, 3], [8, 2], [7, 2], [6, 2],
        [7, 2], [8, 2], [8, 3], [8, 4], [7, 4], [6, 4], [5, 4],
      ],
      visionTiles: [[5, 4], [6, 4]],
    },
    // Guardia 3: patrulla del corredor este y esclusa de enlace (10 pasos)
    {
      id: 'GRD_3',
      type: 'guard',
      x: 11,
      y: 0,
      dir: 'down',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [11, 0], [11, 1], [11, 2], [11, 3], [10, 3], [10, 4], [10, 3], [11, 3], [11, 2], [11, 1],
      ],
      visionTiles: [[11, 1], [11, 2]],
    },
    // Guardia 4: barrido de seguridad sur y vigilancia de terminal (20 pasos)
    {
      id: 'GRD_4',
      type: 'guard',
      x: 6,
      y: 6,
      dir: 'right',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [11, 7], [11, 8], [10, 8], [9, 8],
        [8, 8], [9, 8], [10, 8], [11, 8], [11, 7], [11, 6], [10, 6], [9, 6], [8, 6], [7, 6],
      ],
      visionTiles: [[7, 6], [8, 6]],
    },
    // Puerta interior normal
    { id: 'DOOR_1', type: 'door', x: 10, y: 5, open: false, minigame: 'SEQUENCE' },
    // Compuerta de enlace al Sector 2 (borde este, cara morada)
    {
      id: 'DOOR_AIRLOCK_S1',
      type: 'door',
      x: 11,
      y: 5,
      open: false,
      minigame: 'SEQUENCE',
      targetRoom: 'sector_2',
      targetX: 0,
      targetY: 5,
    },
    // Terminal de datos
    { id: 'TERM_1', type: 'terminal', x: 8, y: 8, minigame: 'SEQUENCE' },
    // Nodos de energía
    { id: 'EN_1', type: 'energy', x: 0, y: 6 },
    { id: 'EN_2', type: 'energy', x: 10, y: 2 },
    // Trampas de seguridad
    { id: 'TRP_1', type: 'trap', x: 2, y: 4 },
    { id: 'TRP_2', type: 'trap', x: 6, y: 6 },
  ],
  revealedTraps: [],
  fog: null,
};

export const mockSector2State: SessionState = {
  sessionId: 'demo',
  type: 'SOLO',
  turn: 0,
  alert: 0,
  status: 'PLAYING',
  theme: 'BANK',
  roomName: 'SECTOR 2: CÁMARA ACORAZADA',
  roomId: 'sector_2',
  width: 12,
  height: 12,
  tiles: [
    // 0  1  2  3  4  5  6  7  8  9 10 11
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 4], // y=0: (11,0) Nodo de energía en esquina noreste
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0], // y=1
    [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0], // y=2
    [0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0], // y=3
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1], // y=4
    [0, 0, 0, 0, 1, 1, 7, 1, 0, 0, 0, 0], // y=5: (0,5) Entrada con cara morada desde Sector 1; (6,5) Bóveda Principal
    [0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0], // y=6
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], // y=7
    [0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0], // y=8
    [0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0], // y=9
    [1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0], // y=10
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 2, 5], // y=11: (10,11) Puerta Bóveda; (11,11) EXTRACCIÓN!
  ],
  players: [
    { playerId: 7, slot: 1, x: 0, y: 5, battery: 80, maxBattery: 100, camouflageTurns: 0 },
  ],
  entities: [
    // Cámara de vigilancia de bóveda
    {
      id: 'CAM_2',
      type: 'camera',
      x: 8,
      y: 4,
      dir: 'down',
      range: 2,
      rotating: true,
      disabledTurns: 0,
      visionTiles: [[8, 5], [8, 6]],
    },
    // Guardia 5: centinela del vestíbulo de entrada
    {
      id: 'GRD_5',
      type: 'guard',
      x: 1,
      y: 5,
      dir: 'right',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [1, 5], [2, 5], [3, 5], [2, 5],
      ],
      visionTiles: [[2, 5], [3, 5]],
    },
    // Guardia 6: patrulla amplia de la sala central de bóveda (14 pasos)
    {
      id: 'GRD_6',
      type: 'guard',
      x: 2,
      y: 7,
      dir: 'right',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7],
        [8, 7], [7, 7], [6, 7], [5, 7], [4, 7], [3, 7],
      ],
      visionTiles: [[3, 7], [4, 7]],
    },
    // Guardia 7: patrulla de la esclusa sur de extracción (8 pasos)
    {
      id: 'GRD_7',
      type: 'guard',
      x: 8,
      y: 10,
      dir: 'right',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [8, 10], [9, 10], [10, 10], [11, 10], [11, 9], [10, 9], [10, 10], [9, 10],
      ],
      visionTiles: [[9, 10], [10, 10]],
    },
    // Compuerta de regreso a Sector 1 (borde oeste, cara morada)
    {
      id: 'DOOR_AIRLOCK_S2',
      type: 'door',
      x: 0,
      y: 5,
      open: true,
      targetRoom: 'sector_1',
      targetX: 11,
      targetY: 5,
    },
    // Terminal de datos de la bóveda maestra
    { id: 'TERM_VAULT', type: 'terminal', x: 6, y: 5, minigame: 'SEQUENCE' },
    // Puerta de la esclusa final de extracción
    { id: 'DOOR_EXTRACTION', type: 'door', x: 10, y: 11, open: false, minigame: 'SEQUENCE' },
    // Nodo de energía
    { id: 'EN_3', type: 'energy', x: 11, y: 0 },
    // Trampas de la bóveda
    { id: 'TRP_3', type: 'trap', x: 6, y: 6 },
    { id: 'TRP_4', type: 'trap', x: 9, y: 11 },
  ],
  revealedTraps: [],
  fog: null,
};

export const SECTOR_ROOMS: Record<string, SessionState> = {
  sector_1: mockSector1State,
  sector_2: mockSector2State,
};

export const mockLevel1State = mockSector1State;
