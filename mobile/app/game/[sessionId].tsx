// Pantalla de juego: HUD + tablero + cruceta. Todo se dibuja desde `session:state`.
// Usa /game/demo para probar con datos falsos.
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Board } from '../../components/game/Board';
import { DPad } from '../../components/game/DPad';
import { Hud } from '../../components/game/Hud';
import { ResultModal } from '../../components/game/ResultModal';
import { useGameSession } from '../../hooks/useGameSession';
import { colors, getLevelAccent, levelName } from '../../theme/colors';

export default function GameScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { state, ended, error, isDemo, move, wait, leave, resetDemo } = useGameSession(sessionId ?? '');
  const { width, height } = useWindowDimensions();

  const goBack = () => {
    leave();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (!state) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            <ActivityIndicator color={colors.stealth} />
            <Text style={styles.loading}>Conectando con la misión...</Text>
          </>
        )}
      </SafeAreaView>
    );
  }

  // TODO (Día 2): usar el playerId del jugador logueado (de /me) en vez del primero.
  const me = state.players[0];
  const accent = getLevelAccent(state.theme);

  // Tamaño de casilla: que el tablero quepa en el ancho y en ~50 % del alto
  const maxBoard = Math.min(width - 24, height * 0.5);
  const tileSize = Math.floor(maxBoard / Math.max(state.width, state.height));

  const playing = state.status === 'PLAYING';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={goBack} hitSlop={12}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: accent }]}>{levelName(state.theme)}</Text>
        <Text style={styles.demoTag}>{isDemo ? 'DEMO' : ''}</Text>
      </View>

      <Hud state={state} me={me} />

      <View style={styles.boardWrap}>
        <Board state={state} me={me} tileSize={tileSize} onMove={playing ? move : undefined} />
      </View>

      <DPad accent={accent} disabled={!playing} onMove={move} onWait={wait} />

      <ResultModal result={ended} onBack={goBack} onRetry={isDemo ? resetDemo : undefined} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 12,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    color: colors.textMuted,
    marginTop: 12,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  demoTag: {
    color: colors.suspicion,
    fontSize: 11,
    fontWeight: '800',
    minWidth: 36,
    textAlign: 'right',
  },
  boardWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
