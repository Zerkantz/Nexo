// Tablero 2D 12x12 con estética 15-bit limpia, intuitiva y de alto contraste:
// - Los muros contiguos se fusionan visualmente en bloques sólidos oscuros con bisel 15-bit
//   únicamente hacia los pasillos, eliminando la saturación visual.
// - Los pasillos caminables usan losas tácticas claras (#263445 / #29384a) para que
//   personajes, guardias, cámaras, objetos y conos de visión destaquen al instante.
// - Las casillas adyacentes caminables se indican en verde táctico (#00E699), diferenciadas
//   claramente de los conos de visión de guardias (naranja) y cámaras (rojo).
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
const STEP_SAFE_GREEN = '#00E699';
const GUARD_VISION_ORANGE = '#FF8800';
const CAMERA_VISION_RED = '#FF2E4C';

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

/** Pieza animada para Guardias y Drones con sprite 15/32-bit y marcador táctico de amenaza */
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
      {/* Marco táctico sutil de presencia enemiga para identificar al guardia de inmediato */}
      {!entity.disabledTurns && (
        <View style={styles.enemyTileMarker} />
      )}
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

/** Pieza animada del jugador con sprite puro (sin círculo fosforescente debajo) */
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
        size={tileSize * 0.96}
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
  const iconSize = Math.round(tileSize * 0.78);

  const at = (x: number, y: number) => ({
    left: x * tileSize,
    top: y * tileSize,
    width: tileSize,
    height: tileSize,
  });

  // Mapa rápido de casillas vigiladas para distinguir pasos seguros de pasos en visión enemiga
  const watchedSet = new Set<string>();
  for (const e of state.entities) {
    if (e.visionTiles && !e.disabledTurns) {
      for (const [vx, vy] of e.visionTiles) {
        watchedSet.add(`${vx},${vy}`);
      }
    }
  }

  const isWallAt = (tx: number, ty: number) => {
    if (tx < 0 || ty < 0 || tx >= state.width || ty >= state.height) return true;
    return state.tiles[ty]?.[tx] === Tile.WALL;
  };

  return (
    <View style={[styles.board, { width: boardW, height: boardH }]}>
      {/* 1. Casillas del mapa 12x12 con estética 15-bit conectada y limpia */}
      {state.tiles.map((row, y) =>
        row.map((code, x) => {
          const dir = me ? directionTo(me, x, y) : null;
          const isWall = code === Tile.WALL;
          const isAbyss = code === Tile.ABYSS;
          const isExtraction = code === Tile.EXTRACTION;
          const walkable = !isWall && !isAbyss;
          const isCheckerEven = (x + y) % 2 === 0;
          const isWatched = watchedSet.has(`${x},${y}`);

          // ¿Esta casilla es una compuerta de cambio de cuarto?
          const portalDoor = state.entities.find(
            (e) => (e.type === 'door' || e.type === 'dual_door') && e.targetRoom && e.x === x && e.y === y,
          );

          // Biseles 15-bit para muros: solo se remarcan los bordes que colindan con suelo caminable,
          // fusionando los muros adyacentes en bloques continuos muy fáciles de leer.
          const wallEdges = isWall
            ? {
                borderTopWidth: !isWallAt(x, y - 1) ? 2.5 : 0,
                borderTopColor: '#4c5f78',
                borderBottomWidth: !isWallAt(x, y + 1) ? 3.5 : 0,
                borderBottomColor: '#05070a',
                borderLeftWidth: !isWallAt(x - 1, y) ? 2 : 0,
                borderLeftColor: '#3b4b60',
                borderRightWidth: !isWallAt(x + 1, y) ? 2 : 0,
                borderRightColor: '#070a0f',
              }
            : null;

          return (
            <Pressable
              key={`t-${x}-${y}`}
              disabled={!dir || !walkable || !onMove}
              onPress={() => dir && onMove?.(dir)}
              style={[
                styles.cell,
                at(x, y),
                walkable && (isCheckerEven ? styles.floorEven : styles.floorOdd),
                isWall && styles.wallCell,
                isAbyss && styles.abyssCell,
                wallEdges,
                portalDoor ? portalFaceStyle(x, y, state.width, state.height) : null,
              ]}
            >
              {/* Escotilla de extracción en el objetivo final */}
              {isExtraction && (
                <Image
                  source={TILE_ASSETS.extraction}
                  style={styles.tileTexture}
                />
              )}

              {/* Relieve interior 15-bit para bloques de pared */}
              {isWall && (
                <View style={styles.wallInnerCap} />
              )}

              {/* Indicador intuitivo de casilla vecina a la que puedes caminar */}
              {dir && walkable && (
                <View
                  style={[
                    styles.walkableHighlight,
                    isWatched && styles.walkableDangerHighlight,
                  ]}
                >
                  <View
                    style={[
                      styles.walkableDot,
                      isWatched && styles.walkableDangerDot,
                    ]}
                  />
                </View>
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

      {/* 2. Conos de visión proyectados (Naranja para guardias, Rojo para cámaras) */}
      {state.entities
        .filter((e) => e.visionTiles && !e.disabledTurns)
        .flatMap((e) => {
          const coneColor = e.type === 'camera' ? CAMERA_VISION_RED : GUARD_VISION_ORANGE;
          return e.visionTiles!.map(([vx, vy]) => (
            <View
              key={`v-${e.id}-${vx}-${vy}`}
              pointerEvents="none"
              style={[
                styles.overlay,
                at(vx, vy),
                {
                  backgroundColor: withAlpha(coneColor, 0.28),
                  borderWidth: 1.5,
                  borderColor: withAlpha(coneColor, 0.72),
                },
              ]}
            />
          ));
        })}

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

      {/* 5. Entidades móviles (Guardias con animación de caminata y deslizamiento) */}
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

      {/* 6. Jugadores con sprite puro (sin círculo debajo) */}
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

/** Pinta de morado la cara de la celda donde está la compuerta a otro cuarto */
function portalFaceStyle(x: number, y: number, w: number, h: number) {
  if (x === w - 1) {
    return { borderRightWidth: 5, borderRightColor: PORTAL_PURPLE };
  }
  if (x === 0) {
    return { borderLeftWidth: 5, borderLeftColor: PORTAL_PURPLE };
  }
  if (y === 0) {
    return { borderTopWidth: 5, borderTopColor: PORTAL_PURPLE };
  }
  if (y === h - 1) {
    return { borderBottomWidth: 5, borderBottomColor: PORTAL_PURPLE };
  }
  return { borderRightWidth: 5, borderRightColor: PORTAL_PURPLE };
}

/** Posición de la barra luminosa morada en la cara de la compuerta */
function portalThresholdPlacement(x: number, y: number, w: number, h: number) {
  if (x === w - 1) {
    return { right: 0, top: 0, bottom: 0, width: 5 };
  }
  if (x === 0) {
    return { left: 0, top: 0, bottom: 0, width: 5 };
  }
  if (y === 0) {
    return { top: 0, left: 0, right: 0, height: 5 };
  }
  if (y === h - 1) {
    return { bottom: 0, left: 0, right: 0, height: 5 };
  }
  return { right: 0, top: 0, bottom: 0, width: 5 };
}

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    backgroundColor: '#0c1016',
    borderWidth: 3,
    borderColor: '#485a70',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.9,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  cell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  floorEven: {
    backgroundColor: '#273546',
    borderWidth: 0.5,
    borderColor: 'rgba(14, 20, 28, 0.45)',
  },
  floorOdd: {
    backgroundColor: '#233040',
    borderWidth: 0.5,
    borderColor: 'rgba(14, 20, 28, 0.45)',
  },
  wallCell: {
    backgroundColor: '#0d1219',
  },
  wallInnerCap: {
    width: '76%',
    height: '76%',
    backgroundColor: '#141c27',
    borderRadius: 2,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: 'rgba(95, 118, 148, 0.22)',
    borderLeftColor: 'rgba(95, 118, 148, 0.18)',
  },
  abyssCell: {
    backgroundColor: '#040609',
  },
  tileTexture: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  walkableHighlight: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderWidth: 1.5,
    borderColor: withAlpha(STEP_SAFE_GREEN, 0.78),
    backgroundColor: withAlpha(STEP_SAFE_GREEN, 0.14),
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkableDangerHighlight: {
    borderColor: withAlpha(CAMERA_VISION_RED, 0.85),
    backgroundColor: withAlpha(CAMERA_VISION_RED, 0.2),
  },
  walkableDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: withAlpha(STEP_SAFE_GREEN, 0.85),
  },
  walkableDangerDot: {
    backgroundColor: withAlpha(CAMERA_VISION_RED, 0.9),
  },
  enemyTileMarker: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 70, 70, 0.65)',
    backgroundColor: 'rgba(255, 45, 55, 0.15)',
    borderRadius: 4,
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
