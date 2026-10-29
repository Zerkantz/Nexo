// Pantalla de Juego en Formato Horizontal (Landscape) estilo 16-Bit:
// - Columna Izquierda: Boton de PAUSA + Boton (?) Manual + Titulo del Sector arriba, HUD tactico al centro,
//   aviso de accion en vivo (`feedback`) y tarjeta de "AGENTE EN CAMPO" abajo.
// - Columna Central: Tablero 12x12 con marcador [OBJ] del objetivo actual y prevision de patrullas.
// - Columna Derecha: Cruceta de control (D-Pad), botones interactivos de Habilidades del Hacker Deck
//   y leyenda visual compacta.
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
import { BookOpen, CircleHelp, Home, Pause, Play, Radio, RotateCcw, X } from 'lucide-react-native';
import { Board } from '../../components/game/Board';
import { DPad } from '../../components/game/DPad';
import { Hud } from '../../components/game/Hud';
import { ResultModal } from '../../components/game/ResultModal';
import { RoomTransitionOverlay } from '../../components/game/RoomTransitionOverlay';
import { HowToPlayGuide } from '../../components/tutorial/HowToPlayGuide';
import { TipCard } from '../../components/tutorial/TipCard';
import { useGameSession } from '../../hooks/useGameSession';
import { useTutorial } from '../../hooks/useTutorial';
import type { SkillCode } from '../../lib/api';
import { SKILL_CATALOG } from '../../lib/playerStore';
import { colors } from '../../theme/colors';
import {
  CHARACTERS,
  getCharacterAvatar,
  getSelectedCharacter,
  type CharacterId,
} from '../../lib/characters';

const SHORT_SKILL_LABELS: Record<SkillCode, string> = {
  SCANNER: 'ESCANER',
  SABOTAGE: 'SABOTAJE',
  CAMOUFLAGE: 'CAMUFLAJE',
  OVERLOAD: 'SOBRECARGA',
  RADAR: 'RADAR',
  EMP: 'PULSO PEM',
  THERMAL: 'TERMICA',
  TIMEDILATE: 'DILATAR',
};

export default function GameScreen() {
  const params = useLocalSearchParams<{ sessionId: string; slot?: string }>();
  const cleanSessionId = (params.sessionId ?? '').split('?')[0];
  const mySlot = Number(params.slot || 1);
  const {
    state,
    feedback,
    equippedSkills,
    efficiencyDiscount,
    ended,
    error,
    isDemo,
    transitioningRoom,
    clearTransition,
    move,
    wait,
    activateSkill,
    leave,
    resetDemo,
  } = useGameSession(cleanSessionId, mySlot);
  const { width, height } = useWindowDimensions();
  const [pauseOpen, setPauseOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [characterId, setCharacterId] = useState<CharacterId>('jesus');
  const [centerSize, setCenterSize] = useState<{ w: number; h: number } | null>(null);

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

  const me = state?.players.find((p) => p.slot === mySlot) ?? state?.players[0];
  const tutorial = useTutorial(state, me);

  const exitToMainMenu = () => {
    setPauseOpen(false);
    setGuideOpen(false);
    leave();
    router.replace('/?menu=1' as any);
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

  const feedbackColor =
    feedback?.tone === 'danger'
      ? '#ff4d6d'
      : feedback?.tone === 'warn'
        ? '#ffcc00'
        : feedback?.tone === 'success'
          ? '#00E699'
          : '#00F0FF';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      <View style={styles.landscapeLayout}>
        {/* 1. Panel Izquierdo: PAUSA + AYUDA arriba, HUD al centro, Feedback en vivo y AGENTE EN CAMPO */}
        <View style={styles.leftSidebar}>
          <View style={styles.navRow}>
            <Pressable
              onPress={() => setPauseOpen(true)}
              style={styles.pauseBtn}
              accessibilityLabel="Pausar partida"
            >
              <Pause size={14} color="#ffcc00" fill="#ffcc00" />
              <Text style={styles.pauseBtnText}>PAUSA</Text>
            </Pressable>

            <Pressable
              onPress={() => setGuideOpen(true)}
              style={styles.helpMiniBtn}
              accessibilityLabel="Manual tactico"
            >
              <CircleHelp size={15} color="#00F0FF" />
            </Pressable>

            <View style={styles.sectorBadge}>
              <Text style={styles.sectorLabel} numberOfLines={2}>
                {state.roomName ?? 'BOVEDA CENTRAL'}
              </Text>
            </View>
          </View>

          <Hud state={state} me={me} />

          {/* Aviso tactico en tiempo real */}
          {feedback ? (
            <View
              style={[
                styles.liveFeedbackBox,
                { borderColor: feedbackColor },
              ]}
            >
              <Text
                style={[styles.liveFeedbackText, { color: feedbackColor }]}
                numberOfLines={3}
              >
                {feedback.text}
              </Text>
            </View>
          ) : null}

          <View style={styles.agentBanner}>
            <Image source={getCharacterAvatar(characterId)} style={styles.agentAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.agentRoleTag}>
                AGENTE · {me?.camouflageTurns ? `CAMUFLAJE (${me.camouflageTurns}T)` : 'ACTIVO'}
              </Text>
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
            highlightColor={tutorial.current?.color || '#00F0FF'}
          />
        </View>

        {/* 3. Panel Derecho: Cruceta (D-Pad) + Habilidades del Hacker Deck + Leyenda */}
        <View style={styles.rightSidebar}>
          <Text style={styles.controlsLabel}>CONTROL TACTICO</Text>
          <DPad accent="#ffb800" disabled={!canPlay} onMove={move} onWait={wait} />

          {/* Barra interactiva de Habilidades del Hacker Deck */}
          <View style={styles.deckBox}>
            <View style={styles.deckHeader}>
              <Radio size={11} color="#00F0FF" />
              <Text style={styles.deckHeaderText}>HABILIDADES DECK</Text>
            </View>
            <View style={styles.deckGrid}>
              {equippedSkills.slice(0, 4).map((code) => {
                const def = SKILL_CATALOG.find((s) => s.code === code);
                const cost = Math.max(5, (def?.cost ?? 20) - efficiencyDiscount);
                const enoughBat = (me?.battery ?? 0) >= cost;
                return (
                  <Pressable
                    key={code}
                    disabled={!canPlay}
                    onPress={() => activateSkill(code)}
                    style={({ pressed }) => [
                      styles.skillBtn,
                      enoughBat ? styles.skillBtnReady : styles.skillBtnLowBat,
                      pressed && styles.skillBtnPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.skillBtnLabel,
                        { color: enoughBat ? '#ffffff' : '#6c7f93' },
                      ]}
                      numberOfLines={1}
                    >
                      {SHORT_SKILL_LABELS[code] ?? code}
                    </Text>
                    <Text
                      style={[
                        styles.skillBtnCost,
                        { color: enoughBat ? '#00F0FF' : '#ff4d6d' },
                      ]}
                    >
                      {cost}% BAT
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Leyenda compacta en 2 columnas */}
          <View style={styles.legendBox}>
            <View style={styles.legendGrid}>
              <View style={styles.legendRow}>
                <View style={[styles.legendSwatch, { backgroundColor: '#ffcc00' }]} />
                <Text style={styles.legendText}>[OBJ] Meta</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendSwatch, { backgroundColor: '#00E699' }]} />
                <Text style={styles.legendText}>Paso libre</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendSwatch, { backgroundColor: '#FF8800' }]} />
                <Text style={styles.legendText}>Guardia</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendSwatch, { backgroundColor: '#FF2E4C' }]} />
                <Text style={styles.legendText}>Camara</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

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
              {state.roomName ?? 'OPERACION ACTIVA'} · TURNO {state.turn}
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
                <Text style={styles.pauseActionText}>COMO JUGAR // MANUAL TACTICO</Text>
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
                  SALIR AL MENU DE MODOS
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ResultModal result={ended} onBack={exitToMainMenu} onRetry={isDemo ? resetDemo : undefined} />

      <RoomTransitionOverlay
        visible={!!transitioningRoom}
        roomName={transitioningRoom ?? ''}
        onAnimationComplete={clearTransition}
      />

      <Modal visible={guideOpen} animationType="fade" onRequestClose={() => setGuideOpen(false)}>
        <SafeAreaView style={styles.guideModal}>
          <StatusBar hidden />
          <View style={styles.guideHeader}>
            <Text style={styles.guideTitle}>MANUAL TACTICO // COMO JUGAR</Text>
            <Pressable onPress={() => setGuideOpen(false)} style={styles.closeIconBtn}>
              <X size={20} color="#ffcc00" />
            </Pressable>
          </View>
          <HowToPlayGuide />
        </SafeAreaView>
      </Modal>

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
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 12,
  },
  leftSidebar: {
    width: 216,
    height: '100%',
    justifyContent: 'space-between',
    gap: 6,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#18212d',
    borderWidth: 1.5,
    borderColor: '#ffcc00',
  },
  pauseBtnText: {
    color: '#ffcc00',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  helpMiniBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#131d29',
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectorBadge: {
    flex: 1,
  },
  sectorLabel: {
    color: '#e8f0f8',
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  liveFeedbackBox: {
    backgroundColor: '#0e151f',
    borderWidth: 1.5,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  liveFeedbackText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
  },
  agentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#131a23',
    borderWidth: 1.5,
    borderColor: '#344456',
    borderRadius: 8,
    padding: 7,
  },
  agentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#ffb800',
    backgroundColor: '#080a0e',
  },
  agentRoleTag: {
    color: '#8899ad',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  agentNameText: {
    color: '#ffcc00',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  agentAliasText: {
    color: '#b8c8d8',
    fontSize: 9.5,
    fontWeight: '600',
  },
  centerBoardArea: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSidebar: {
    width: 192,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
    gap: 4,
  },
  controlsLabel: {
    color: '#96a8bc',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  deckBox: {
    width: '100%',
    backgroundColor: '#131a23',
    borderWidth: 1.5,
    borderColor: '#293a4d',
    borderRadius: 7,
    padding: 6,
    gap: 4,
  },
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deckHeaderText: {
    color: '#00F0FF',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  deckGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'space-between',
  },
  skillBtn: {
    width: '48.5%',
    borderRadius: 5,
    borderWidth: 1.5,
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#0c121a',
  },
  skillBtnReady: {
    borderColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  skillBtnLowBat: {
    borderColor: '#2a3746',
    opacity: 0.65,
  },
  skillBtnPressed: {
    transform: [{ scale: 0.96 }],
  },
  skillBtnLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  skillBtnCost: {
    fontSize: 7.5,
    fontWeight: '900',
  },
  legendBox: {
    width: '100%',
    backgroundColor: '#131a23',
    borderWidth: 1,
    borderColor: '#2a3748',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 3,
  },
  legendRow: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    color: '#b8c8d8',
    fontSize: 8.5,
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
