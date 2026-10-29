// Reglas fijas del juego (docs/NEXO_Contexto_IA.md, secciones 5, 6, 7 y 8).

/** Recursos de una cuenta nueva (sección 7). */
const STARTING_RESOURCES = { credits: 100, energy: 50, intel: 10 };

/** Costo de batería de cada habilidad del reloj (sección 6). */
const SKILL_COSTS = {
  HACK: 20,
  SCANNER: 15,
  SABOTAGE: 25,
  CAMOUFLAGE: 35,
  OVERLOAD: 20,
  RADAR: 15,
  EMP: 30,
  THERMAL: 25,
  TIMEDILATE: 40,
};

const INITIAL_SKILLS = ['SCANNER', 'SABOTAGE', 'CAMOUFLAGE'];
const EQUIPPABLE_SKILLS = Object.keys(SKILL_COSTS).filter((s) => s !== 'HACK');
const MAX_EQUIPPED = 4;

/** Costo de subir cada mejora al nivel indicado (sección 7). */
const UPGRADE_COSTS = {
  battery: {
    2: { credits: 150, energy: 40, intel: 0 },
    3: { credits: 300, energy: 80, intel: 0 },
  },
  cipher: {
    2: { credits: 0, energy: 0, intel: 20 },
    3: { credits: 0, energy: 0, intel: 45 },
  },
  efficiency: {
    2: { credits: 100, energy: 30, intel: 0 },
    3: { credits: 200, energy: 60, intel: 0 },
  },
};
const UPGRADE_COLUMNS = {
  battery: 'battery_level',
  cipher: 'cipher_level',
  efficiency: 'efficiency_level',
};

function maxBatteryFor(batteryLevel) {
  return batteryLevel >= 3 ? 150 : batteryLevel === 2 ? 125 : 100;
}

function efficiencyDiscount(efficiencyLevel) {
  return efficiencyLevel >= 3 ? 10 : efficiencyLevel === 2 ? 5 : 0;
}

function skillCost(code, efficiencyLevel) {
  const base = SKILL_COSTS[code] ?? 20;
  return Math.max(5, base - efficiencyDiscount(efficiencyLevel));
}

/** Catálogo de los 5 niveles (sección 5). */
const MISSIONS = [
  {
    level: 1,
    name: 'BÓVEDA CENTRAL',
    theme: 'BANK',
    minigameLabel: 'Secuencia de 4 nodos (Simón Dice)',
    description:
      'Infiltra el perímetro bancario y la cámara acorazada. Gestiona la batería entre módulos de energía y terminales para cruzar las puertas blindadas.',
    rewards: { credits: 250, energy: 60, intel: 30 },
    unlocksSkill: 'OVERLOAD',
  },
  {
    level: 2,
    name: 'CRIPTA DEL COLECCIONISTA',
    theme: 'CRYPT',
    minigameLabel: 'Glifos de seguridad (3 anillos)',
    description:
      'Galería subterránea con láseres que se apagan y encienden cada 2 turnos y tesoros secundarios custodiados por patrullas dobles.',
    rewards: { credits: 350, energy: 80, intel: 40 },
    unlocksSkill: 'RADAR',
  },
  {
    level: 3,
    name: 'COMPLEJO NEURO-LINK',
    theme: 'LAB',
    minigameLabel: 'Sincronización de frecuencia de onda',
    description:
      'Laboratorio de alta seguridad patrullado por drones rápidos (2 casillas por turno) y puertas de doble cerrojo electrónico.',
    rewards: { credits: 500, energy: 100, intel: 55 },
    unlocksSkill: 'EMP',
  },
  {
    level: 4,
    name: 'NIDO DE SERVIDORES',
    theme: 'SERVERS',
    minigameLabel: 'Secuencia rápida de 5 nodos',
    description:
      'Centro de datos cubierto por niebla de guerra (visibilidad reducida a 2 casillas) y zonas PEM que bloquean el reloj temporalmente.',
    rewards: { credits: 700, energy: 130, intel: 75 },
    unlocksSkill: 'THERMAL',
  },
  {
    level: 5,
    name: 'FORTALEZA ORBITAL',
    theme: 'ORBITAL',
    minigameLabel: 'Sobrecarga de núcleo (2 fases)',
    description:
      'Estación espacial con torretas giratorias de 90 grados por turno y subida acelerada de alerta. La prueba definitiva del equipo NEXO.',
    rewards: { credits: 1000, energy: 200, intel: 120 },
    unlocksSkill: 'TIMEDILATE',
  },
];

/** Minijuego del reloj según el tema del nivel (sección 5). */
const MINIGAME_BY_THEME = {
  BANK: 'SEQUENCE',
  CRYPT: 'GLYPHS',
  LAB: 'WAVES',
  SERVERS: 'FAST_SEQUENCE',
  ORBITAL: 'CORE_OVERLOAD',
};

/** Costo en créditos de cada pieza del editor de base PvP (sección 8.2). */
const BASE_PIECE_COSTS = { wall: 10, door: 35, camera: 50, guard: 75, trap: 40 };
const RAID_LOOT_RATIO = 0.3;
const BASE_SIZE = 10;

module.exports = {
  STARTING_RESOURCES,
  SKILL_COSTS,
  INITIAL_SKILLS,
  EQUIPPABLE_SKILLS,
  MAX_EQUIPPED,
  UPGRADE_COSTS,
  UPGRADE_COLUMNS,
  maxBatteryFor,
  efficiencyDiscount,
  skillCost,
  MISSIONS,
  MINIGAME_BY_THEME,
  BASE_PIECE_COSTS,
  RAID_LOOT_RATIO,
  BASE_SIZE,
};
