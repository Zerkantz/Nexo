// Definiciones y datos de los 4 personajes jugables de NEXO.
// Inspirados en el arte arcade 32-bit pixel art tipo Metal Slug.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  CHARACTER_AVATARS,
  CHARACTER_CARDS,
  CHARACTER_SPRITES,
  type ActionType,
  type CharacterId,
} from './characterAssets';

export type { CharacterId, ActionType };

export interface CharacterStats {
  stealth: number; // 1 a 5
  speed: number;   // 1 a 5
  battery: number; // 1 a 5
  hack: number;    // 1 a 5
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  alias: string;
  role: string;
  tagline: string;
  accentColor: string;
  passiveName: string;
  passiveDescription: string;
  stats: CharacterStats;
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  jesus: {
    id: 'jesus',
    name: 'Jesús',
    alias: 'CYBER-WRAITH',
    role: 'Infiltrador y Sigilo',
    tagline: 'Maestro de la invisibilidad digital. Se desplaza entre las sombras sin dejar rastro.',
    accentColor: '#FFB800',
    passiveName: 'Sombra Digital',
    passiveDescription: '-15% en generación de sospecha en conos de visión de guardias.',
    stats: {
      stealth: 5,
      speed: 4,
      battery: 3,
      hack: 3,
    },
  },
  vicente: {
    id: 'vicente',
    name: 'Vicente',
    alias: 'VOLT-CRACKER',
    role: 'Ingeniero de Asalto & Hacker',
    tagline: 'Especialista en guerra electrónica y manipulación de terminales blindadas.',
    accentColor: '#00F0FF',
    passiveName: 'Deck Overclock',
    passiveDescription: '+20% de capacidad de batería táctica en el Hacker Deck del reloj.',
    stats: {
      stealth: 3,
      speed: 3,
      battery: 5,
      hack: 5,
    },
  },
  francisco: {
    id: 'francisco',
    name: 'Francisco',
    alias: 'IRON-TACTICIAN',
    role: 'Veterano de Operaciones Especiales',
    tagline: 'Veterano de mil asaltos perimetrales. Resistencia férrea contra contramedidas.',
    accentColor: '#00FFAA',
    passiveName: 'Blindaje Táctico',
    passiveDescription: 'Inmune a la primera detección de cámaras por sector.',
    stats: {
      stealth: 4,
      speed: 3,
      battery: 4,
      hack: 4,
    },
  },
  alberto: {
    id: 'alberto',
    name: 'Alberto',
    alias: 'PHANTOM-ROUGE',
    role: 'Vanguardia & Bypass Rápido',
    tagline: 'Audaz y letal. Fuerza aperturas de compuertas bajo fuego intenso.',
    accentColor: '#FF3366',
    passiveName: 'Bypass Quirúrgico',
    passiveDescription: 'Reduce a la mitad el tiempo de reconexión tras fallar un hackeo.',
    stats: {
      stealth: 4,
      speed: 5,
      battery: 3,
      hack: 4,
    },
  },
};

export const CHARACTER_LIST: CharacterDef[] = [
  CHARACTERS.jesus,
  CHARACTERS.vicente,
  CHARACTERS.francisco,
  CHARACTERS.alberto,
];

const CHAR_STORAGE_KEY = 'nexo_selected_character';
let inMemoryCharacter: CharacterId = 'jesus';

export async function getSelectedCharacter(): Promise<CharacterId> {
  try {
    let saved: string | null = null;
    if (Platform.OS === 'web') {
      saved = typeof localStorage !== 'undefined' ? localStorage.getItem(CHAR_STORAGE_KEY) : null;
    } else {
      saved = await SecureStore.getItemAsync(CHAR_STORAGE_KEY);
    }
    if (saved && (saved === 'jesus' || saved === 'vicente' || saved === 'francisco' || saved === 'alberto')) {
      inMemoryCharacter = saved;
      return saved;
    }
  } catch {
    // fallback a memoria
  }
  return inMemoryCharacter;
}

export async function setSelectedCharacter(id: CharacterId): Promise<void> {
  inMemoryCharacter = id;
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(CHAR_STORAGE_KEY, id);
    } else {
      await SecureStore.setItemAsync(CHAR_STORAGE_KEY, id);
    }
  } catch {
    // ignorar fallo de guardado local
  }
}

export function getCharacterCards(id: CharacterId) {
  return CHARACTER_CARDS[id];
}

export function getCharacterAvatar(id: CharacterId) {
  return CHARACTER_AVATARS[id];
}

export function getCharacterSprites(id: CharacterId) {
  return CHARACTER_SPRITES[id];
}
