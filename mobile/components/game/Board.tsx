// Tablero 2D 12x12 con estética 32-bit pixel art estilo Metal Slug:
// Dibuja casillas texturizadas (piso metálico, muros blindados, escotilla de extracción),
// conos de visión, trampas, cámaras, guardias animados y jugadores sin círculos fosforescentes debajo.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { colors, withAlpha } from '../../theme/colors';
import { Tile, type Direction, type GameEntity, type Point, type SessionPlayer, type SessionState } from '../../lib/types';
import type { CharacterId } from '../../lib/characters';
import { TILE_ASSETS } from '../../lib/environmentAssets';
import { CharacterSprite } from './CharacterSprite';
import { GuardSprite } from './GuardSprite';
import { EntityIcon } from './EntityIcon';
import { TileHighlight } from './TileHighlight';

const PORTAL_PURPLE = '#BD00FF';
const ARCADE_GOLD = '#FFB800';

interface Props {
  state: SessionState;
  me: SessionPlayer | undefined;
  tileSize: number;
  characterId?: CharacterId;
  /** Tocar una casilla vecina al jugador = moverse en esa dirección */
  onMove?: (dir: Direction) => void;
  /** Casillas que parpadean (tutorial) */
  highlightTiles?: Point[];
  highlightColor?: string;
}

/** Pieza animada para Guardias y Drones con sprite 32-bit y detección de movimiento */
function AnimatedEnemyPiece({
  entity,
  tileSize,
  iconSize,
}: {
  entity: GameEntity;
  tileSize: number;
  iconSize: number;
}) {
  const { x, y } = entity;
  const anim = useRef(new Animated.ValueXY({ x: x * tileSize, y: y * tileSize })).current;
  const prevPos = useRef({ x, y });
  const [facing, setFacing] = useState<Direction>(entity.dir ?? 'down');
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    const dx = x - prevPos.current.x;
    const dy = y - prevPos.current.y;
    prevPos.current = { x, y };

    let newDir: Direction = entity.dir ?? facing;
    if (dx > 0) newDir = 'right';
    else if (dx < 0) newDir = 'left';
    else if (dy > 0) newDir = 'down';
    else if (dy < 0) newDir = 'up';

    setFacing(newDir);

    if (dx !== 0 || dy !== 0) {
      setIsMoving(true);
      const timer = setTimeout(() => setIsMoving(false), 240);

      Animated.timing(anim, {
        toValue: { x: x * tileSize, y: y * tileSize },
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start();

      return () => clearTimeout(timer);
    }
  }, [x, y, entity.dir, tileSize, anim]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overlay,
        styles.center,
        {
          width: tileSize,
          height: tileSize,
          transform: [{ translateX: anim.x }, { translateY: anim.y }],
        },
      ]}
    >
      {entity.type === 'guard' ? (
        <GuardSprite
          direction={facing}
          isMoving={isMoving}
          disabled={!!entity.disabledTurns}
          size={tileSize * 0.96}
        />
      ) : (
        <EntityIcon entity={entity} size={iconSize} />
      )}
    </Animated.View>
  );
}

/** Pieza animada del jugador con sprite 32-bit puro (sin círculo fosforescente debajo) */
function AnimatedPlayerPiece({
  x,
  y,
  tileSize,
  characterId,
  camouflageTurns,
}: {
  x: number;
  y: number;
  tileSize: number;
  characterId: CharacterId;
  camouflageTurns: number;
}) {
  const anim = useRef(new Animated.ValueXY({ x: x * tileSize, y: y * tileSize })).current;
  const prevPos = useRef({ x, y });
  const [facing, setFacing] = useState<Direction>('down');
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    const dx = x - prevPos.current.x;
    const dy = y - prevPos.current.y;
    prevPos.current = { x, y };

    let newDir: Direction = facing;
    if (dx > 0) newDir = 'right';
    else if (dx < 0) newDir = 'left';
    else if (dy > 0) newDir = 'down';
    else if (dy < 0) newDir = 'up';

    if (dx !== 0 || dy !== 0) {
      setFacing(newDir);
      setIsMoving(true);
      const timer = setTimeout(() => setIsMoving(false), 240);

      Animated.timing(anim, {
        toValue: { x: x * tileSize, y: y * tileSize },
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start();

      return () => clearTimeout(timer);
    }
  }, [x, y, tileSize, anim, facing]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overlay,
        styles.center,
        {
          width: tileSize,
          height: tileSize,
          transform: [{ translateX: anim.x }, { translateY: anim.y }],
          opacity: camouflageTurns > 0 ? 0.45 : 1,
        },
      ]}
    >
      <CharacterSprite
        characterId={characterId}
        direction={facing}
        isMoving={isMoving}
        size={tileSize * 0.98}
      />
    </Animated.View>
  );
}

/** Dirección hacia una casilla vecina (o null si no es vecina) */
function directionTo(me: SessionPlayer, x: number, y: number): Direction | null {
  const dx = x - me.x;
  const dy = y - me.y;
  if (dx === 0 && dy === -1) return 'up';
  if (dx === 0 && dy === 1) return 'down';
  if (dx === -1 && dy === 0) return 'left';
  if (dx === 1 && dy === 0) return 'right';
  return null;
}

export function Board({
  state,
  me,
  tileSize,
  characterId = 'jesus',
  onMove,
  highlightTiles = [],
  highlightColor = colors.text,
}: Props) {
  const boardW = state.width * tileSize;
  const boardH = state.height * tileSize;
  const iconSize = Math.round(tileSize * 0.6);

  const at = (x: number, y: number) => ({
    left: x * tileSize,
    top: y * tileSize,
    width: tileSize,
    height: tileSize,
  });

  return (
    <View style={[styles.board, { width: boardW, height: boardH }]}>
      {/* 1. Casillas del mapa 12x12 con texturas 32-bit pixel art */}
      {state.tiles.map((row, y) =>
        row.map((code, x) => {
          const dir = me ? directionTo(me, x, y) : null;
          const walkable = code !== Tile.WALL && code !== Tile.ABYSS;
          const isPerimeter = x === 0 || x === state.width - 1 || y === 0 || y === state.height - 1;

          // ¿Esta casilla es una compuerta de cambio de cuarto?
          const portalDoor = state.entities.find(
            (e) => (e.type === 'door' || e.type === 'dual_door') && e.targetRoom && e.x === x && e.y === y,
          );

          const tileTex =
            code === Tile.WALL
              ? TILE_ASSETS.wall
              : code === Tile.EXTRACTION
                ? TILE_ASSETS.extraction
                : code === Tile.ABYSS
                  ? null
                  : TILE_ASSETS.floor;

          return (
            <Pressable
              key={`t-${x}-${y}`}
              disabled={!dir || !walkable || !onMove}
              onPress={() => dir && onMove?.(dir)}
              style={[
                styles.cell,
                at(x, y),
                isPerimeter ? perimeterStyle(x, y, state.width, state.height) : null,
                portalDoor ? portalFaceStyle(x, y, state.width, state.height) : null,
              ]}
            >
              {/* Textura 32-bit de la celda */}
              {tileTex && (
                <Image
                  source={tileTex}
                  style={styles.tileTexture}
                />
              )}

              {/* Resaltado sutil de casilla adyacente caminable */}
              {dir && walkable && (
                <View style={styles.walkableHighlight} />
              )}

              {/* Tinte interior para celda con compuerta morada */}
              {portalDoor && (
                <View style={styles.portalInnerTint} />
              )}

              {/* Barra de umbral morada de la compuerta a otro cuarto */}
              {portalDoor && (
                <View
                  style={[
                    styles.portalThresholdBar,
                    portalThresholdPlacement(x, y, state.width, state.height),
                  ]}
                />
              )}
            </Pressable>
          );
        }),
      )}

      {/* 2. Conos de visión proyectados */}
      {state.entities
        .filter((e) => e.visionTiles && !e.disabledTurns)
        .flatMap((e) =>
          e.visionTiles!.map(([vx, vy]) => (
            <View
              key={`v-${e.id}-${vx}-${vy}`}
              pointerEvents="none"
              style={[
                styles.overlay,
                at(vx, vy),
                {
                  backgroundColor: withAlpha(
                    e.type === 'camera' ? colors.danger : colors.suspicion,
                    0.32,
                  ),
                  borderWidth: 1,
                  borderColor: withAlpha(
                    e.type === 'camera' ? colors.danger : colors.suspicion,
                    0.6,
                  ),
                },
              ]}
            />
          )),
        )}

      {/* 3. Trampas reveladas */}
      {state.revealedTraps.map(([tx, ty]) => (
        <View key={`trap-${tx}-${ty}`} pointerEvents="none" style={[styles.overlay, styles.center, at(tx, ty)]}>
          <EntityIcon entity={{ id: 'trap', type: 'trap', x: tx, y: ty }} size={iconSize} />
        </View>
      ))}

      {/* 4. Entidades estáticas normales (cámaras, puertas, terminales, energía) */}
      {state.entities
        .filter((e) => e.type !== 'guard' && e.type !== 'drone' && !e.targetRoom)
        .map((e) => (
          <View key={e.id} pointerEvents="none" style={[styles.overlay, styles.center, at(e.x, e.y)]}>
            <EntityIcon entity={e} size={iconSize} />
          </View>
        ))}

      {/* 5. Entidades móviles (Guardias 32-bit con animación de caminata y deslizamiento) */}
      {state.entities
        .filter((e) => e.type === 'guard' || e.type === 'drone')
        .map((e) => (
          <AnimatedEnemyPiece
            key={e.id}
            entity={e}
            tileSize={tileSize}
            iconSize={iconSize}
          />
        ))}

      {/* 6. Jugadores con sprite 32-bit puro (sin círculo debajo) */}
      {state.players.map((p) => {
        const charId = p.slot === 1 ? characterId : 'vicente';
        return (
          <AnimatedPlayerPiece
            key={`p-${p.playerId}`}
            x={p.x}
            y={p.y}
            tileSize={tileSize}
            characterId={charId}
            camouflageTurns={p.camouflageTurns}
          />
        );
      })}

      {/* 7. Casillas señaladas por el tutorial */}
      {highlightTiles.map(([hx, hy]) => (
        <TileHighlight
          key={`h-${hx}-${hy}`}
          left={hx * tileSize}
          top={hy * tileSize}
          size={tileSize}
          color={highlightColor}
        />
      ))}
    </View>
  );
}

/** Remarca con mayor grosor metálico los bordes perimetrales del tablero */
function perimeterStyle(x: number, y: number, w: number, h: number) {
  const borderCol = '#4a5664';
  return {
    ...(x === 0 ? { borderLeftWidth: 2.5, borderLeftColor: borderCol } : {}),
    ...(x === w - 1 ? { borderRightWidth: 2.5, borderRightColor: borderCol } : {}),
    ...(y === 0 ? { borderTopWidth: 2.5, borderTopColor: borderCol } : {}),
    ...(y === h - 1 ? { borderBottomWidth: 2.5, borderBottomColor: borderCol } : {}),
  };
}

/** Pinta de morado la cara de la celda donde está la compuerta a otro cuarto */
function portalFaceStyle(x: number, y: number, w: number, h: number) {
  if (x === w - 1) {
    return { borderRightWidth: 4.5, borderRightColor: PORTAL_PURPLE };
  }
  if (x === 0) {
    return { borderLeftWidth: 4.5, borderLeftColor: PORTAL_PURPLE };
  }
  if (y === 0) {
    return { borderTopWidth: 4.5, borderTopColor: PORTAL_PURPLE };
  }
  if (y === h - 1) {
    return { borderBottomWidth: 4.5, borderBottomColor: PORTAL_PURPLE };
  }
  return { borderRightWidth: 4.5, borderRightColor: PORTAL_PURPLE };
}

/** Posición de la barra luminosa morada en la cara de la compuerta */
function portalThresholdPlacement(x: number, y: number, w: number, h: number) {
  if (x === w - 1) {
    return { right: 0, top: 0, bottom: 0, width: 4.5 };
  }
  if (x === 0) {
    return { left: 0, top: 0, bottom: 0, width: 4.5 };
  }
  if (y === 0) {
    return { top: 0, left: 0, right: 0, height: 4.5 };
  }
  if (y === h - 1) {
    return { bottom: 0, left: 0, right: 0, height: 4.5 };
  }
  return { right: 0, top: 0, bottom: 0, width: 4.5 };
}

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    backgroundColor: '#0c0f14',
    borderWidth: 3,
    borderColor: '#526070',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.9,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  cell: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.55)',
    backgroundColor: '#12161c',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileTexture: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  walkableHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1.5,
    borderColor: withAlpha(ARCADE_GOLD, 0.75),
    backgroundColor: withAlpha(ARCADE_GOLD, 0.14),
  },
  portalInnerTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: withAlpha(PORTAL_PURPLE, 0.25),
  },
  overlay: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalThresholdBar: {
    position: 'absolute',
    backgroundColor: PORTAL_PURPLE,
    shadowColor: PORTAL_PURPLE,
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
});
