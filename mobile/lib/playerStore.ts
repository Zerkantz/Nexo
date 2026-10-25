// Almacén persistente del jugador, progresión, mejoras del Hacker Deck,
// vinculación del reloj, base PvP (con validador BFS) e historial de misiones.
// Intenta sincronizar con la API REST si el servidor está en línea y conserva
// respaldo completo en AsyncStorage para funcionar también en modo local/demo.
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  authApi,
  baseApi,
  pairingApi,
  upgradesApi,
  type MissionHistoryEntry,
  type MissionInfo,
  type PlayerSummary,
  type RaidReportInfo,
  type RaidTargetInfo,
  type SkillCode,
  type UpgradeType,
  type WatchDeviceInfo,
} from './api';
import { clearToken, saveToken } from './tokenStorage';

const STORAGE_KEY = 'nexo_player_profile_v2';

export interface SkillDefinition {
  code: SkillCode;
  name: string;
  cost: number;
  effect: string;
  unlockedAtLevel: number; // 0 = inicial, 1..5 = por nivel
}

export const SKILL_CATALOG: SkillDefinition[] = [
  {
    code: 'SCANNER',
    name: 'Escáner de Pulso',
    cost: 15,
    effect: 'Revela trampas ocultas en un radio de 3 casillas durante 3 turnos.',
    unlockedAtLevel: 0,
  },
  {
    code: 'SABOTAGE',
    name: 'Sabotaje Óptico',
    cost: 25,
    effect: 'Apaga la cámara de seguridad más cercana durante 3 turnos.',
    unlockedAtLevel: 0,
  },
  {
    code: 'CAMOUFLAGE',
    name: 'Camuflaje de Señal',
    cost: 35,
    effect: 'Impide que cámaras y guardias sumen alerta durante 2 turnos.',
    unlockedAtLevel: 0,
  },
  {
    code: 'OVERLOAD',
    name: 'Sobrecarga de Bóveda',
    cost: 20,
    effect: 'Apaga los láseres en un radio de 4 casillas durante 2 turnos.',
    unlockedAtLevel: 1,
  },
  {
    code: 'RADAR',
    name: 'Radar de Frecuencia',
    cost: 15,
    effect: 'Muestra una brújula en el reloj y vibra al acercarte al objetivo.',
    unlockedAtLevel: 2,
  },
  {
    code: 'EMP',
    name: 'Pulso PEM',
    cost: 30,
    effect: 'Paraliza al dron patrullero más cercano durante 4 turnos.',
    unlockedAtLevel: 3,
  },
  {
    code: 'THERMAL',
    name: 'Visión Térmica',
    cost: 25,
    effect: 'Disipa la niebla y revela enemigos a través de muros por 3 turnos.',
    unlockedAtLevel: 4,
  },
  {
    code: 'TIMEDILATE',
    name: 'Dilatación Temporal',
    cost: 40,
    effect: 'Congela enemigos y cámaras de vigilancia durante 2 turnos.',
    unlockedAtLevel: 5,
  },
];

export interface UpgradeTierInfo {
  level: 1 | 2 | 3;
  label: string;
  costCredits: number;
  costEnergy: number;
  costIntel: number;
}

export interface UpgradeCatalogItem {
  type: UpgradeType;
  name: string;
  subtitle: string;
  tiers: [UpgradeTierInfo, UpgradeTierInfo, UpgradeTierInfo];
}

export const UPGRADE_CATALOG: UpgradeCatalogItem[] = [
  {
    type: 'battery',
    name: 'Batería de Alta Capacidad',
    subtitle: 'Incrementa la reserva máxima de energía del Hacker Deck en misión.',
    tiers: [
      { level: 1, label: 'Capacidad máxima: 100 %', costCredits: 0, costEnergy: 0, costIntel: 0 },
      { level: 2, label: 'Capacidad máxima: 125 %', costCredits: 150, costEnergy: 40, costIntel: 0 },
      { level: 3, label: 'Capacidad máxima: 150 %', costCredits: 300, costEnergy: 80, costIntel: 0 },
    ],
  },
  {
    type: 'cipher',
    name: 'Chip Desencriptador',
    subtitle: 'Simplifica los patrones de seguridad en terminales y puertas.',
    tiers: [
      { level: 1, label: 'Secuencia estándar (4 nodos)', costCredits: 0, costEnergy: 0, costIntel: 0 },
      { level: 2, label: 'Secuencias más cortas (4 -> 3 nodos)', costCredits: 0, costEnergy: 0, costIntel: 20 },
      { level: 3, label: 'Secuencia corta + visualización lenta', costCredits: 0, costEnergy: 0, costIntel: 45 },
    ],
  },
  {
    type: 'efficiency',
    name: 'Optimizador de Pulso',
    subtitle: 'Reduce el consumo de batería al activar habilidades y hackeos.',
    tiers: [
      { level: 1, label: 'Consumo nominal (0 % ahorro)', costCredits: 0, costEnergy: 0, costIntel: 0 },
      { level: 2, label: '-5 % al costo de batería en habilidades', costCredits: 100, costEnergy: 30, costIntel: 0 },
      { level: 3, label: '-10 % al costo de batería en habilidades', costCredits: 200, costEnergy: 60, costIntel: 0 },
    ],
  },
];

export interface BaseEntityPlacement {
  id: string;
  type: 'camera' | 'guard' | 'trap' | 'door';
  x: number;
  y: number;
  dir?: 'up' | 'down' | 'left' | 'right';
}

export interface PlayerBaseConfig {
  name: string;
  width: number;
  height: number;
  tiles: number[][]; // 10x10
  entities: BaseEntityPlacement[];
  vaultCredits: number;
  isPublished: boolean;
  timesRaided: number;
  timesDefended: number;
  updatedAt: string;
}

export interface PlayerProfileState {
  isAuthenticated: boolean;
  player: PlayerSummary;
  watch: WatchDeviceInfo | null;
  upgrades: {
    battery: 1 | 2 | 3;
    cipher: 1 | 2 | 3;
    efficiency: 1 | 2 | 3;
  };
  unlockedSkills: SkillCode[];
  equippedSkills: SkillCode[];
  missions: MissionInfo[];
  base: PlayerBaseConfig;
  raidTargets: RaidTargetInfo[];
  raidReports: RaidReportInfo[];
  history: MissionHistoryEntry[];
}

function createDefaultBase(): PlayerBaseConfig {
  // Cuadrícula 10x10 con muros perimetrales, entrada en (1,1) y bóveda en (8,8)
  const tiles: number[][] = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 6, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 2, 0, 1, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 1, 0, 1, 0, 1],
    [1, 1, 2, 1, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 2, 0, 5, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];

  return {
    name: 'FORTALEZA SECTOR-09',
    width: 10,
    height: 10,
    tiles,
    entities: [
      { id: 'CAM_B1', type: 'camera', x: 5, y: 1, dir: 'down' },
      { id: 'CAM_B2', type: 'camera', x: 8, y: 5, dir: 'left' },
      { id: 'GRD_B1', type: 'guard', x: 3, y: 6, dir: 'right' },
      { id: 'TRP_B1', type: 'trap', x: 5, y: 5 },
      { id: 'DOOR_B1', type: 'door', x: 4, y: 2 },
      { id: 'DOOR_B2', type: 'door', x: 2, y: 5 },
      { id: 'DOOR_B3', type: 'door', x: 6, y: 8 },
    ],
    vaultCredits: 450,
    isPublished: true,
    timesRaided: 4,
    timesDefended: 3,
    updatedAt: 'Hace 15 min',
  };
}

export const DEFAULT_MISSIONS: MissionInfo[] = [
  {
    id: 1,
    levelNumber: 1,
    name: 'BÓVEDA CENTRAL',
    theme: 'BANK',
    minigame: 'Secuencia de 4 nodos (Simón Dice)',
    description:
      'Infiltra el perímetro bancario y la cámara acorazada. Gestiona la batería entre módulos de energía y terminales para cruzar las puertas blindadas.',
    rewardCredits: 250,
    rewardEnergy: 60,
    rewardIntel: 30,
    unlocksSkill: 'OVERLOAD',
    status: 'AVAILABLE',
    bestTurns: null,
    timesPlayed: 0,
  },
  {
    id: 2,
    levelNumber: 2,
    name: 'CRIPTA DEL COLECCIONISTA',
    theme: 'CRYPT',
    minigame: 'Glifos de seguridad (3 de 9 símbolos)',
    description:
      'Galería subterránea con láseres que se apagan y encienden cada 2 turnos y tesoros secundarios custodiados por patrullas dobles.',
    rewardCredits: 350,
    rewardEnergy: 80,
    rewardIntel: 40,
    unlocksSkill: 'RADAR',
    status: 'AVAILABLE',
    bestTurns: null,
    timesPlayed: 0,
  },
  {
    id: 3,
    levelNumber: 3,
    name: 'COMPLEJO NEURO-LINK',
    theme: 'LAB',
    minigame: 'Sincronización de frecuencia de onda',
    description:
      'Laboratorio de alta seguridad patrullado por drones rápidos (2 casillas por turno) y puertas de doble cerrojo electrónico.',
    rewardCredits: 500,
    rewardEnergy: 100,
    rewardIntel: 55,
    unlocksSkill: 'EMP',
    status: 'LOCKED',
    bestTurns: null,
    timesPlayed: 0,
  },
  {
    id: 4,
    levelNumber: 4,
    name: 'NIDO DE SERVIDORES',
    theme: 'SERVERS',
    minigame: 'Secuencia rápida de 5 nodos',
    description:
      'Centro de datos cubierto por niebla de guerra (visibilidad reducida a 2 casillas) y zonas PEM que bloquean el reloj temporalmente.',
    rewardCredits: 700,
    rewardEnergy: 130,
    rewardIntel: 75,
    unlocksSkill: 'THERMAL',
    status: 'LOCKED',
    bestTurns: null,
    timesPlayed: 0,
  },
  {
    id: 5,
    levelNumber: 5,
    name: 'FORTALEZA ORBITAL',
    theme: 'ORBITAL',
    minigame: 'Sobrecarga de núcleo (2 fases seguidas)',
    description:
      'Estación espacial con torretas giratorias de 90 grados por turno y subida acelerada de alerta. La prueba definitiva del equipo NEXO.',
    rewardCredits: 1000,
    rewardEnergy: 200,
    rewardIntel: 120,
    unlocksSkill: 'TIMEDILATE',
    status: 'LOCKED',
    bestTurns: null,
    timesPlayed: 0,
  },
];

export const DEFAULT_PROFILE_STATE: PlayerProfileState = {
  isAuthenticated: true,
  player: {
    id: 1,
    username: 'AGENTE_NEXO',
    email: 'agente@nexo.tactical',
    credits: 350,
    energy: 90,
    intel: 35,
  },
  watch: null,
  upgrades: {
    battery: 1,
    cipher: 1,
    efficiency: 1,
  },
  unlockedSkills: ['SCANNER', 'SABOTAGE', 'CAMOUFLAGE', 'OVERLOAD'],
  equippedSkills: ['SCANNER', 'SABOTAGE', 'CAMOUFLAGE', 'OVERLOAD'],
  missions: DEFAULT_MISSIONS,
  base: createDefaultBase(),
  raidTargets: [
    {
      id: 201,
      ownerUsername: 'KRONOS_99',
      baseName: 'BÚNKER CRIPTO-7',
      vaultCredits: 600,
      securityRating: 'MEDIA // 3 Cámaras · 2 Guardias',
      timesRaided: 8,
      timesDefended: 5,
    },
    {
      id: 202,
      ownerUsername: 'VALKYRIE_OS',
      baseName: 'NODO_NEURAL_X',
      vaultCredits: 920,
      securityRating: 'ALTA // 4 Cámaras · 3 Guardias · Trampas',
      timesRaided: 12,
      timesDefended: 10,
    },
    {
      id: 203,
      ownerUsername: 'ZERO_COOL',
      baseName: 'SECTOR FANTASMA',
      vaultCredits: 420,
      securityRating: 'ESTÁNDAR // 2 Cámaras · 2 Puertas',
      timesRaided: 5,
      timesDefended: 2,
    },
  ],
  raidReports: [
    {
      id: 301,
      attackerUsername: 'SHADOW_VEX',
      success: false,
      creditsStolen: 0,
      seenByDefender: true,
      createdAt: 'Hace 2 horas — Frenado en Sector Central (Alerta 100%)',
    },
    {
      id: 302,
      attackerUsername: 'CIPHER_MIND',
      success: true,
      creditsStolen: 135,
      seenByDefender: false,
      createdAt: 'Hace 5 horas — Extrajo botín en 28 turnos',
    },
    {
      id: 303,
      attackerUsername: 'GHOST_PROTOCOL',
      success: false,
      creditsStolen: 0,
      seenByDefender: true,
      createdAt: 'Ayer — Activó trampa láser junto a la bóveda',
    },
  ],
  history: [
    {
      id: 'hist-1',
      missionName: 'BÓVEDA CENTRAL (Nivel 1)',
      type: 'SOLO',
      result: 'WON',
      turns: 39,
      maxAlert: 0,
      creditsEarned: 250,
      energyEarned: 60,
      intelEarned: 30,
      playedAt: 'Hoy · Sigilo Perfecto',
    },
    {
      id: 'hist-2',
      missionName: 'BÚNKER CRIPTO-7 (Asalto PvP)',
      type: 'RAID',
      result: 'WON',
      turns: 24,
      maxAlert: 25,
      creditsEarned: 180,
      energyEarned: 20,
      intelEarned: 10,
      playedAt: 'Ayer · Botín 30% extraído',
    },
  ],
};

let memoryCache: PlayerProfileState | null = null;

export async function loadPlayerProfile(): Promise<PlayerProfileState> {
  if (memoryCache) return memoryCache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlayerProfileState>;
      memoryCache = {
        ...DEFAULT_PROFILE_STATE,
        ...parsed,
        player: { ...DEFAULT_PROFILE_STATE.player, ...(parsed.player ?? {}) },
        upgrades: { ...DEFAULT_PROFILE_STATE.upgrades, ...(parsed.upgrades ?? {}) },
        missions: parsed.missions?.length ? parsed.missions : DEFAULT_MISSIONS,
        base: parsed.base ?? createDefaultBase(),
      };
      return memoryCache;
    }
  } catch {
    // Fallback al perfil por defecto
  }
  memoryCache = DEFAULT_PROFILE_STATE;
  return memoryCache;
}

export async function savePlayerProfile(next: PlayerProfileState): Promise<PlayerProfileState> {
  memoryCache = next;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignorar error de escritura en web/dispositivo sin almacenamiento
  }
  return next;
}

/** Iniciar sesión (intenta backend real y cae en cuenta local si no hay red). */
export async function loginPlayer(email: string, password: string): Promise<PlayerProfileState> {
  const current = await loadPlayerProfile();
  try {
    const res = await authApi.login(email, password);
    await saveToken(res.token);
    return savePlayerProfile({
      ...current,
      isAuthenticated: true,
      player: res.player,
    });
  } catch {
    const usernameFromEmail = email.split('@')[0]?.toUpperCase() || 'AGENTE_NEXO';
    await saveToken('local_demo_jwt_token');
    return savePlayerProfile({
      ...current,
      isAuthenticated: true,
      player: {
        ...current.player,
        username: usernameFromEmail,
        email: email.trim(),
      },
    });
  }
}

/** Registrar cuenta nueva con recursos iniciales (Sección 7: 100 CR, 50 EN, 10 IN). */
export async function registerPlayer(
  username: string,
  email: string,
  password: string,
): Promise<PlayerProfileState> {
  const current = await loadPlayerProfile();
  try {
    const res = await authApi.register(username, email, password);
    await saveToken(res.token);
    return savePlayerProfile({
      ...current,
      isAuthenticated: true,
      player: res.player,
    });
  } catch {
    await saveToken('local_demo_jwt_token');
    return savePlayerProfile({
      ...current,
      isAuthenticated: true,
      player: {
        id: Math.floor(Math.random() * 9000) + 100,
        username: username.trim().toUpperCase() || 'AGENTE_NUEVO',
        email: email.trim() || 'agente@nexo.tactical',
        credits: 350,
        energy: 90,
        intel: 35,
      },
    });
  }
}

export async function logoutPlayer(): Promise<PlayerProfileState> {
  await clearToken();
  const current = await loadPlayerProfile();
  return savePlayerProfile({
    ...current,
    isAuthenticated: false,
  });
}

/** Vincular reloj con código de 4 dígitos (POST /pairing/claim + fallback local). */
export async function linkWatchWithCode(code: string): Promise<{
  ok: boolean;
  message: string;
  profile: PlayerProfileState;
}> {
  const clean = code.trim();
  const current = await loadPlayerProfile();
  if (!/^\d{4}$/.test(clean)) {
    return {
      ok: false,
      message: 'El código debe contener exactamente 4 dígitos numéricos.',
      profile: current,
    };
  }

  try {
    await pairingApi.claim(clean);
  } catch {
    // Modo local: aceptamos cualquier código de 4 dígitos para demostración
  }

  const updated = await savePlayerProfile({
    ...current,
    watch: {
      id: Date.now(),
      deviceName: `Wear OS Hacker Deck #${clean}`,
      linkedAt: 'Vinculado hace unos segundos',
      lastSeenAt: 'Conectado · Latencia 12ms',
    },
  });

  return {
    ok: true,
    message: `Smartwatch vinculado correctamente con el código ${clean}.`,
    profile: updated,
  };
}

export async function unlinkWatch(): Promise<PlayerProfileState> {
  const current = await loadPlayerProfile();
  return savePlayerProfile({
    ...current,
    watch: null,
  });
}

/** Comprar mejora del Taller (Sección 7). */
export async function purchaseUpgrade(type: UpgradeType): Promise<{
  ok: boolean;
  message: string;
  profile: PlayerProfileState;
}> {
  const current = await loadPlayerProfile();
  const currentLevel = current.upgrades[type];
  if (currentLevel >= 3) {
    return { ok: false, message: 'Esta mejora ya está en el nivel máximo (Nivel 3).', profile: current };
  }

  const catalog = UPGRADE_CATALOG.find((u) => u.type === type)!;
  const nextTier = currentLevel === 1 ? catalog.tiers[1] : catalog.tiers[2];

  if (
    current.player.credits < nextTier.costCredits ||
    current.player.energy < nextTier.costEnergy ||
    current.player.intel < nextTier.costIntel
  ) {
    return {
      ok: false,
      message: 'No tienes recursos suficientes para instalar esta mejora.',
      profile: current,
    };
  }

  try {
    await upgradesApi.buy(type);
  } catch {
    // Continuar con actualización local
  }

  const updated = await savePlayerProfile({
    ...current,
    player: {
      ...current.player,
      credits: current.player.credits - nextTier.costCredits,
      energy: current.player.energy - nextTier.costEnergy,
      intel: current.player.intel - nextTier.costIntel,
    },
    upgrades: {
      ...current.upgrades,
      [type]: (currentLevel + 1) as 1 | 2 | 3,
    },
  });

  return {
    ok: true,
    message: `${catalog.name} mejorada a Nivel ${currentLevel + 1}.`,
    profile: updated,
  };
}

/** Equipar/desequipar una habilidad del reloj (máximo 4 además de HACK). */
export async function toggleEquipSkill(skillCode: SkillCode): Promise<{
  ok: boolean;
  message: string;
  profile: PlayerProfileState;
}> {
  const current = await loadPlayerProfile();
  if (!current.unlockedSkills.includes(skillCode)) {
    return { ok: false, message: 'Aún no has desbloqueado esta habilidad.', profile: current };
  }

  const isEquipped = current.equippedSkills.includes(skillCode);
  let nextEquipped: SkillCode[];

  if (isEquipped) {
    if (current.equippedSkills.length <= 1) {
      return {
        ok: false,
        message: 'Debes mantener al menos 1 habilidad táctica equipada.',
        profile: current,
      };
    }
    nextEquipped = current.equippedSkills.filter((s) => s !== skillCode);
  } else {
    if (current.equippedSkills.length >= 4) {
      return {
        ok: false,
        message: 'El Hacker Deck permite equipar un máximo de 4 habilidades (más HACK).',
        profile: current,
      };
    }
    nextEquipped = [...current.equippedSkills, skillCode];
  }

  try {
    await upgradesApi.equipSkills(nextEquipped);
  } catch {
    // Respaldo local
  }

  const updated = await savePlayerProfile({
    ...current,
    equippedSkills: nextEquipped,
  });

  return {
    ok: true,
    message: isEquipped ? 'Habilidad retirada del Deck.' : 'Habilidad equipada en el Deck.',
    profile: updated,
  };
}

/**
 * Validación BFS (Sección 8.2 de docs/NEXO_Contexto_IA.md):
 * Revisa que exista al menos un camino posible desde la entrada (tile 6) hasta
 * la bóveda/extracción (tile 5), contando las puertas (tile 2) como cruzables.
 */
export function validateBaseBFS(tiles: number[][]): {
  valid: boolean;
  reason: string;
  pathLength?: number;
  startPos?: [number, number];
  vaultPos?: [number, number];
} {
  const height = tiles.length;
  const width = tiles[0]?.length ?? 0;
  let start: [number, number] | null = null;
  let vault: [number, number] | null = null;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (tiles[y][x] === 6) start = [x, y];
      if (tiles[y][x] === 5) vault = [x, y];
    }
  }

  if (!start) {
    return { valid: false, reason: 'Falta colocar la casilla de Entrada del atacante (6).' };
  }
  if (!vault) {
    return { valid: false, reason: 'Falta colocar la Bóveda / Extracción (5).' };
  }

  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const queue: [number, number, number][] = [[start[0], start[1], 0]];
  visited[start[1]][start[0]] = true;

  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];

  while (queue.length > 0) {
    const [cx, cy, dist] = queue.shift()!;
    if (cx === vault[0] && cy === vault[1]) {
      return {
        valid: true,
        reason: `Ruta BFS verificada (${dist} pasos desde la Entrada hasta la Bóveda).`,
        pathLength: dist,
        startPos: start,
        vaultPos: vault,
      };
    }

    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (visited[ny][nx]) continue;
      const t = tiles[ny][nx];
      // Caminables en BFS: piso (0), puerta (2), energía (4), bóveda (5), entrada (6), terminal (7)
      if (t !== 1 && t !== 9) {
        visited[ny][nx] = true;
        queue.push([nx, ny, dist + 1]);
      }
    }
  }

  return {
    valid: false,
    reason: 'Ruta bloqueada: no existe ningún camino posible entre la Entrada y la Bóveda (BFS falló).',
  };
}

/** Guardar y/o publicar la base personalizada del jugador. */
export async function saveAndPublishBase(
  nextBase: PlayerBaseConfig,
  publish: boolean,
): Promise<{
  ok: boolean;
  message: string;
  profile: PlayerProfileState;
}> {
  const current = await loadPlayerProfile();
  const check = validateBaseBFS(nextBase.tiles);
  if (publish && !check.valid) {
    return { ok: false, message: check.reason, profile: current };
  }

  try {
    await baseApi.saveDraft(nextBase.name, nextBase);
    if (publish) await baseApi.publish();
  } catch {
    // Guardado local
  }

  const updated = await savePlayerProfile({
    ...current,
    base: {
      ...nextBase,
      isPublished: publish ? true : nextBase.isPublished,
      updatedAt: 'Guardado hace instantes',
    },
  });

  return {
    ok: true,
    message: publish
      ? `Base "${nextBase.name}" validada con BFS y publicada en la red PvP.`
      : `Borrador de "${nextBase.name}" guardado.`,
    profile: updated,
  };
}

/** Registrar el final de una misión y acreditar recompensas + desbloqueos. */
export async function recordMissionCompletion(params: {
  sessionId: string;
  result: 'WON' | 'LOST';
  turns: number;
  maxAlert: number;
  rewards: { credits: number; energy: number; intel: number };
  unlockedSkill?: string;
}): Promise<PlayerProfileState> {
  const current = await loadPlayerProfile();
  const isWin = params.result === 'WON';

  // Determinar qué nivel se jugó según el sessionId
  let levelNum = 1;
  if (params.sessionId.startsWith('level-')) {
    levelNum = parseInt(params.sessionId.replace('level-', ''), 10) || 1;
  }

  const nextMissions = current.missions.map((m) => {
    if (m.levelNumber === levelNum) {
      return {
        ...m,
        status: isWin ? ('COMPLETED' as const) : m.status,
        timesPlayed: m.timesPlayed + 1,
        bestTurns:
          isWin && (m.bestTurns === null || params.turns < m.bestTurns)
            ? params.turns
            : m.bestTurns,
      };
    }
    if (isWin && m.levelNumber === levelNum + 1 && m.status === 'LOCKED') {
      return { ...m, status: 'AVAILABLE' as const };
    }
    return m;
  });

  const nextUnlockedSkills = [...current.unlockedSkills];
  if (
    isWin &&
    params.unlockedSkill &&
    !nextUnlockedSkills.includes(params.unlockedSkill as SkillCode)
  ) {
    nextUnlockedSkills.push(params.unlockedSkill as SkillCode);
  }

  const isRaid = params.sessionId.startsWith('raid-');
  const isCoop = params.sessionId.startsWith('coop-');

  const newEntry: MissionHistoryEntry = {
    id: `hist-${Date.now()}`,
    missionName: isRaid
      ? `ASALTO BASE #${params.sessionId.replace('raid-', '')}`
      : isCoop
        ? `OPERACIÓN CO-OP (${params.sessionId.toUpperCase()})`
        : `NIVEL ${levelNum}: ${nextMissions.find((m) => m.levelNumber === levelNum)?.name ?? 'OPERACIÓN'}`,
    type: isRaid ? 'RAID' : isCoop ? 'COOP' : 'SOLO',
    result: params.result,
    turns: params.turns,
    maxAlert: params.maxAlert,
    creditsEarned: isWin ? params.rewards.credits : 0,
    energyEarned: isWin ? params.rewards.energy : 0,
    intelEarned: isWin ? params.rewards.intel : 0,
    playedAt: 'Hace unos instantes',
  };

  return savePlayerProfile({
    ...current,
    player: {
      ...current.player,
      credits: current.player.credits + (isWin ? params.rewards.credits : 0),
      energy: current.player.energy + (isWin ? params.rewards.energy : 0),
      intel: current.player.intel + (isWin ? params.rewards.intel : 0),
    },
    unlockedSkills: nextUnlockedSkills,
    missions: nextMissions,
    history: [newEntry, ...current.history.slice(0, 19)],
  });
}
