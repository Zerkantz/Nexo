// Mapeo estático de sprites 32-bit de entorno, tablero 12x12, guardias y cámaras (estilo Metal Slug).
import type { ImageSourcePropType } from 'react-native';
import type { Direction } from './types';

export const MENU_BG: ImageSourcePropType = require('../assets/environment/menu_bg.jpg');

export const TILE_ASSETS = {
  floor: require('../assets/environment/tiles/floor.png') as ImageSourcePropType,
  wall: require('../assets/environment/tiles/wall.png') as ImageSourcePropType,
  extraction: require('../assets/environment/tiles/extraction.png') as ImageSourcePropType,
  doorClosed: require('../assets/environment/tiles/door_closed.png') as ImageSourcePropType,
  doorOpen: require('../assets/environment/tiles/door_open.png') as ImageSourcePropType,
  energy: require('../assets/environment/tiles/energy.png') as ImageSourcePropType,
  terminal: require('../assets/environment/tiles/terminal.png') as ImageSourcePropType,
  trap: require('../assets/environment/tiles/trap.png') as ImageSourcePropType,
};

export const CAMERA_SPRITES: Record<Direction, ImageSourcePropType> = {
  down: require('../assets/environment/tiles/camera_down.png'),
  up: require('../assets/environment/tiles/camera_up.png'),
  left: require('../assets/environment/tiles/camera_left.png'),
  right: require('../assets/environment/tiles/camera_right.png'),
};

export const GUARD_SPRITES: Record<Direction, ImageSourcePropType[]> = {
  down: [
    require('../assets/environment/guard/down_0.png'),
    require('../assets/environment/guard/down_1.png'),
    require('../assets/environment/guard/down_2.png'),
    require('../assets/environment/guard/down_3.png'),
  ],
  up: [
    require('../assets/environment/guard/up_0.png'),
    require('../assets/environment/guard/up_1.png'),
    require('../assets/environment/guard/up_2.png'),
    require('../assets/environment/guard/up_3.png'),
  ],
  left: [
    require('../assets/environment/guard/left_0.png'),
    require('../assets/environment/guard/left_1.png'),
    require('../assets/environment/guard/left_2.png'),
    require('../assets/environment/guard/left_3.png'),
  ],
  right: [
    require('../assets/environment/guard/right_0.png'),
    require('../assets/environment/guard/right_1.png'),
    require('../assets/environment/guard/right_2.png'),
    require('../assets/environment/guard/right_3.png'),
  ],
};
