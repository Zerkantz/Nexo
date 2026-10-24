// Pantalla de Juego en Formato Horizontal (Landscape) estilo Arcade Metal Slug:
// Columna Izquierda: Cabecera, Agente y HUD Táctico.
// Columna Central: Tablero 12x12 con texturas y sprites 32-bit.
// Columna Derecha: Cruceta de control ergonómica.
import React, { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  Easing,
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

  // Cortina negra de entrada (disuelve desde el fade-to-black del selector de personaje)
  const entryFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getSelectedCharacter().then(setCharacterId);
    Animated.timing(entryFade, {
      toValue: 0,
      duration: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [entryFade]);

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
            <ActivityIndicator color="#ffb800" />
            <Text style={styles.loading}>Cargando sector...</Text>
          </>
        )}
      </SafeAreaView>
    );
  }

  const accent = getLevelAccent(state.theme);

  // En horizontal (landscape), el tablero 12x12 aprovecha el alto completo disponible
  const isLandscape = width >= height;
  const maxBoardH = height - 20;
  const maxBoardW = isLandscape ? width - 420 : width - 16;
  const boardBudget = Math.min(maxBoardH, Math.max(240, maxBoardW));
  const tileSize = Math.max(18, Math.floor(boardBudget / Math.max(state.width, state.height)));

  const showingTip = !!tutorial.current;
  const canPlay = state.status === 'PLAYING' && !showingTip && !transitioningRoom;
  const activeChar = CHARACTERS[characterId];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.landscapeLayout}>
        {/* 1. Panel Izquierdo: Navegación, Ficha del Agente y HUD */}
        <View style={styles.leftSidebar}>
          <View style={styles.navRow}>
            <Pressable onPress={goBack} style={styles.iconBtn}>
              <ArrowLeft size={20} color="#ffcc00" />
            </Pressable>
            <View style={styles.sectorBadge}>
              <Text style={styles.sectorLabel} numberOfLines={1}>
                {state.roomName ?? 'BÓVEDA CENTRAL'}
              </Text>
              {isDemo && <Text style={styles.demoTag}>OPERACIÓN TÁCTICA 32-BIT</Text>}
            </View>
            <Pressable onPress={() => setGuideOpen(true)} style={styles.iconBtn}>
              <CircleHelp size={20} color="#ffcc00" />
            </Pressable>
          </View>

          {/* Ficha del Operador Activo */}
          <View style={styles.agentBanner}>
            <Image source={getCharacterAvatar(characterId)} style={styles.agentAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.agentRoleTag}>AGENTE EN CAMPO</Text>
              <Text style={styles.agentNameText}>{activeChar.name.toUpperCase()}</Text>
              <Text style={styles.agentAliasText}>"{activeChar.alias}"</Text>
            </View>
          </View>

          {/* HUD de Turno, Batería, Alerta y Reloj */}
          <Hud state={state} me={me} />
        </View>

        {/* 2. Columna Central: Tablero 12x12 estilo Metal Slug */}
        <View style={styles.centerBoardArea}>
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

        {/* 3. Panel Derecho: Cruceta de Control (D-Pad) */}
        <View style={styles.rightSidebar}>
          <Text style={styles.controlsLabel}>CONTROL TÁCTICO</Text>
          <DPad accent="#ffb800" disabled={!canPlay} onMove={move} onWait={wait} />
        </View>
      </View>

      {/* Carta flotante del tutorial cuando se activa una mecánica nueva */}
      {tutorial.current && (
        <View style={styles.tipOverlay}>
          <View style={styles.tipCardContainer}>
            <TipCard
              tip={tutorial.current}
              hasMore={tutorial.pendingCount > 1}
              onNext={tutorial.dismiss}
              onSkip={tutorial.skipAll}
            />
          </View>
        </View>
      )}

      {/* Modal de victoria / derrota */}
      <ResultModal result={ended} onBack={goBack} onRetry={isDemo ? resetDemo : undefined} />

      {/* Animación de transición de cuarto */}
      <RoomTransitionOverlay
        visible={!!transitioningRoom}
        roomName={transitioningRoom ?? ''}
        onAnimationComplete={clearTransition}
      />

      {/* Guía completa en Modal */}
      <Modal visible={guideOpen} animationType="fade" onRequestClose={() => setGuideOpen(false)}>
        <SafeAreaView style={styles.guideModal}>
          <View style={styles.guideHeader}>
            <Text style={styles.guideTitle}>MANUAL TÁCTICO // CÓMO JUGAR</Text>
            <Pressable onPress={() => setGuideOpen(false)} style={styles.iconBtn}>
              <X size={20} color="#ffcc00" />
            </Pressable>
          </View>
          <HowToPlayGuide />
        </SafeAreaView>
      </Modal>

      {/* Cortina negra de fundido inicial */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blackEntryCurtain,
          { opacity: entryFade },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090c10',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    color: '#9aa8b8',
    marginTop: 12,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
  landscapeLayout: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 12,
  },
  leftSidebar: {
    width: 225,
    height: '100%',
    justifyContent: 'space-between',
    gap: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#181f27',
    borderWidth: 1.5,
    borderColor: '#3e4c5c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectorBadge: {
    flex: 1,
    alignItems: 'center',
  },
  sectorLabel: {
    color: '#ffcc00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  demoTag: {
    color: '#8a99ad',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  agentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#141a22',
    borderWidth: 2,
    borderColor: '#384654',
    borderRadius: 8,
    padding: 8,
  },
  agentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#ffb800',
    backgroundColor: '#080a0e',
  },
  agentRoleTag: {
    color: '#8a99ad',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  agentNameText: {
    color: '#ffcc00',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  agentAliasText: {
    color: '#c8d4e0',
    fontSize: 10,
    fontStyle: 'italic',
  },
  centerBoardArea: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSidebar: {
    width: 195,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  controlsLabel: {
    color: '#8a99ad',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  tipOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    alignItems: 'center',
    zIndex: 50,
  },
  tipCardContainer: {
    width: 420,
    maxWidth: '92%',
  },
  guideModal: {
    flex: 1,
    backgroundColor: '#090c10',
    paddingHorizontal: 16,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#25303d',
  },
  guideTitle: {
    color: '#ffcc00',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  blackEntryCurtain: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 999,
  },
});
