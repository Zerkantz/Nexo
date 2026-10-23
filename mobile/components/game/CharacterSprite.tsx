// Componente de Sprite Animado 32-bit para personajes de NEXO.
// Soporta los 4 operadores (Jesús, Vicente, Francisco, Alberto)
// y sus 6 acciones (down, up, right, left, hack, idle) con 4 frames de animación.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import type { Direction } from '../../lib/types';
import {
  getCharacterSprites,
  type ActionType,
  type CharacterId,
} from '../../lib/characters';

interface CharacterSpriteProps {
  characterId?: CharacterId;
  direction?: Direction;
  action?: ActionType;
  isMoving?: boolean;
  isHacking?: boolean;
  size: number;
}

export function CharacterSprite({
  characterId = 'jesus',
  direction = 'down',
  action,
  isMoving = false,
  isHacking = false,
  size,
}: CharacterSpriteProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Determinar acción según el estado
  let activeAction: ActionType = 'down';
  if (isHacking) {
    activeAction = 'hack';
  } else if (action) {
    activeAction = action;
  } else if (isMoving || direction) {
    activeAction = direction as ActionType;
  }

  // Ciclo de animación de frames
  useEffect(() => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }

    if (isMoving) {
      // Ciclo de caminata rápido (4 frames en ~160ms = ~40ms por frame)
      frameTimerRef.current = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % 4);
      }, 40);
    } else if (isHacking) {
      // Ciclo de hackeo continuo
      frameTimerRef.current = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % 4);
      }, 90);
    } else {
      // En reposo, mostrar frame 0 o respiración lenta
      setFrameIndex(0);
      frameTimerRef.current = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % 4);
      }, 350);
    }

    return () => {
      if (frameTimerRef.current) {
        clearInterval(frameTimerRef.current);
      }
    };
  }, [isMoving, isHacking, activeAction]);

  const sprites = getCharacterSprites(characterId);
  const actionFrames = sprites[activeAction] || sprites.down;
  const currentFrame = actionFrames[frameIndex] || actionFrames[0];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={currentFrame}
        style={{
          width: size * 1.05,
          height: size * 1.05,
          resizeMode: 'contain',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
