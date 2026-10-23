// Mapeo estático de assets de personajes (32-bit pixel art tipo Metal Slug)
// Generado para Metro bundler de React Native / Expo.
import type { ImageSourcePropType } from 'react-native';

export type CharacterId = 'jesus' | 'vicente' | 'francisco' | 'alberto';
export type ActionType = 'down' | 'up' | 'right' | 'left' | 'hack' | 'idle';

export const CHARACTER_CARDS: Record<CharacterId, { relaxed: ImageSourcePropType; selected: ImageSourcePropType }> = {
  jesus: {
    relaxed: require('../assets/characters/cards/jesus_relaxed.png'),
    selected: require('../assets/characters/cards/jesus_selected.png'),
  },
  vicente: {
    relaxed: require('../assets/characters/cards/vicente_relaxed.png'),
    selected: require('../assets/characters/cards/vicente_selected.png'),
  },
  francisco: {
    relaxed: require('../assets/characters/cards/francisco_relaxed.png'),
    selected: require('../assets/characters/cards/francisco_selected.png'),
  },
  alberto: {
    relaxed: require('../assets/characters/cards/alberto_relaxed.png'),
    selected: require('../assets/characters/cards/alberto_selected.png'),
  },
};

export const CHARACTER_AVATARS: Record<CharacterId, ImageSourcePropType> = {
  jesus: require('../assets/characters/avatars/jesus.png'),
  vicente: require('../assets/characters/avatars/vicente.png'),
  francisco: require('../assets/characters/avatars/francisco.png'),
  alberto: require('../assets/characters/avatars/alberto.png'),
};

export const CHARACTER_SPRITES: Record<CharacterId, Record<ActionType, ImageSourcePropType[]>> = {
  jesus: {
    down: [
      require('../assets/characters/sprites/jesus/down_0.png'),
      require('../assets/characters/sprites/jesus/down_1.png'),
      require('../assets/characters/sprites/jesus/down_2.png'),
      require('../assets/characters/sprites/jesus/down_3.png'),
    ],
    up: [
      require('../assets/characters/sprites/jesus/up_0.png'),
      require('../assets/characters/sprites/jesus/up_1.png'),
      require('../assets/characters/sprites/jesus/up_2.png'),
      require('../assets/characters/sprites/jesus/up_3.png'),
    ],
    right: [
      require('../assets/characters/sprites/jesus/right_0.png'),
      require('../assets/characters/sprites/jesus/right_1.png'),
      require('../assets/characters/sprites/jesus/right_2.png'),
      require('../assets/characters/sprites/jesus/right_3.png'),
    ],
    left: [
      require('../assets/characters/sprites/jesus/left_0.png'),
      require('../assets/characters/sprites/jesus/left_1.png'),
      require('../assets/characters/sprites/jesus/left_2.png'),
      require('../assets/characters/sprites/jesus/left_3.png'),
    ],
    hack: [
      require('../assets/characters/sprites/jesus/hack_0.png'),
      require('../assets/characters/sprites/jesus/hack_1.png'),
      require('../assets/characters/sprites/jesus/hack_2.png'),
      require('../assets/characters/sprites/jesus/hack_3.png'),
    ],
    idle: [
      require('../assets/characters/sprites/jesus/idle_0.png'),
      require('../assets/characters/sprites/jesus/idle_1.png'),
      require('../assets/characters/sprites/jesus/idle_2.png'),
      require('../assets/characters/sprites/jesus/idle_3.png'),
    ],
  },
  vicente: {
    down: [
      require('../assets/characters/sprites/vicente/down_0.png'),
      require('../assets/characters/sprites/vicente/down_1.png'),
      require('../assets/characters/sprites/vicente/down_2.png'),
      require('../assets/characters/sprites/vicente/down_3.png'),
    ],
    up: [
      require('../assets/characters/sprites/vicente/up_0.png'),
      require('../assets/characters/sprites/vicente/up_1.png'),
      require('../assets/characters/sprites/vicente/up_2.png'),
      require('../assets/characters/sprites/vicente/up_3.png'),
    ],
    right: [
      require('../assets/characters/sprites/vicente/right_0.png'),
      require('../assets/characters/sprites/vicente/right_1.png'),
      require('../assets/characters/sprites/vicente/right_2.png'),
      require('../assets/characters/sprites/vicente/right_3.png'),
    ],
    left: [
      require('../assets/characters/sprites/vicente/left_0.png'),
      require('../assets/characters/sprites/vicente/left_1.png'),
      require('../assets/characters/sprites/vicente/left_2.png'),
      require('../assets/characters/sprites/vicente/left_3.png'),
    ],
    hack: [
      require('../assets/characters/sprites/vicente/hack_0.png'),
      require('../assets/characters/sprites/vicente/hack_1.png'),
      require('../assets/characters/sprites/vicente/hack_2.png'),
      require('../assets/characters/sprites/vicente/hack_3.png'),
    ],
    idle: [
      require('../assets/characters/sprites/vicente/idle_0.png'),
      require('../assets/characters/sprites/vicente/idle_1.png'),
      require('../assets/characters/sprites/vicente/idle_2.png'),
      require('../assets/characters/sprites/vicente/idle_3.png'),
    ],
  },
  francisco: {
    down: [
      require('../assets/characters/sprites/francisco/down_0.png'),
      require('../assets/characters/sprites/francisco/down_1.png'),
      require('../assets/characters/sprites/francisco/down_2.png'),
      require('../assets/characters/sprites/francisco/down_3.png'),
    ],
    up: [
      require('../assets/characters/sprites/francisco/up_0.png'),
      require('../assets/characters/sprites/francisco/up_1.png'),
      require('../assets/characters/sprites/francisco/up_2.png'),
      require('../assets/characters/sprites/francisco/up_3.png'),
    ],
    right: [
      require('../assets/characters/sprites/francisco/right_0.png'),
      require('../assets/characters/sprites/francisco/right_1.png'),
      require('../assets/characters/sprites/francisco/right_2.png'),
      require('../assets/characters/sprites/francisco/right_3.png'),
    ],
    left: [
      require('../assets/characters/sprites/francisco/left_0.png'),
      require('../assets/characters/sprites/francisco/left_1.png'),
      require('../assets/characters/sprites/francisco/left_2.png'),
      require('../assets/characters/sprites/francisco/left_3.png'),
    ],
    hack: [
      require('../assets/characters/sprites/francisco/hack_0.png'),
      require('../assets/characters/sprites/francisco/hack_1.png'),
      require('../assets/characters/sprites/francisco/hack_2.png'),
      require('../assets/characters/sprites/francisco/hack_3.png'),
    ],
    idle: [
      require('../assets/characters/sprites/francisco/idle_0.png'),
      require('../assets/characters/sprites/francisco/idle_1.png'),
      require('../assets/characters/sprites/francisco/idle_2.png'),
      require('../assets/characters/sprites/francisco/idle_3.png'),
    ],
  },
  alberto: {
    down: [
      require('../assets/characters/sprites/alberto/down_0.png'),
      require('../assets/characters/sprites/alberto/down_1.png'),
      require('../assets/characters/sprites/alberto/down_2.png'),
      require('../assets/characters/sprites/alberto/down_3.png'),
    ],
    up: [
      require('../assets/characters/sprites/alberto/up_0.png'),
      require('../assets/characters/sprites/alberto/up_1.png'),
      require('../assets/characters/sprites/alberto/up_2.png'),
      require('../assets/characters/sprites/alberto/up_3.png'),
    ],
    right: [
      require('../assets/characters/sprites/alberto/right_0.png'),
      require('../assets/characters/sprites/alberto/right_1.png'),
      require('../assets/characters/sprites/alberto/right_2.png'),
      require('../assets/characters/sprites/alberto/right_3.png'),
    ],
    left: [
      require('../assets/characters/sprites/alberto/left_0.png'),
      require('../assets/characters/sprites/alberto/left_1.png'),
      require('../assets/characters/sprites/alberto/left_2.png'),
      require('../assets/characters/sprites/alberto/left_3.png'),
    ],
    hack: [
      require('../assets/characters/sprites/alberto/hack_0.png'),
      require('../assets/characters/sprites/alberto/hack_1.png'),
      require('../assets/characters/sprites/alberto/hack_2.png'),
      require('../assets/characters/sprites/alberto/hack_3.png'),
    ],
    idle: [
      require('../assets/characters/sprites/alberto/idle_0.png'),
      require('../assets/characters/sprites/alberto/idle_1.png'),
      require('../assets/characters/sprites/alberto/idle_2.png'),
      require('../assets/characters/sprites/alberto/idle_3.png'),
    ],
  },
};
