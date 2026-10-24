// Catálogo actualizado de cartas del tutorial y del Manual Táctico ("Cómo jugar").
// Sincronizado con el mapa 12x12 estilo 16-bit, puertas moradas entre cuartos,
// pasos seguros en verde (#00E699), conos naranjas/rojos y módulos de 16 bits.
import {
  Battery,
  CameraOff,
  CloudFog,
  Crosshair,
  DoorClosed,
  DoorOpen,
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
  swatch?: string;
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
  trigger: (ctx: TipContext) => boolean;
  highlight?: (ctx: TipContext) => Point[];
}

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const activeVisionTiles = (state: SessionState): Point[] =>
  state.entities.filter((e) => !e.disabledTurns).flatMap((e) => e.visionTiles ?? []);

const findEntities = (state: SessionState, type: GameEntity['type']) =>
  state.entities.filter((e) => e.type === type);

const entityPoints = (list: GameEntity[]): Point[] => list.map((e) => [e.x, e.y]);

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

export const TIPS: Tip[] = [
  // ===== Introducción =====
  {
    id: 'objective',
    group: 'intro',
    icon: Flag,
    color: '#00E699',
    title: 'Objetivo de Infiltración',
    body:
      'Cruza los sectores del complejo 12×12 sin que la alerta llegue al 100 %. ' +
      'Atraviesa las puertas moradas en los bordes para cambiar de cuarto hasta alcanzar la Plataforma de Extracción.',
    legend: [
      { swatch: '#BD00FF', color: '#BD00FF', text: 'Borde morado: puerta hacia el siguiente cuarto' },
      { icon: Flag, color: '#00E699', text: 'Plataforma verde: punto de extracción final' },
    ],
    trigger: always,
    highlight: ({ state }) => tilesWithCode(state, Tile.EXTRACTION),
  },
  {
    id: 'movement',
    group: 'intro',
    icon: Gamepad2,
    color: '#00E699',
    title: 'Movimiento Táctico',
    body:
      'Usa el Control Táctico (D-Pad) a la derecha o toca directamente cualquiera de las casillas ' +
      'marcadas en verde junto a tu agente para desplazarte una celda.',
    legend: [
      { swatch: '#00E699', color: '#00E699', text: 'Marco verde: paso disponible seguro' },
      { swatch: '#FF2E4C', color: '#FF2E4C', text: 'Marco rojo: paso vigilado por un enemigo' },
    ],
    trigger: always,
    highlight: walkableNeighbors,
  },
  {
    id: 'turns',
    group: 'intro',
    icon: Hourglass,
    color: '#FFB800',
    title: 'Infiltración por Turnos',
    body:
      'Los guardias patrullan una casilla y las cámaras rotan únicamente cuando tú das un paso o pulsas Esperar. ' +
      'Analiza las rutas de los guardias con calma; usar habilidades del reloj NO consume turno.',
    trigger: always,
  },
  {
    id: 'hud',
    group: 'intro',
    icon: ShieldAlert,
    color: '#00E699',
    title: 'Energía y Nivel de Alerta',
    body: 'En el panel izquierdo monitoreas en tiempo real tu batería y el estado de alerta del complejo.',
    legend: [
      { icon: Battery, color: '#00E699', text: 'Energía: necesaria para activar habilidades del reloj' },
      { icon: ShieldAlert, color: '#00E699', text: 'Sigilo (0-49 %): patrullas en estado normal' },
      { icon: ShieldAlert, color: '#FF8800', text: 'Sospecha (50-99 %): visión enemiga ampliada +1 casilla' },
      { icon: ShieldAlert, color: '#FF2E4C', text: 'Lockdown (100 %): complejo bloqueado, misión fallida' },
    ],
    trigger: always,
  },
  {
    id: 'watch',
    group: 'intro',
    icon: Watch,
    color: '#00D8FF',
    title: 'Smartwatch: Hacker Deck',
    body: 'Tu reloj inteligente actúa como dispositivo de ciber-sabotaje conectado en tiempo real al mapa.',
    legend: [
      { icon: Radar, color: '#00D8FF', text: 'Escáner (15 %): detecta minas láser ocultas cercanas' },
      { icon: CameraOff, color: '#00D8FF', text: 'Sabotaje (25 %): desactiva la cámara más cercana' },
      { icon: Ghost, color: '#00D8FF', text: 'Camuflaje (35 %): te vuelve indetectable por 2 turnos' },
    ],
    trigger: always,
  },

  // ===== Peligros =====
  {
    id: 'vision',
    group: 'danger',
    icon: Eye,
    color: '#FF2E4C',
    title: 'Conos de Visión Enemiga',
    body:
      'Los guardias y cámaras proyectan conos de vigilancia sobre los pasillos. ' +
      'Si terminas tu turno sobre una casilla vigilada, la alerta subirá drásticamente.',
    legend: [
      { swatch: '#FF8800', color: '#FF8800', text: 'Naranja: visión de guardia (+50 % de alerta)' },
      { swatch: '#FF2E4C', color: '#FF2E4C', text: 'Rojo: visión de cámara (+35 % de alerta)' },
    ],
    trigger: ({ state, me }) => !!me && activeVisionTiles(state).some(([x, y]) => distance({ x, y }, me) <= 2),
    highlight: ({ state }) => activeVisionTiles(state),
  },
  {
    id: 'detected',
    group: 'danger',
    icon: ScanEye,
    color: '#FF2E4C',
    title: 'Intruso Detectado',
    body: 'Terminaste un turno dentro de un cono de visión y la alerta subió. Sal de la línea de visión de inmediato.',
    trigger: ({ state, prev }) => !!prev && state.alert > prev.alert,
  },
  {
    id: 'suspicion',
    group: 'danger',
    icon: Siren,
    color: '#FF8800',
    title: 'Estado de Sospecha',
    body:
      'La alerta superó el 50 %. Los conos de visión crecen 1 casilla adicional y el reloj emite vibración de peligro. ' +
      'Al llegar a 100 % se activa el Lockdown.',
    trigger: ({ state }) => state.alert >= 50 && state.alert < 100,
  },
  {
    id: 'trap',
    group: 'danger',
    icon: TriangleAlert,
    color: '#FF8800',
    title: 'Minas Láser de Proximidad',
    body:
      'Permanecen ocultas hasta usar el Escáner del reloj. Pisar una mina suma +25 % de alerta ' +
      'incluso si llevas el Camuflaje óptico activo.',
    trigger: ({ state }) => state.revealedTraps.length > 0,
    highlight: ({ state }) => state.revealedTraps,
  },

  // ===== Elementos del mapa =====
  {
    id: 'door',
    group: 'map',
    icon: DoorClosed,
    color: '#FF2E4C',
    title: 'Compuerta Blindada y Puertas de Cuarto',
    body:
      'Las compuertas internas bloqueadas se abren hackeando desde el reloj (20 % de energía) o usando terminales. ' +
      'Las caras pintadas de morado en el borde del mapa te llevan al siguiente cuarto del complejo.',
    legend: [
      { icon: DoorClosed, color: '#FF2E4C', text: 'Compuerta blindada: requiere hackeo para abrir el paso' },
      { icon: DoorOpen, color: '#BD00FF', text: 'Borde morado: acceso directo a otro cuarto' },
    ],
    trigger: (ctx) => !!adjacentClosed(ctx, 'door'),
    highlight: (ctx) => entityPoints(findEntities(ctx.state, 'door').filter((d) => !d.open)),
  },
  {
    id: 'terminal',
    group: 'map',
    icon: Monitor,
    color: '#00D8FF',
    title: 'Terminal de Datos 16-Bit',
    body: 'Colócate junto a la consola y hackéala desde el reloj para desbloquear accesos y extraer datos clasificados.',
    trigger: (ctx) => !!adjacentClosed(ctx, 'terminal'),
    highlight: ({ state }) => entityPoints(findEntities(state, 'terminal')),
  },
  {
    id: 'energy',
    group: 'map',
    icon: Zap,
    color: '#00E699',
    title: 'Módulo de Energía',
    body: 'Camina sobre la batería con el símbolo de rayo para recargar +30 % de energía en tu equipamiento.',
    trigger: (ctx) => near(ctx, 'energy', 2),
    highlight: ({ state }) => entityPoints(findEntities(state, 'energy')),
  },

  // ===== Mecánicas avanzadas =====
  {
    id: 'drone',
    group: 'advanced',
    icon: Plane,
    color: '#FF2E4C',
    title: 'Drones de Patrulla',
    body: 'Recorren circuitos rápidos. El Pulso PEM del reloj puede deshabilitarlos durante 4 turnos.',
    trigger: ({ state }) => findEntities(state, 'drone').length > 0,
    highlight: ({ state }) => entityPoints(findEntities(state, 'drone')),
  },
  {
    id: 'turret',
    group: 'advanced',
    icon: Crosshair,
    color: '#FF2E4C',
    title: 'Torretas Automáticas',
    body: 'Vigilan en 360° a su alrededor. Evita su perímetro o desactívalas mediante sabotaje.',
    trigger: ({ state }) => findEntities(state, 'turret').length > 0,
    highlight: ({ state }) => entityPoints(findEntities(state, 'turret')),
  },
  {
    id: 'emp_zone',
    group: 'advanced',
    icon: Radiation,
    color: '#FF8800',
    title: 'Campo de Interferencia PEM',
    body: 'Pisar esta zona bloquea temporalmente la comunicación con tu reloj durante 2 turnos.',
    trigger: ({ state }) => findEntities(state, 'emp_zone').length > 0,
    highlight: ({ state }) => entityPoints(findEntities(state, 'emp_zone')),
  },
  {
    id: 'fog',
    group: 'advanced',
    icon: CloudFog,
    color: colors.textMuted,
    title: 'Sector sin Iluminación',
    body: 'Visibilidad reducida a 1 casilla. Activa la Visión Térmica del reloj para despejar el mapa por 3 turnos.',
    trigger: ({ state }) => state.fog != null,
  },
  {
    id: 'treasure',
    group: 'advanced',
    icon: Gem,
    color: '#FFD700',
    title: 'Objetivo Secundario Oculto',
    body: 'Usa el Radar háptico del reloj: la frecuencia de vibración aumenta al acercarte al objetivo.',
    trigger: ({ state }) => findEntities(state, 'treasure').length > 0,
  },
  {
    id: 'dual_door',
    group: 'advanced',
    icon: Lock,
    color: '#FF2E4C',
    title: 'Bóveda de Cerrojo Dual',
    body: 'En modo cooperativo, ambos operadores deben colocarse en sus terminales y sincronizar el hackeo.',
    trigger: ({ state }) => findEntities(state, 'dual_door').length > 0,
    highlight: ({ state }) => entityPoints(findEntities(state, 'dual_door')),
  },
  {
    id: 'coop',
    group: 'advanced',
    icon: Users,
    color: '#00E699',
    title: 'Operación Cooperativa',
    body: 'El turno avanza cuando ambos agentes deciden su movimiento. La barra de alerta es compartida.',
    trigger: ({ state }) => state.players.length > 1,
  },
];

export const TIPS_BY_ID: Record<string, Tip> = Object.fromEntries(TIPS.map((t) => [t.id, t]));

export const INTRO_TIPS = TIPS.filter((t) => t.group === 'intro');

export const GROUP_LABEL: Record<TipGroup, string> = {
  intro: 'Fundamentos Tácticos',
  danger: 'Amenazas y Vigilancia',
  map: 'Módulos e Interactuables 16-Bit',
  advanced: 'Equipamiento Avanzado',
};
