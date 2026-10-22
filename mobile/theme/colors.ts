// Paleta "Holograma táctico neón" (ver docs/NEXO_Contexto_IA.md, sección 14).

export const colors = {
  background: '#060913',
  panel: 'rgba(17, 24, 39, 0.85)', // #111827 con transparencia
  panelSolid: '#111827',
  border: 'rgba(0, 240, 255, 0.25)',

  stealth: '#00F0FF', // acento principal / sigilo
  suspicion: '#FF9900', // sospecha
  danger: '#FF003C', // alerta / lockdown
  success: '#00FF66', // éxito

  text: '#E5F9FF',
  textMuted: '#7B8CA6',

  // Casillas del tablero
  floor: '#0A111E',
  wall: '#253247',
  abyss: '#000000',
} as const;

// Temas de los niveles (missions.theme)
export type LevelTheme = 'BANK' | 'CRYPT' | 'LAB' | 'SERVERS' | 'ORBITAL';

// Color de acento de cada nivel
export const levelAccent: Record<LevelTheme, string> = {
  BANK: '#FFD700', // 1 Banco - Dorado
  CRYPT: '#00FF87', // 2 Cripta - Esmeralda
  LAB: '#00E5FF', // 3 Laboratorio - Cian
  SERVERS: '#BD00FF', // 4 Servidores - Púrpura
  ORBITAL: '#FF003C', // 5 Orbital - Carmesí
};

export function getLevelAccent(theme: string | undefined): string {
  return levelAccent[theme as LevelTheme] ?? colors.stealth;
}

// Nombre que ve el jugador para cada tema (sección 5)
const levelNames: Record<LevelTheme, string> = {
  BANK: 'BÓVEDA CENTRAL',
  CRYPT: 'CRIPTA DEL COLECCIONISTA',
  LAB: 'COMPLEJO NEURO-LINK',
  SERVERS: 'NIDO DE SERVIDORES',
  ORBITAL: 'FORTALEZA ORBITAL',
};

export function levelName(theme: string | undefined): string {
  return levelNames[theme as LevelTheme] ?? 'BASE ENEMIGA';
}

// Estado de la alerta según su valor (sección 4.3)
export type AlertState = 'STEALTH' | 'SUSPICION' | 'LOCKDOWN';

export function getAlertState(alert: number): AlertState {
  if (alert >= 100) return 'LOCKDOWN';
  if (alert >= 50) return 'SUSPICION';
  return 'STEALTH';
}

export function getAlertColor(alert: number): string {
  const state = getAlertState(alert);
  if (state === 'LOCKDOWN') return colors.danger;
  if (state === 'SUSPICION') return colors.suspicion;
  return colors.stealth;
}

export const alertLabel: Record<AlertState, string> = {
  STEALTH: 'Sigilo',
  SUSPICION: 'Sospecha',
  LOCKDOWN: 'Lockdown',
};

/** Agrega transparencia a un color hex (#RRGGBB) -> rgba(). */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
