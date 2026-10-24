// Sprites 32-bit de cada tipo de entidad del tablero (estilo Metal Slug).
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Crosshair, Gem, Plane } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import type { GameEntity } from '../../lib/types';
import { CAMERA_SPRITES, TILE_ASSETS } from '../../lib/environmentAssets';
import { GuardSprite } from './GuardSprite';

interface Props {
  entity: GameEntity;
  size: number;
}

export function EntityIcon({ entity, size }: Props) {
  const disabled = !!entity.disabledTurns;
  const enemyColor = disabled ? colors.textMuted : colors.danger;
  const spriteSize = Math.round(size * 1.55);

  switch (entity.type) {
    case 'camera': {
      const camImg = CAMERA_SPRITES[entity.dir ?? 'down'] ?? CAMERA_SPRITES.down;
      return (
        <Image
          source={camImg}
          style={[
            styles.sprite,
            { width: spriteSize, height: spriteSize, opacity: disabled ? 0.45 : 1 },
          ]}
        />
      );
    }
    case 'guard':
      return (
        <GuardSprite
          direction={entity.dir ?? 'down'}
          disabled={disabled}
          size={spriteSize}
        />
      );
    case 'drone':
      return <Plane size={size} color={enemyColor} />;
    case 'turret':
      return <Crosshair size={size} color={enemyColor} />;
    case 'trap':
    case 'emp_zone':
      return (
        <Image
          source={TILE_ASSETS.trap}
          style={[styles.sprite, { width: spriteSize * 0.9, height: spriteSize * 0.9 }]}
        />
      );
    case 'door':
    case 'dual_door':
    case 'vault':
      return (
        <Image
          source={entity.open ? TILE_ASSETS.doorOpen : TILE_ASSETS.doorClosed}
          style={[styles.sprite, { width: spriteSize * 1.05, height: spriteSize * 1.05 }]}
        />
      );
    case 'terminal':
      return (
        <Image
          source={TILE_ASSETS.terminal}
          style={[styles.sprite, { width: spriteSize, height: spriteSize }]}
        />
      );
    case 'energy':
      return (
        <Image
          source={TILE_ASSETS.energy}
          style={[styles.sprite, { width: spriteSize * 0.95, height: spriteSize * 0.95 }]}
        />
      );
    case 'treasure':
      return <Gem size={size} color="#FFD700" />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  sprite: {
    resizeMode: 'contain',
  },
});
