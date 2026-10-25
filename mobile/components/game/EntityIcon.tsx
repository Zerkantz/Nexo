// Sprites 16-bit de cada tipo de entidad del tablero.
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
  const spriteSize = Math.round(size * 1.15);

  switch (entity.type) {
    case 'camera': {
      const camImg = CAMERA_SPRITES[entity.dir ?? 'down'] ?? CAMERA_SPRITES.down;
      return (
        <Image
          source={camImg}
          style={[
            styles.sprite,
            { width: spriteSize, height: spriteSize, opacity: disabled ? 0.38 : 1 },
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
          style={[styles.sprite, { width: spriteSize * 0.92, height: spriteSize * 0.92 }]}
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
        <View style={[styles.terminalWrap, entity.open && styles.terminalHacked]}>
          <Image
            source={TILE_ASSETS.terminal}
            style={[
              styles.sprite,
              { width: spriteSize * 0.95, height: spriteSize * 0.95, opacity: entity.open ? 0.65 : 1 },
            ]}
          />
        </View>
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
  terminalWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  terminalHacked: {
    borderWidth: 1.5,
    borderColor: '#00E699',
    backgroundColor: 'rgba(0, 230, 153, 0.22)',
  },
});
