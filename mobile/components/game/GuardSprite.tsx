// Sprite animado 16-bit para los Guardias de Seguridad.
import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { Direction } from '../../lib/types';
import { GUARD_SPRITES } from '../../lib/environmentAssets';

interface GuardSpriteProps {
  direction?: Direction;
  isMoving?: boolean;
  disabled?: boolean;
  size: number;
}

export function GuardSprite({
  direction = 'down',
  isMoving = false,
  disabled = false,
  size,
}: GuardSpriteProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (disabled) {
      setFrameIndex(0);
      return;
    }

    if (isMoving) {
      setFrameIndex(1);
      timerRef.current = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % 4);
      }, 65);
    } else {
      setFrameIndex(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isMoving, disabled, direction]);

  const frames = GUARD_SPRITES[direction] || GUARD_SPRITES.down;
  const currentFrame = frames[frameIndex] || frames[0];

  return (
    <View style={[styles.container, { width: size, height: size, opacity: disabled ? 0.45 : 1 }]}>
      <Image
        source={currentFrame}
        style={{
          width: size * 0.94,
          height: size * 0.94,
          resizeMode: 'contain',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
