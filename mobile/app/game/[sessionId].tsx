// Pantalla de juego: HUD + tablero + cruceta. Todo se dibuja desde `session:state`.
// Encima van las cartas del tutorial, que explican cada mecánica la primera vez que aparece.
// Usa /game/demo para probar con datos falsos.
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CircleHelp, X } from 'lucide-react-native';
import { Board } from '../../components/game/Board';
import { DPad } from '../../components/game/DPad';
import { Hud } from '../../components/game/Hud';
import { ResultModal } from '../../components/game/ResultModal';
import { HowToPlayGuide } from '../../components/tutorial/HowToPlayGuide';
import { TipCard } from '../../components/tutorial/TipCard';
import { useGameSession } from '../../hooks/useGameSession';
import { useTutorial } from '../../hooks/useTutorial';
import { colors, getLevelAccent, levelName } from '../../theme/colors';

export default function GameScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { state, ended, error, isDemo, move, wait, leave, resetDemo } = useGameSession(sessionId ?? '');
  const { width, height } = useWindowDimensions();
  const [guideOpen, setGuideOpen] = useState(false);

  // TODO (Día 2): usar el playerId del jugador logueado (de /me) en vez del primero.
  const me = state?.players[0];
  const tutorial = useTutorial(state, me);

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

  const accent = getLevelAccent(state.theme);

  // Tamaño de casilla: que el tablero quepa en el ancho y en ~50 % del alto
  const maxBoard = Math.min(width - 24, height * 0.5);
  const tileSize = Math.floor(maxBoard / Math.max(state.width, state.height));

  // Mientras hay una carta del tutorial abierta, el juego queda en pausa
  const showingTip = !!tutorial.current;
  const canPlay = state.status === 'PLAYING' && !showingTip;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={goBack} hitSlop={12}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <View style={styles.titleBox}>
          <Text style={[styles.title, { color: accent }]}>{levelName(state.theme)}</Text>
          {isDemo && <Text style={styles.demoTag}>DEMO</Text>}
        </View>
        <Pressable onPress={() => setGuideOpen(true)} hitSlop={12}>
          <CircleHelp size={24} color={colors.text} />
        </Pressable>
      </View>

      <Hud state={state} me={me} />

      <View style={styles.boardWrap}>
        <Board
          state={state}
          me={me}
          tileSize={tileSize}
          onMove={canPlay ? move : undefined}
          highlightTiles={tutorial.highlightTiles}
          highlightColor={tutorial.current?.color}
        />
      </View>

      <View style={styles.controls}>
        <DPad accent={accent} disabled={!canPlay} onMove={move} onWait={wait} />

        {/* Carta del tutorial: flota sobre la cruceta y deja ver el tablero */}
        {tutorial.current && (
          <View style={styles.tipLayer}>
            <TipCard
              tip={tutorial.current}
              hasMore={tutorial.pendingCount > 1}
              onNext={tutorial.dismiss}
              onSkip={tutorial.skipAll}
            />
          </View>
        )}
      </View>

      <ResultModal result={ended} onBack={goBack} onRetry={isDemo ? resetDemo : undefined} />

      {/* Guía completa (botón de ayuda) */}
      <Modal visible={guideOpen} animationType="slide" onRequestClose={() => setGuideOpen(false)}>
        <SafeAreaView style={styles.guide}>
          <View style={styles.topBar}>
            <View style={{ width: 24 }} />
            <Text style={[styles.title, { color: colors.stealth }]}>CÓMO JUGAR</Text>
            <Pressable onPress={() => setGuideOpen(false)} hitSlop={12}>
              <X size={24} color={colors.text} />
            </Pressable>
          </View>
          <HowToPlayGuide
            onResetTutorial={() => {
              tutorial.reset();
              setGuideOpen(false);
            }}
          />
        </SafeAreaView>
      </Modal>
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
  titleBox: {
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  demoTag: {
    color: colors.suspicion,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  boardWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    position: 'relative',
  },
  tipLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  guide: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 4,
  },
});
