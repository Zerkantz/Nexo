// Estado inicial de `session:state` (12x12 con 2 sectores conectados de alta dificultad,
// patrullas en circuito cerrado + drones rapidos de 2 pasos por turno + camaras rotativas +
// minas laser, disenado para exigir el uso de TODOS los recursos del mapa en orden tactico).
import type { SessionState } from '../lib/types';

export const mockSector1State: SessionState = {
  sessionId: 'demo',
  type: 'SOLO',
  turn: 0,
  alert: 0,
  status: 'PLAYING',
  theme: 'BANK',
  roomName: 'SECTOR 1: PERIMETRO DE ALTA SEGURIDAD',
  roomId: 'sector_1',
  width: 12,
  height: 12,
  tiles: [
    // 0  1  2  3  4  5  6  7  8  9 10 11
    [6, 0, 0, 1, 0, 0, 7, 1, 1, 0, 0, 4], // y=0: (0,0) Inicio; (6,0) Terminal Norte; (11,0) Energia Este
    [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0], // y=1
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0], // y=2: (5,2) Camara rotativa central
    [0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0], // y=3
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1], // y=4
    [0, 0, 0, 1, 0, 1, 1, 0, 2, 0, 0, 0], // y=5: (8,5) Compuerta Blindada Central; (11,5) Esclusa Morada a Sector 2
    [4, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1], // y=6: (0,6) Energia Oeste
    [0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0], // y=7
    [0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0], // y=8
    [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1], // y=9
    [0, 0, 0, 1, 0, 0, 0, 7, 1, 0, 1, 1], // y=10: (7,10) Terminal Maestra Sur
    [4, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0], // y=11: (0,11) Energia Suroeste
  ],
  players: [
    // Inicia con 25% de bateria: obliga a recolectar los 3 Modulos de Energia (+35% c/u)
    // para poder hackear las 2 Terminales (25% c/u) y las 2 Compuertas (25% c/u).
    { playerId: 7, slot: 1, x: 0, y: 0, battery: 25, maxBattery: 100, camouflageTurns: 0 },
  ],
  entities: [
    // Camara 1: Rotativa en el cruce central
    {
      id: 'CAM_1',
      type: 'camera',
      x: 5,
      y: 2,
      dir: 'down',
      range: 2,
      rotating: true,
      disabledTurns: 0,
      visionTiles: [
        [5, 3],
        [5, 4],
      ],
    },
    // Camara 2: Rotativa vigilando el corredor noreste hacia Energia Este (11,0)
    {
      id: 'CAM_S1_2',
      type: 'camera',
      x: 10,
      y: 0,
      dir: 'left',
      range: 2,
      rotating: true,
      disabledTurns: 0,
      visionTiles: [[9, 0]],
    },
    // Camara 3: Rotativa en el acceso sur hacia la Terminal Maestra (7,10)
    {
      id: 'CAM_S1_3',
      type: 'camera',
      x: 4,
      y: 10,
      dir: 'right',
      range: 2,
      rotating: true,
      disabledTurns: 0,
      visionTiles: [
        [5, 10],
        [6, 10],
      ],
    },
    // Guardia 1: Circuito cerrado de 14 pasos en el Ala Noroeste (custodia Energia Oeste)
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
        [2, 0],
        [2, 1],
        [2, 2],
        [2, 3],
        [2, 4],
        [2, 5],
        [1, 5],
        [0, 5],
        [0, 4],
        [0, 3],
        [0, 2],
        [1, 2],
        [2, 2],
        [2, 1],
      ],
      visionTiles: [
        [2, 1],
        [2, 2],
      ],
    },
    // Guardia 2: Circuito cerrado de 10 pasos en el Nucleo Central (custodia acceso a Compuerta 1)
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
        [4, 4],
        [5, 4],
        [6, 4],
        [7, 4],
        [7, 5],
        [7, 6],
        [6, 6],
        [5, 6],
        [4, 6],
        [4, 5],
      ],
      visionTiles: [
        [5, 4],
        [6, 4],
      ],
    },
    // Guardia 3: Circuito cerrado de 10 pasos en el Ala Este (custodia Energia Este y Esclusa Morada)
    {
      id: 'GRD_3',
      type: 'guard',
      x: 9,
      y: 0,
      dir: 'down',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [9, 0],
        [9, 1],
        [9, 2],
        [9, 3],
        [10, 3],
        [11, 3],
        [11, 2],
        [11, 1],
        [11, 0],
        [10, 0],
      ],
      visionTiles: [
        [9, 1],
        [9, 2],
      ],
    },
    // Guardia 4: Patrulla de 16 pasos en el Ala Sur-Central (custodia la Terminal Maestra Sur)
    {
      id: 'GRD_4',
      type: 'guard',
      x: 4,
      y: 8,
      dir: 'right',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [4, 8],
        [5, 8],
        [5, 7],
        [5, 6],
        [6, 6],
        [7, 6],
        [7, 7],
        [7, 8],
        [7, 9],
        [7, 8],
        [7, 7],
        [7, 6],
        [6, 6],
        [5, 6],
        [5, 7],
        [5, 8],
      ],
      visionTiles: [[5, 8]],
    },
    // Guardia 5: Patrulla del corredor Suroeste (custodia Energia Suroeste en (0,11))
    {
      id: 'GRD_S1_5',
      type: 'guard',
      x: 2,
      y: 8,
      dir: 'down',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [2, 8],
        [2, 9],
        [2, 10],
        [2, 11],
        [3, 11],
        [4, 11],
        [4, 10],
        [4, 9],
        [4, 8],
        [3, 8],
        [2, 8],
        [1, 8],
        [1, 8],
      ],
      visionTiles: [
        [2, 9],
        [2, 10],
      ],
    },
    // Dron Patrullero Rapido (avanza 2 casillas por turno en el corredor Norte junto a TERM_NORTH)
    {
      id: 'DRN_S1_1',
      type: 'drone',
      x: 4,
      y: 0,
      dir: 'down',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [4, 0],
        [4, 1],
        [4, 2],
        [5, 2],
        [6, 2],
        [6, 1],
        [6, 0],
        [5, 0],
      ],
      visionTiles: [
        [4, 1],
        [4, 2],
      ],
    },
    // Compuerta blindada central (requiere AMBAS Terminales hackeadas + 25% bateria)
    { id: 'DOOR_1', type: 'door', x: 8, y: 5, open: false, minigame: 'SEQUENCE' },
    // Compuerta de enlace al Sector 2 (borde este, cara morada; requiere Terminales + 25% bateria)
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
    // 2 Terminales de datos del Sector 1 (ambas deben ser hackeadas para liberar las compuertas)
    { id: 'TERM_NORTH', type: 'terminal', x: 6, y: 0, open: false, minigame: 'SEQUENCE' },
    { id: 'TERM_1', type: 'terminal', x: 7, y: 10, open: false, minigame: 'SEQUENCE' },
    // 3 Modulos de energia (+35% cada uno)
    { id: 'EN_1', type: 'energy', x: 0, y: 6 },
    { id: 'EN_S1_SOUTH', type: 'energy', x: 0, y: 11 },
    { id: 'EN_2', type: 'energy', x: 11, y: 0 },
    // 4 Minas laser de seguridad
    { id: 'TRP_1', type: 'trap', x: 2, y: 4 },
    { id: 'TRP_2', type: 'trap', x: 6, y: 4 },
    { id: 'TRP_3', type: 'trap', x: 9, y: 7 },
    { id: 'TRP_4', type: 'trap', x: 10, y: 4 },
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
  roomName: 'SECTOR 2: CAMARA ACORAZADA',
  roomId: 'sector_2',
  width: 12,
  height: 12,
  tiles: [
    // 0  1  2  3  4  5  6  7  8  9 10 11
    [0, 0, 7, 1, 0, 4, 0, 1, 0, 0, 0, 0], // y=0: (2,0) Terminal Noroeste; (5,0) Energia 3
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0], // y=1
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], // y=2
    [0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0], // y=3: (7,3) Camara rotativa de boveda
    [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // y=4
    [0, 1, 0, 1, 1, 0, 7, 0, 1, 0, 1, 0], // y=5: (0,5) Entrada desde Sector 1; (6,5) Terminal Maestra Boveda
    [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0], // y=6
    [0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 4], // y=7: (11,7) Energia Este Boveda
    [1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1], // y=8: Muro acorazado horizontal; unico paso en (5,8) Compuerta Boveda Sur
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // y=9
    [0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1], // y=10
    [4, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 5], // y=11: (0,11) Energia 4; (10,11) Compuerta Final; (11,11) EXTRACCION
  ],
  players: [
    { playerId: 7, slot: 1, x: 0, y: 5, battery: 30, maxBattery: 100, camouflageTurns: 0 },
  ],
  entities: [
    // Camara rotativa 1 de la Boveda Central
    {
      id: 'CAM_2',
      type: 'camera',
      x: 7,
      y: 3,
      dir: 'down',
      range: 2,
      rotating: true,
      disabledTurns: 0,
      visionTiles: [
        [7, 4],
        [7, 5],
      ],
    },
    // Camara rotativa 2 vigilando el acceso oeste
    {
      id: 'CAM_S2_WEST',
      type: 'camera',
      x: 2,
      y: 4,
      dir: 'left',
      range: 2,
      rotating: true,
      disabledTurns: 0,
      visionTiles: [
        [1, 4],
        [0, 4],
      ],
    },
    // Camara rotativa 3 en el corredor sur de extraccion
    {
      id: 'CAM_S2_SOUTH',
      type: 'camera',
      x: 8,
      y: 9,
      dir: 'left',
      range: 2,
      rotating: true,
      disabledTurns: 0,
      visionTiles: [
        [7, 9],
        [6, 9],
      ],
    },
    // Guardia 5: Circuito cerrado de 14 pasos en el cuadrante noroeste (custodia TERM_VAULT_NW)
    {
      id: 'GRD_5',
      type: 'guard',
      x: 2,
      y: 2,
      dir: 'right',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [2, 2],
        [3, 2],
        [3, 3],
        [3, 4],
        [2, 4],
        [1, 4],
        [0, 4],
        [0, 3],
        [0, 2],
        [0, 1],
        [0, 0],
        [1, 0],
        [2, 0],
        [2, 1],
      ],
      visionTiles: [
        [3, 2],
        [4, 2],
      ],
    },
    // Guardia 6: Gran circuito de 26 pasos rodeando la Boveda Central y la Terminal Maestra
    {
      id: 'GRD_6',
      type: 'guard',
      x: 3,
      y: 6,
      dir: 'right',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [3, 6],
        [4, 6],
        [5, 6],
        [5, 5],
        [5, 4],
        [6, 4],
        [7, 4],
        [7, 5],
        [7, 6],
        [8, 6],
        [9, 6],
        [9, 5],
        [9, 4],
        [9, 3],
        [9, 2],
        [8, 2],
        [7, 2],
        [6, 2],
        [5, 2],
        [4, 2],
        [3, 2],
        [3, 3],
        [3, 4],
        [2, 4],
        [2, 5],
        [2, 6],
      ],
      visionTiles: [
        [4, 6],
        [5, 6],
      ],
    },
    // Guardia 7: Circuito de 16 pasos en el corredor este (custodia EN_5 en (11,7))
    {
      id: 'GRD_7',
      type: 'guard',
      x: 11,
      y: 1,
      dir: 'down',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [11, 1],
        [11, 2],
        [11, 3],
        [11, 4],
        [11, 5],
        [11, 6],
        [11, 7],
        [10, 7],
        [9, 7],
        [9, 6],
        [9, 5],
        [9, 4],
        [10, 4],
        [11, 4],
        [11, 3],
        [11, 2],
      ],
      visionTiles: [
        [11, 2],
        [11, 3],
      ],
    },
    // Guardia 8: Circuito cerrado de 10 pasos en el Ala Sur de Extraccion
    {
      id: 'GRD_8',
      type: 'guard',
      x: 4,
      y: 9,
      dir: 'right',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [4, 9],
        [5, 9],
        [6, 9],
        [7, 9],
        [7, 10],
        [7, 11],
        [6, 11],
        [5, 11],
        [4, 11],
        [4, 10],
      ],
      visionTiles: [
        [5, 9],
        [6, 9],
      ],
    },
    // Dron Rapido de Boveda (2 casillas por turno en el corredor sur de extraccion)
    {
      id: 'DRN_S2_1',
      type: 'drone',
      x: 2,
      y: 9,
      dir: 'right',
      range: 2,
      disabledTurns: 0,
      pathIndex: 0,
      path: [
        [2, 9],
        [3, 9],
        [4, 9],
        [4, 11],
        [3, 11],
        [2, 11],
        [2, 10],
      ],
      visionTiles: [
        [3, 9],
        [4, 9],
      ],
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
    // 2 Terminales de datos de la Boveda (ambas requeridas para abrir las compuertas del Sector 2)
    { id: 'TERM_VAULT_NW', type: 'terminal', x: 2, y: 0, open: false, minigame: 'SEQUENCE' },
    { id: 'TERM_VAULT', type: 'terminal', x: 6, y: 5, open: false, minigame: 'SEQUENCE' },
    // Compuerta blindada que divide el nucleo de la boveda y el corredor sur de extraccion
    { id: 'DOOR_VAULT_SOUTH', type: 'door', x: 5, y: 8, open: false, minigame: 'SEQUENCE' },
    // Compuerta de la esclusa final antes de la plataforma de extraccion
    { id: 'DOOR_EXTRACTION', type: 'door', x: 10, y: 11, open: false, minigame: 'SEQUENCE' },
    // 3 Modulos de energia (+35% cada uno)
    { id: 'EN_3', type: 'energy', x: 5, y: 0 },
    { id: 'EN_5', type: 'energy', x: 11, y: 7 },
    { id: 'EN_4', type: 'energy', x: 0, y: 11 },
    // 5 Minas laser de la boveda
    { id: 'TRP_S2_1', type: 'trap', x: 4, y: 2 },
    { id: 'TRP_3', type: 'trap', x: 7, y: 7 },
    { id: 'TRP_S2_2', type: 'trap', x: 9, y: 3 },
    { id: 'TRP_4', type: 'trap', x: 8, y: 10 },
    { id: 'TRP_S2_3', type: 'trap', x: 2, y: 10 },
  ],
  revealedTraps: [],
  fog: null,
};

export const SECTOR_ROOMS: Record<string, SessionState> = {
  sector_1: mockSector1State,
  sector_2: mockSector2State,
};

export const mockLevel1State = mockSector1State;
