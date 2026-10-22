// Tablero 2D: dibuja `tiles`, conos de visión, trampas reveladas, entidades y jugadores
// a partir de `session:state`. No calcula nada del juego, solo pinta.
import { Pressable, StyleSheet, View } from 'react-native';
import { Flag } from 'lucide-react-native';
import { colors, getLevelAccent, withAlpha } from '../../theme/colors';
import { Tile, type Direction, type SessionPlayer, type SessionState } from '../../lib/types';
import { EntityIcon } from './EntityIcon';

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

export function Board({ state, me, tileSize, onMove }: Props) {
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
    <View style={[styles.board, { width: boardW, height: boardH, borderColor: withAlpha(accent, 0.5) }]}>
      {/* 1. Casillas */}
      {state.tiles.map((row, y) =>
        row.map((code, x) => {
          const dir = me ? directionTo(me, x, y) : null;
          const walkable = code !== Tile.WALL && code !== Tile.ABYSS;
          return (
            <Pressable
              key={`t-${x}-${y}`}
              disabled={!dir || !walkable || !onMove}
              onPress={() => dir && onMove?.(dir)}
              style={[
                styles.cell,
                at(x, y),
                tileStyle(code, accent),
                dir && walkable ? { borderColor: withAlpha(accent, 0.7), backgroundColor: withAlpha(accent, 0.08) } : null,
              ]}
            >
              {code === Tile.EXTRACTION && <Flag size={iconSize} color={colors.success} />}
            </Pressable>
          );
        }),
      )}

      {/* 2. Conos de visión (los calcula el servidor) */}
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
                { backgroundColor: withAlpha(e.type === 'camera' ? colors.danger : colors.suspicion, 0.22) },
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

      {/* 4. Entidades */}
      {state.entities.map((e) => (
        <View key={e.id} pointerEvents="none" style={[styles.overlay, styles.center, at(e.x, e.y)]}>
          <EntityIcon entity={e} size={iconSize} />
        </View>
      ))}

      {/* 5. Jugadores */}
      {state.players.map((p) => {
        const color = PLAYER_COLORS[p.slot];
        const dot = tileSize * 0.6;
        return (
          <View key={`p-${p.playerId}`} pointerEvents="none" style={[styles.overlay, styles.center, at(p.x, p.y)]}>
            <View
              style={[
                styles.player,
                {
                  width: dot,
                  height: dot,
                  borderRadius: dot / 2,
                  borderColor: color,
                  backgroundColor: withAlpha(color, 0.25),
                  shadowColor: color,
                  opacity: p.camouflageTurns > 0 ? 0.4 : 1, // camuflado = semitransparente
                },
              ]}
            >
              <View style={[styles.playerCore, { backgroundColor: color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function tileStyle(code: number, accent: string) {
  switch (code) {
    case Tile.WALL:
      return { backgroundColor: colors.wall, borderColor: 'rgba(255, 255, 255, 0.06)' };
    case Tile.ABYSS:
      return { backgroundColor: colors.abyss, borderColor: 'transparent' };
    case Tile.EXTRACTION:
      return { backgroundColor: withAlpha(colors.success, 0.15), borderColor: colors.success };
    default:
      // Piso, inicio, puerta, energía y terminal: se dibujan como piso (lo demás va en entities)
      return { backgroundColor: colors.floor, borderColor: withAlpha(accent, 0.08) };
  }
}

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    borderWidth: 1,
    backgroundColor: colors.background,
  },
  cell: {
    position: 'absolute',
    borderWidth: 1,
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
    width: '35%',
    height: '35%',
    borderRadius: 999,
  },
});
