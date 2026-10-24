// Componente de Sprite Animado 16-bit para personajes principales de NEXO.
// Soporta los 4 operadores (Jesús, Vicente, Francisco, Alberto)
// con sprites centrados y animaciones direccionales limpias.
import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
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
  } else if (direction) {
    activeAction = direction as ActionType;
  }

  useEffect(() => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }

    if (isMoving) {
      // Animar los 4 frames de caminata durante el desplazamiento entre casillas
      setFrameIndex(1);
      frameTimerRef.current = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % 4);
      }, 65);
    } else if (isHacking) {
      frameTimerRef.current = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % 4);
      }, 150);
    } else {
      // En reposo sobre la casilla, mantener la postura firme mirando en su dirección actual
      setFrameIndex(0);
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
    justifyContent: 'center',
    alignItems: 'center',
  },
});
