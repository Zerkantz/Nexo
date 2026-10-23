// Pantalla de juego: HUD + tablero + cruceta. Todo se dibuja desde `session:state`.
// Encima van las cartas del tutorial y la animación de transición de cuartos.
import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Image,
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
import { RoomTransitionOverlay } from '../../components/game/RoomTransitionOverlay';
import { HowToPlayGuide } from '../../components/tutorial/HowToPlayGuide';
import { TipCard } from '../../components/tutorial/TipCard';
import { useGameSession } from '../../hooks/useGameSession';
import { useTutorial } from '../../hooks/useTutorial';
import { colors, getLevelAccent } from '../../theme/colors';
import {
  CHARACTERS,
  getCharacterAvatar,
  getSelectedCharacter,
  type CharacterId,
} from '../../lib/characters';

export default function GameScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const {
    state,
    ended,
    error,
    isDemo,
    transitioningRoom,
    clearTransition,
    move,
    wait,
    leave,
    resetDemo,
  } = useGameSession(sessionId ?? '');
  const { width, height } = useWindowDimensions();
  const [guideOpen, setGuideOpen] = useState(false);
  const [characterId, setCharacterId] = useState<CharacterId>('jesus');

  useEffect(() => {
    getSelectedCharacter().then(setCharacterId);
  }, []);

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

  // Tamaño de casilla para 12x12
  const maxBoard = Math.min(width - 16, height * 0.52);
  const tileSize = Math.floor(maxBoard / Math.max(state.width, state.height));

  const showingTip = !!tutorial.current;
  const canPlay = state.status === 'PLAYING' && !showingTip && !transitioningRoom;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={goBack} hitSlop={12}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <View style={styles.titleBox}>
          <View style={styles.agentTagRow}>
            <Image source={getCharacterAvatar(characterId)} style={styles.agentAvatar} />
            <Text style={[styles.agentNameTag, { color: CHARACTERS[characterId].accentColor }]}>
              {CHARACTERS[characterId].name.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.title, { color: accent }]}>{state.roomName ?? 'BÓVEDA CENTRAL'}</Text>
          {isDemo && <Text style={styles.demoTag}>DEMO · SECTOR</Text>}
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
          characterId={characterId}
          onMove={canPlay ? move : undefined}
          highlightTiles={tutorial.highlightTiles}
          highlightColor={tutorial.current?.color}
        />
      </View>

      <View style={styles.controls}>
        <DPad accent={accent} disabled={!canPlay} onMove={move} onWait={wait} />

        {/* Carta del tutorial */}
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

      {/* Modal de fin de partida */}
      <ResultModal result={ended} onBack={goBack} onRetry={isDemo ? resetDemo : undefined} />

      {/* Animación de cambio de cuarto / sector */}
      <RoomTransitionOverlay
        visible={!!transitioningRoom}
        roomName={transitioningRoom ?? ''}
        onAnimationComplete={clearTransition}
      />

      {/* Guía completa */}
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
    paddingHorizontal: 8,
    paddingBottom: 10,
    gap: 8,
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
    paddingTop: 2,
    paddingHorizontal: 4,
  },
  titleBox: {
    alignItems: 'center',
  },
  agentTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  agentAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  agentNameTag: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  demoTag: {
    color: colors.suspicion,
    fontSize: 9,
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
