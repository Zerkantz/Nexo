// Tipos del contrato con el backend (docs/NEXO_Contexto_IA.md, secciones 11, 12 y 13).
// Si el contrato cambia, actualizar aquí Y en el documento.

export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Códigos de casillas (sección 13):
 * 0 piso · 1 muro · 2 puerta · 4 nodo de energía · 5 extracción
 * 6 inicio J1 · 8 inicio J2 · 7 terminal · 9 vacío/abismo
 */
export const Tile = {
  FLOOR: 0,
  WALL: 1,
  DOOR: 2,
  ENERGY: 4,
  EXTRACTION: 5,
  START_P1: 6,
  TERMINAL: 7,
  START_P2: 8,
  ABYSS: 9,
} as const;

export type EntityType =
  | 'camera'
  | 'guard'
  | 'drone'
  | 'turret'
  | 'trap'
  | 'door'
  | 'dual_door'
  | 'terminal'
  | 'energy'
  | 'emp_zone'
  | 'treasure'
  | 'vault';

export type MinigameType = 'SEQUENCE' | 'GLYPHS' | 'WAVES' | 'FAST_SEQUENCE' | 'CORE_OVERLOAD';

/** Coordenada [x, y] */
export type Point = [number, number];

/**
 * Entidad tal como llega en session:state.
 * Solo id, type, x, y son obligatorios; el resto depende del tipo.
 */
export interface GameEntity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  dir?: Direction; // cámaras, guardias, drones
  range?: number;
  disabledTurns?: number; // cámaras saboteadas, drones con PEM
  visionTiles?: Point[]; // las calcula el servidor
  open?: boolean; // puertas
  minigame?: MinigameType; // puertas y terminales
  terminals?: Point[]; // dual_door
  path?: Point[]; // ruta de patrulla de guardias y drones
  pathIndex?: number;
  rotating?: boolean; // cámaras rotativas
  targetRoom?: string; // cambio de cuarto / sector
  targetX?: number;
  targetY?: number;
}

export interface SessionPlayer {
  playerId: number;
  slot: 1 | 2;
  x: number;
  y: number;
  battery: number;
  maxBattery: number;
  camouflageTurns: number;
}

export type SessionType = 'SOLO' | 'COOP' | 'RAID';
export type SessionStatus = 'WAITING' | 'PLAYING' | 'WON' | 'LOST' | 'ABANDONED';

/** Evento `session:state` (sección 12). Es lo único que el móvil necesita para dibujar. */
export interface SessionState {
  sessionId: string;
  type: SessionType;
  turn: number;
  alert: number;
  status: SessionStatus;
  theme: string;
  roomName?: string; // Nombre del sector o cuarto actual
  roomId?: string; // ID del cuarto (ej. 'sector_1', 'sector_2')
  width: number;
  height: number;
  tiles: number[][]; // tiles[y][x]
  players: SessionPlayer[];
  entities: GameEntity[];
  // PENDIENTE de confirmar con Integrante 3: formato exacto de revealedTraps y fog.
  revealedTraps: Point[];
  fog: unknown | null;
}

export type GameEventType =
  | 'DOOR_OPENED'
  | 'CAMERA_DISABLED'
  | 'DETECTED'
  | 'TRAP_TRIGGERED'
  | 'ENERGY_PICKED'
  | 'LOOT_PICKED'
  | 'SKILL_USED'
  | 'LOCKDOWN';

/** Evento `game:event` */
export interface GameEvent {
  type: GameEventType;
  data?: Record<string, unknown>;
}

/** Evento `game:ended` */
export interface GameEnded {
  result: 'WON' | 'LOST';
  rewards: { credits: number; energy: number; intel: number };
  unlockedSkill?: string;
}

/** Formato de error de la API y del evento `error` */
export interface ApiError {
  code: string;
  message: string;
}
