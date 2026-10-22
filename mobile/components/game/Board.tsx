// Tablero 2D: dibuja `tiles`, conos de visión, trampas, entidades y jugadores.
// Incluye animación rápida tipo ajedrez al avanzar celdas y remarcado perimetral.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Flag } from 'lucide-react-native';
import { colors, getLevelAccent, withAlpha } from '../../theme/colors';
import { Tile, type Direction, type Point, type SessionPlayer, type SessionState } from '../../lib/types';
import { EntityIcon } from './EntityIcon';
import { TileHighlight } from './TileHighlight';

const PLAYER_COLORS: Record<1 | 2, string> = {
  1: colors.stealth,
  2: colors.success,
};

interface Props {
  state: SessionState;
  me: SessionPlayer | undefined;
  tileSize: number;
  /** Tocar una casilla vecina al jugador = moverse en esa dirección */
  onMove?: (dir: Direction) => void;
  /** Casillas que parpadean (tutorial) */
  highlightTiles?: Point[];
  highlightColor?: string;
}

/** Animación de deslizamiento rápido (tipo ajedrez) para piezas que se desplazan */
function AnimatedPiece({
  x,
  y,
  tileSize,
  children,
}: {
  x: number;
  y: number;
  tileSize: number;
  children: React.ReactNode;
}) {
  const anim = useRef(new Animated.ValueXY({ x: x * tileSize, y: y * tileSize })).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: { x: x * tileSize, y: y * tileSize },
      duration: 160, // Rápido y fluido, estilo ajedrez táctico
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [x, y, tileSize, anim]);

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
      {children}
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

export function Board({ state, me, tileSize, onMove, highlightTiles = [], highlightColor = colors.text }: Props) {
  const accent = getLevelAccent(state.theme);
  const boardW = state.width * tileSize;
  const boardH = state.height * tileSize;
  const iconSize = Math.round(tileSize * 0.55);

  /** Posición absoluta de una casilla dentro del tablero */
  const at = (x: number, y: number) => ({
    left: x * tileSize,
    top: y * tileSize,
    width: tileSize,
    height: tileSize,
  });

  return (
    <View style={[styles.board, { width: boardW, height: boardH, borderColor: withAlpha(accent, 0.8) }]}>
      {/* 1. Casillas con remarcado perimetral reforzado */}
      {state.tiles.map((row, y) =>
        row.map((code, x) => {
          const dir = me ? directionTo(me, x, y) : null;
          const walkable = code !== Tile.WALL && code !== Tile.ABYSS;
          const isPerimeter = x === 0 || x === state.width - 1 || y === 0 || y === state.height - 1;

          return (
            <Pressable
              key={`t-${x}-${y}`}
              disabled={!dir || !walkable || !onMove}
              onPress={() => dir && onMove?.(dir)}
              style={[
                styles.cell,
                at(x, y),
                tileStyle(code, accent),
                isPerimeter ? perimeterStyle(x, y, state.width, state.height, accent) : null,
                dir && walkable ? { borderColor: withAlpha(accent, 0.75), backgroundColor: withAlpha(accent, 0.1) } : null,
              ]}
            >
              {code === Tile.EXTRACTION && <Flag size={iconSize} color={colors.success} />}
            </Pressable>
          );
        }),
      )}

      {/* 2. Conos de visión */}
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
                { backgroundColor: withAlpha(e.type === 'camera' ? colors.danger : colors.suspicion, 0.24) },
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

      {/* 4. Entidades estáticas (puertas, terminales, cámaras, energía) */}
      {state.entities
        .filter((e) => e.type !== 'guard' && e.type !== 'drone')
        .map((e) => (
          <View key={e.id} pointerEvents="none" style={[styles.overlay, styles.center, at(e.x, e.y)]}>
            <EntityIcon entity={e} size={iconSize} />
          </View>
        ))}

      {/* 5. Entidades móviles (Guardias y Drones con animación tipo ajedrez) */}
      {state.entities
        .filter((e) => e.type === 'guard' || e.type === 'drone')
        .map((e) => (
          <AnimatedPiece key={e.id} x={e.x} y={e.y} tileSize={tileSize}>
            <EntityIcon entity={e} size={iconSize} />
          </AnimatedPiece>
        ))}

      {/* 6. Jugadores con animación tipo ajedrez */}
      {state.players.map((p) => {
        const color = PLAYER_COLORS[p.slot];
        const dot = tileSize * 0.62;
        return (
          <AnimatedPiece key={`p-${p.playerId}`} x={p.x} y={p.y} tileSize={tileSize}>
            <View
              style={[
                styles.player,
                {
                  width: dot,
                  height: dot,
                  borderRadius: dot / 2,
                  borderColor: color,
                  backgroundColor: withAlpha(color, 0.28),
                  shadowColor: color,
                  opacity: p.camouflageTurns > 0 ? 0.4 : 1,
                },
              ]}
            >
              <View style={[styles.playerCore, { backgroundColor: color }]} />
            </View>
          </AnimatedPiece>
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

function tileStyle(code: number, accent: string) {
  switch (code) {
    case Tile.WALL:
      return { backgroundColor: colors.wall, borderColor: 'rgba(255, 255, 255, 0.08)' };
    case Tile.ABYSS:
      return { backgroundColor: colors.abyss, borderColor: 'transparent' };
    case Tile.EXTRACTION:
      return { backgroundColor: withAlpha(colors.success, 0.18), borderColor: colors.success };
    default:
      return { backgroundColor: colors.floor, borderColor: withAlpha(accent, 0.1) };
  }
}

/** Remarca con mayor grosor los bordes perimetrales del tablero */
function perimeterStyle(x: number, y: number, w: number, h: number, accent: string) {
  return {
    ...(x === 0 ? { borderLeftWidth: 2.5, borderLeftColor: withAlpha(accent, 0.8) } : {}),
    ...(x === w - 1 ? { borderRightWidth: 2.5, borderRightColor: withAlpha(accent, 0.8) } : {}),
    ...(y === 0 ? { borderTopWidth: 2.5, borderTopColor: withAlpha(accent, 0.8) } : {}),
    ...(y === h - 1 ? { borderBottomWidth: 2.5, borderBottomColor: withAlpha(accent, 0.8) } : {}),
  };
}

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    borderWidth: 2.5,
    backgroundColor: colors.background,
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  cell: {
    position: 'absolute',
    borderWidth: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  player: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  playerCore: {
    width: '36%',
    height: '36%',
    borderRadius: 999,
  },
});
