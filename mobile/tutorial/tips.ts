// Catálogo de cartas del tutorial. Cada carta explica UNA mecánica y aparece la primera vez
// que el jugador se la encuentra (como en la mayoría de los juegos). También se usan en la
// pantalla "Cómo jugar".
import {
  Battery,
  CameraOff,
  CloudFog,
  Crosshair,
  DoorClosed,
  Eye,
  Flag,
  Gamepad2,
  Gem,
  Ghost,
  Hourglass,
  Lock,
  Monitor,
  Plane,
  Radar,
  Radiation,
  ScanEye,
  ShieldAlert,
  Siren,
  TriangleAlert,
  Users,
  Watch,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { Tile, type GameEntity, type Point, type SessionPlayer, type SessionState } from '../lib/types';

export type TipGroup = 'intro' | 'danger' | 'map' | 'advanced';

/** Fila de la leyenda: ícono o muestra de color + texto */
export interface TipLegend {
  icon?: LucideIcon;
  swatch?: string; // color de una casilla de ejemplo
  color: string;
  text: string;
}

/** Datos que reciben los disparadores */
export interface TipContext {
  state: SessionState;
  me: SessionPlayer | undefined;
  prev: SessionState | null;
}

export interface Tip {
  id: string;
  group: TipGroup;
  icon: LucideIcon;
  color: string;
  title: string;
  body: string;
  legend?: TipLegend[];
  /** ¿Debe aparecer ahora? */
  trigger: (ctx: TipContext) => boolean;
  /** Casillas que parpadean en el tablero mientras se muestra la carta */
  highlight?: (ctx: TipContext) => Point[];
}

// ---------- Ayudantes ----------

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const activeVisionTiles = (state: SessionState): Point[] =>
  state.entities.filter((e) => !e.disabledTurns).flatMap((e) => e.visionTiles ?? []);

const findEntities = (state: SessionState, type: GameEntity['type']) =>
  state.entities.filter((e) => e.type === type);

const entityPoints = (list: GameEntity[]): Point[] => list.map((e) => [e.x, e.y]);

/** Entidad cerrada del tipo dado justo al lado del jugador */
const adjacentClosed = ({ state, me }: TipContext, type: GameEntity['type']) =>
  me ? findEntities(state, type).find((e) => !e.open && distance(e, me) === 1) : undefined;

const near = ({ state, me }: TipContext, type: GameEntity['type'], maxDist: number) =>
  !!me && findEntities(state, type).some((e) => distance(e, me) <= maxDist);

const tilesWithCode = (state: SessionState, code: number): Point[] => {
  const out: Point[] = [];
  state.tiles.forEach((row, y) => row.forEach((c, x) => c === code && out.push([x, y])));
  return out;
};

const walkableNeighbors = ({ state, me }: TipContext): Point[] => {
  if (!me) return [];
  const candidates: Point[] = [
    [me.x, me.y - 1],
    [me.x, me.y + 1],
    [me.x - 1, me.y],
    [me.x + 1, me.y],
  ];
  return candidates.filter(([x, y]) => {
    const t = state.tiles[y]?.[x];
    return t !== undefined && t !== Tile.WALL && t !== Tile.ABYSS;
  });
};

const always = () => true;

// ---------- Cartas ----------

export const TIPS: Tip[] = [
  // ===== Introducción (se muestran en orden al empezar) =====
  {
    id: 'objective',
    group: 'intro',
    icon: Flag,
    color: colors.success,
    title: 'Tu objetivo',
    body: 'Infíltrate sin ser visto y llega a la casilla de extracción para completar la misión.',
    legend: [{ icon: Flag, color: colors.success, text: 'Extracción: la salida del nivel' }],
    trigger: always,
    highlight: ({ state }) => tilesWithCode(state, Tile.EXTRACTION),
  },
  {
    id: 'movement',
    group: 'intro',
    icon: Gamepad2,
    color: colors.stealth,
    title: 'Moverse',
    body: 'Usa la cruceta o toca una de las casillas resaltadas junto a tu personaje para avanzar una casilla.',
    legend: [{ swatch: colors.stealth, color: colors.stealth, text: 'El círculo cian eres tú' }],
    trigger: always,
    highlight: walkableNeighbors,
  },
  {
    id: 'turns',
    group: 'intro',
    icon: Hourglass,
    color: colors.stealth,
    title: 'Juego por turnos',
    body:
      'El mundo solo avanza cuando te mueves o pulsas Esperar: los guardias dan un paso y las cámaras giran. ' +
      'Mirar el reloj o usar habilidades NO gasta turno, así que piensa con calma.',
    trigger: always,
  },
  {
    id: 'hud',
    group: 'intro',
    icon: ShieldAlert,
    color: colors.stealth,
    title: 'Batería y alerta',
    body: 'Arriba ves tus dos recursos más importantes. Vigílalos siempre.',
    legend: [
      { icon: Battery, color: colors.stealth, text: 'Batería: la gastan las habilidades del reloj' },
      { icon: ShieldAlert, color: colors.stealth, text: 'Sigilo (0-49 %): todo normal' },
      { icon: ShieldAlert, color: colors.suspicion, text: 'Sospecha (50-99 %): los enemigos ven más lejos' },
      { icon: ShieldAlert, color: colors.danger, text: 'Lockdown (100 %): pierdes la misión' },
    ],
    trigger: always,
  },
  {
    id: 'watch',
    group: 'intro',
    icon: Watch,
    color: colors.stealth,
    title: 'Tu reloj es el Hacker Deck',
    body: 'Las habilidades se usan desde el reloj y gastan batería. Lo que hagas en el reloj cambia el mapa al instante.',
    legend: [
      { icon: Radar, color: colors.stealth, text: 'Escáner (15 %): revela trampas cercanas' },
      { icon: CameraOff, color: colors.stealth, text: 'Sabotaje (25 %): apaga la cámara más cercana' },
      { icon: Ghost, color: colors.stealth, text: 'Camuflaje (35 %): no te detectan por 2 turnos' },
    ],
    trigger: always,
  },

  // ===== Peligros (aparecen al encontrarlos) =====
  {
    id: 'vision',
    group: 'danger',
    icon: Eye,
    color: colors.danger,
    title: 'Conos de visión',
    body:
      'Las casillas coloreadas son lo que ven los enemigos. Si terminas tu turno dentro, sube la alerta. ' +
      'Rodéalas, espera a que el guardia se mueva o usa Sabotaje o Camuflaje.',
    legend: [
      { swatch: colors.danger, color: colors.danger, text: 'Visión de cámara: +35 % de alerta' },
      { swatch: colors.suspicion, color: colors.suspicion, text: 'Visión de guardia: +50 % de alerta' },
    ],
    trigger: ({ state, me }) => !!me && activeVisionTiles(state).some(([x, y]) => distance({ x, y }, me) <= 2),
    highlight: ({ state }) => activeVisionTiles(state),
  },
  {
    id: 'detected',
    group: 'danger',
    icon: ScanEye,
    color: colors.danger,
    title: 'Te detectaron',
    body: 'Terminaste un turno a la vista de un enemigo y la alerta subió. Sal del cono de visión cuanto antes.',
    trigger: ({ state, prev }) => !!prev && state.alert > prev.alert,
  },
  {
    id: 'suspicion',
    group: 'danger',
    icon: Siren,
    color: colors.suspicion,
    title: 'Estado de Sospecha',
    body:
      'La alerta pasó del 50 %. Los conos de visión crecen 1 casilla y tu reloj vibra. ' +
      'Si llega a 100 % se activa el Lockdown y pierdes la misión.',
    trigger: ({ state }) => state.alert >= 50 && state.alert < 100,
  },
  {
    id: 'trap',
    group: 'danger',
    icon: TriangleAlert,
    color: colors.suspicion,
    title: 'Trampas',
    body:
      'Son invisibles hasta que usas el Escáner del reloj. Pisar una suma +25 % de alerta, ' +
      'y el Camuflaje no te protege de ellas.',
    trigger: ({ state }) => state.revealedTraps.length > 0,
    highlight: ({ state }) => state.revealedTraps,
  },

  // ===== Elementos del mapa =====
  {
    id: 'door',
    group: 'map',
    icon: DoorClosed,
    color: colors.danger,
    title: 'Puerta bloqueada',
    body:
      'Abre tu reloj y pulsa Hackear (20 % de batería). Repite la secuencia de nodos de colores: ' +
      'si aciertas, la puerta se abre; si fallas, la alerta sube +35 %. También puedes buscar otro camino.',
    trigger: (ctx) => !!adjacentClosed(ctx, 'door'),
    highlight: (ctx) => entityPoints(findEntities(ctx.state, 'door').filter((d) => !d.open)),
  },
  {
    id: 'terminal',
    group: 'map',
    icon: Monitor,
    color: colors.stealth,
    title: 'Terminal de datos',
    body: 'Hackéala desde tu reloj para conseguir créditos e información extra. Es opcional, pero ayuda a mejorar tu equipo.',
    trigger: (ctx) => !!adjacentClosed(ctx, 'terminal'),
    highlight: ({ state }) => entityPoints(findEntities(state, 'terminal')),
  },
  {
    id: 'energy',
    group: 'map',
    icon: Zap,
    color: colors.stealth,
    title: 'Nodo de energía',
    body: 'Pasa por encima para recargar +30 % de batería. Desaparece al tomarlo, así que úsalo cuando lo necesites.',
    trigger: (ctx) => near(ctx, 'energy', 2),
    highlight: ({ state }) => entityPoints(findEntities(state, 'energy')),
  },

  // ===== Mecánicas de niveles avanzados =====
  {
    id: 'drone',
    group: 'advanced',
    icon: Plane,
    color: colors.danger,
    title: 'Drones',
    body: 'Patrullan siguiendo una ruta circular. El Pulso PEM de tu reloj puede paralizarlos durante 4 turnos.',
    trigger: ({ state }) => findEntities(state, 'drone').length > 0,
    highlight: ({ state }) => entityPoints(findEntities(state, 'drone')),
  },
  {
    id: 'turret',
    group: 'advanced',
    icon: Crosshair,
    color: colors.danger,
    title: 'Torretas',
    body: 'Vigilan en todas las direcciones (360°). Mantente fuera de su alcance.',
    trigger: ({ state }) => findEntities(state, 'turret').length > 0,
    highlight: ({ state }) => entityPoints(findEntities(state, 'turret')),
  },
  {
    id: 'emp_zone',
    group: 'advanced',
    icon: Radiation,
    color: colors.suspicion,
    title: 'Zona PEM',
    body: 'Si la pisas, tu reloj queda bloqueado durante 2 turnos y no podrás usar habilidades.',
    trigger: ({ state }) => findEntities(state, 'emp_zone').length > 0,
    highlight: ({ state }) => entityPoints(findEntities(state, 'emp_zone')),
  },
  {
    id: 'fog',
    group: 'advanced',
    icon: CloudFog,
    color: colors.textMuted,
    title: 'Niebla de guerra',
    body: 'Solo ves una casilla a tu alrededor. La Visión Térmica de tu reloj elimina la niebla durante 3 turnos.',
    trigger: ({ state }) => state.fog != null,
  },
  {
    id: 'treasure',
    group: 'advanced',
    icon: Gem,
    color: '#FFD700',
    title: 'Tesoro oculto',
    body: 'Objetivo opcional. Usa el Radar de tu reloj: vibra más rápido cuanto más cerca estés.',
    trigger: ({ state }) => findEntities(state, 'treasure').length > 0,
  },
  {
    id: 'dual_door',
    group: 'advanced',
    icon: Lock,
    color: colors.danger,
    title: 'Cerrojo dual',
    body:
      'Esta puerta necesita dos hackeos. En co-op, cada jugador se coloca en una terminal y ambos hackean ' +
      'a la vez, con 5 segundos de diferencia como máximo.',
    trigger: ({ state }) => findEntities(state, 'dual_door').length > 0,
    highlight: ({ state }) => entityPoints(findEntities(state, 'dual_door')),
  },
  {
    id: 'coop',
    group: 'advanced',
    icon: Users,
    color: colors.success,
    title: 'Modo cooperativo',
    body:
      'El mundo avanza cuando los dos jugadores actúan. La alerta es compartida y ambos deben llegar a la extracción. ' +
      'Usa los pings del reloj para coordinarte sin hablar.',
    trigger: ({ state }) => state.players.length > 1,
  },
];

export const TIPS_BY_ID: Record<string, Tip> = Object.fromEntries(TIPS.map((t) => [t.id, t]));

export const INTRO_TIPS = TIPS.filter((t) => t.group === 'intro');

export const GROUP_LABEL: Record<TipGroup, string> = {
  intro: 'Lo básico',
  danger: 'Peligros',
  map: 'Elementos del mapa',
  advanced: 'Niveles avanzados',
};
