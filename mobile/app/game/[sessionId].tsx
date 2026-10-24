// Pantalla de Juego en Formato Horizontal (Landscape) estilo 16-Bit:
// - Columna Izquierda: Botón de PAUSA + Título del Sector arriba, HUD táctico al centro,
//   y tarjeta de "AGENTE EN CAMPO" ubicada en la esquina inferior izquierda.
// - Columna Central: Tablero 12x12 con estética 16-bit y elementos rediseñados.
// - Columna Derecha: Cruceta de control ergonómica y leyenda visual.
// - Menú de Pausa: Permite Reanudar, abrir el "Cómo Jugar" actualizado, Reiniciar o Salir al Inicio.
import React, { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
import { BookOpen, Home, Pause, Play, RotateCcw, X } from 'lucide-react-native';
import { Board } from '../../components/game/Board';
import { DPad } from '../../components/game/DPad';
import { Hud } from '../../components/game/Hud';
import { ResultModal } from '../../components/game/ResultModal';
import { RoomTransitionOverlay } from '../../components/game/RoomTransitionOverlay';
import { HowToPlayGuide } from '../../components/tutorial/HowToPlayGuide';
import { TipCard } from '../../components/tutorial/TipCard';
import { useGameSession } from '../../hooks/useGameSession';
import { useTutorial } from '../../hooks/useTutorial';
import { colors } from '../../theme/colors';
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
  const [pauseOpen, setPauseOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [characterId, setCharacterId] = useState<CharacterId>('jesus');
  const [centerSize, setCenterSize] = useState<{ w: number; h: number } | null>(null);

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

  const exitToMainMenu = () => {
    setPauseOpen(false);
    setGuideOpen(false);
    leave();
    router.replace('/');
  };

  if (!state) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar hidden />
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

  // Cálculo preciso del tamaño del tablero 12x12 para nunca invadir los paneles laterales
  const fallbackW = Math.max(200, width - 460);
  const fallbackH = Math.max(200, height - 20);
  const availW = centerSize ? Math.max(180, centerSize.w - 8) : fallbackW;
  const availH = centerSize ? Math.max(180, centerSize.h - 6) : fallbackH;
  const boardBudget = Math.min(availW, availH);
  const tileSize = Math.max(16, Math.floor(boardBudget / Math.max(state.width, state.height)));

  const showingTip = !!tutorial.current;
  const canPlay =
    state.status === 'PLAYING' && !showingTip && !transitioningRoom && !pauseOpen && !guideOpen;
  const activeChar = CHARACTERS[characterId];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      <View style={styles.landscapeLayout}>
        {/* 1. Panel Izquierdo: PAUSA arriba, HUD al centro y AGENTE EN CAMPO en la esquina inferior izquierda */}
        <View style={styles.leftSidebar}>
          {/* Fila superior: Botón de Pausa y Nombre del Sector */}
          <View style={styles.navRow}>
            <Pressable
              onPress={() => setPauseOpen(true)}
              style={styles.pauseBtn}
              accessibilityLabel="Pausar partida"
            >
              <Pause size={16} color="#ffcc00" fill="#ffcc00" />
              <Text style={styles.pauseBtnText}>PAUSA</Text>
            </Pressable>
            <View style={styles.sectorBadge}>
              <Text style={styles.sectorLabel} numberOfLines={2}>
                {state.roomName ?? 'BÓVEDA CENTRAL'}
              </Text>
            </View>
          </View>

          {/* HUD de Turno, Energía, Alerta y Reloj */}
          <Hud state={state} me={me} />

          {/* Esquina Inferior Izquierda: Tarjeta de AGENTE EN CAMPO */}
          <View style={styles.agentBanner}>
            <Image source={getCharacterAvatar(characterId)} style={styles.agentAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.agentRoleTag}>AGENTE EN CAMPO</Text>
              <Text style={styles.agentNameText}>{activeChar.name.toUpperCase()}</Text>
              <Text style={styles.agentAliasText} numberOfLines={1}>
                {activeChar.role}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Columna Central: Tablero 12x12 estilo 16-bit */}
        <View
          style={styles.centerBoardArea}
          onLayout={(e) => {
            const { width: lw, height: lh } = e.nativeEvent.layout;
            if (lw > 0 && lh > 0) {
              setCenterSize({ w: lw, h: lh });
            }
          }}
        >
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

        {/* 3. Panel Derecho: Cruceta de Control (D-Pad) + Leyenda Intuitiva del Mapa */}
        <View style={styles.rightSidebar}>
          <Text style={styles.controlsLabel}>CONTROL TÁCTICO</Text>
          <DPad accent="#ffb800" disabled={!canPlay} onMove={move} onWait={wait} />

          {/* Leyenda rápida para entender el mapa al instante */}
          <View style={styles.legendBox}>
            <View style={styles.legendRow}>
              <View style={[styles.legendSwatch, { backgroundColor: '#00E699' }]} />
              <Text style={styles.legendText}>Paso disponible</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendSwatch, { backgroundColor: '#FF8800' }]} />
              <Text style={styles.legendText}>Visión de guardia</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendSwatch, { backgroundColor: '#FF2E4C' }]} />
              <Text style={styles.legendText}>Visión de cámara</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendSwatch, { backgroundColor: '#BD00FF' }]} />
              <Text style={styles.legendText}>Puerta a otro cuarto</Text>
            </View>
          </View>
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

      {/* Modal de Pausa */}
      <Modal
        visible={pauseOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPauseOpen(false)}
      >
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseCard}>
            <Text style={styles.pauseTitle}>PARTIDA EN PAUSA</Text>
            <Text style={styles.pauseSub}>
              {state.roomName ?? 'OPERACIÓN ACTIVA'} · TURNO {state.turn}
            </Text>

            <View style={styles.pauseButtons}>
              <Pressable
                style={[styles.pauseActionBtn, styles.pauseResumeBtn]}
                onPress={() => setPauseOpen(false)}
              >
                <Play size={18} color="#ffffff" fill="#ffffff" />
                <Text style={styles.pauseResumeText}>REANUDAR PARTIDA</Text>
              </Pressable>

              <Pressable
                style={styles.pauseActionBtn}
                onPress={() => {
                  setPauseOpen(false);
                  setGuideOpen(true);
                }}
              >
                <BookOpen size={18} color="#ffcc00" />
                <Text style={styles.pauseActionText}>CÓMO JUGAR // MANUAL TÁCTICO</Text>
              </Pressable>

              {isDemo && (
                <Pressable
                  style={styles.pauseActionBtn}
                  onPress={() => {
                    setPauseOpen(false);
                    resetDemo();
                  }}
                >
                  <RotateCcw size={18} color="#00e699" />
                  <Text style={styles.pauseActionText}>REINICIAR SECTOR</Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.pauseActionBtn, styles.pauseExitBtn]}
                onPress={exitToMainMenu}
              >
                <Home size={18} color="#ff4d6a" />
                <Text style={[styles.pauseActionText, { color: '#ff6b82' }]}>
                  SALIR AL INICIO
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de victoria / derrota */}
      <ResultModal result={ended} onBack={exitToMainMenu} onRetry={isDemo ? resetDemo : undefined} />

      {/* Animación de transición de cuarto */}
      <RoomTransitionOverlay
        visible={!!transitioningRoom}
        roomName={transitioningRoom ?? ''}
        onAnimationComplete={clearTransition}
      />

      {/* Guía completa ("Cómo jugar" actualizado) en Modal */}
      <Modal visible={guideOpen} animationType="fade" onRequestClose={() => setGuideOpen(false)}>
        <SafeAreaView style={styles.guideModal}>
          <StatusBar hidden />
          <View style={styles.guideHeader}>
            <Text style={styles.guideTitle}>MANUAL TÁCTICO // CÓMO JUGAR</Text>
            <Pressable onPress={() => setGuideOpen(false)} style={styles.closeIconBtn}>
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
    backgroundColor: '#090c11',
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
    gap: 14,
  },
  leftSidebar: {
    width: 212,
    height: '100%',
    justifyContent: 'space-between',
    gap: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 7,
    backgroundColor: '#18212d',
    borderWidth: 1.5,
    borderColor: '#ffcc00',
  },
  pauseBtnText: {
    color: '#ffcc00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectorBadge: {
    flex: 1,
  },
  sectorLabel: {
    color: '#e8f0f8',
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  agentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#131a23',
    borderWidth: 1.5,
    borderColor: '#344456',
    borderRadius: 8,
    padding: 8,
  },
  agentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#ffb800',
    backgroundColor: '#080a0e',
  },
  agentRoleTag: {
    color: '#8899ad',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  agentNameText: {
    color: '#ffcc00',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  agentAliasText: {
    color: '#b8c8d8',
    fontSize: 10,
    fontWeight: '600',
  },
  centerBoardArea: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSidebar: {
    width: 184,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  controlsLabel: {
    color: '#96a8bc',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  legendBox: {
    width: '100%',
    backgroundColor: '#131a23',
    borderWidth: 1,
    borderColor: '#2a3748',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 6,
    gap: 3,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  legendSwatch: {
    width: 9,
    height: 9,
    borderRadius: 2,
  },
  legendText: {
    color: '#b8c8d8',
    fontSize: 9.5,
    fontWeight: '700',
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
  pauseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 12, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  pauseCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#121822',
    borderWidth: 2.5,
    borderColor: '#ffcc00',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 14,
  },
  pauseTitle: {
    color: '#ffcc00',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  pauseSub: {
    color: '#96a8bc',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  pauseButtons: {
    width: '100%',
    gap: 9,
  },
  pauseActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#192230',
    borderWidth: 1.5,
    borderColor: '#36465a',
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  pauseResumeBtn: {
    backgroundColor: '#d83800',
    borderColor: '#ffcc00',
    borderWidth: 2,
  },
  pauseResumeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  pauseActionText: {
    color: '#e8f0f8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pauseExitBtn: {
    borderColor: 'rgba(255, 77, 106, 0.45)',
    backgroundColor: 'rgba(45, 16, 24, 0.65)',
  },
  guideModal: {
    flex: 1,
    backgroundColor: '#090c11',
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
  closeIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 7,
    backgroundColor: '#151d27',
    borderWidth: 1.5,
    borderColor: '#3a4a5e',
    alignItems: 'center',
    justifyContent: 'center',
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
