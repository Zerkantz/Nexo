// Pantalla Principal estilo Videojuego Arcade en formato Horizontal (Landscape):
// - Fase 1 (Pantalla de Título): Solo el logo NEXO, el botón START centrado y el botón (?)
//   de Manual Táctico en la esquina superior derecha.
// - Fase 2 (Menú de Selección tras presionar START):
//   1. MODO OFFLINE -> Lleva a los 5 Distritos (/missions) -> luego al Selector de Personaje.
//   2. MODO ONLINE  -> Exige enlazar el reloj primero (/pair?next=/online) antes de entrar a /online.
//   3. TALLER DECK  -> Lleva al Taller (/workshop), desde donde se accede a Mi Base (/base) y Perfil (/profile).
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CircleHelp,
  Globe,
  Lock,
  Map,
  Play,
  ShieldAlert,
  Watch,
  Wrench,
} from 'lucide-react-native';
import { MENU_BG } from '../lib/environmentAssets';
import {
  DEFAULT_PROFILE_STATE,
  loadPlayerProfile,
  type PlayerProfileState,
} from '../lib/playerStore';

export default function Index() {
  const router = useRouter();
  const params = useLocalSearchParams<{ menu?: string }>();
  const [showModeMenu, setShowModeMenu] = useState(params.menu === '1');
  const [profile, setProfile] = useState<PlayerProfileState>(DEFAULT_PROFILE_STATE);

  useEffect(() => {
    if (params.menu === '1') {
      setShowModeMenu(true);
    }
  }, [params.menu]);

  useEffect(() => {
    loadPlayerProfile().then(setProfile);
  }, [showModeMenu]);

  const isWatchLinked = !!profile.watch;

  const handleSelectOffline = () => {
    router.push('/missions');
  };

  const handleSelectOnline = () => {
    if (!isWatchLinked) {
      router.push('/pair?next=/online' as any);
    } else {
      router.push('/online');
    }
  };

  const handleSelectWorkshop = () => {
    router.push('/workshop');
  };

  return (
    <ImageBackground source={MENU_BG} style={styles.bgImage} resizeMode="cover">
      <StatusBar hidden />
      <View style={styles.darkOverlay}>
        <View style={styles.hazardStrip} />

        <SafeAreaView style={styles.safeArea}>
          {/* Barra superior */}
          <View style={styles.topBar}>
            {showModeMenu ? (
              <Pressable
                onPress={() => setShowModeMenu(false)}
                style={styles.backToTitleBtn}
              >
                <ArrowLeft size={16} color="#ffcc00" />
                <Text style={styles.backToTitleText}>PANTALLA DE TÍTULO</Text>
              </Pressable>
            ) : (
              <View style={styles.systemTag}>
                <ShieldAlert size={14} color="#ffcc00" />
                <Text style={styles.systemTagText}>NEXO // TACTICAL STEALTH</Text>
              </View>
            )}

            <Pressable
              onPress={() => router.push('/how-to-play')}
              style={styles.helpCornerBtn}
              accessibilityLabel="Manual táctico: Cómo jugar"
            >
              <CircleHelp size={22} color="#ffcc00" />
            </Pressable>
          </View>

          {/* FASE 1: PANTALLA DE TÍTULO (SOLO BOTÓN START) */}
          {!showModeMenu ? (
            <View style={styles.centerContent}>
              <View style={styles.titleBlock}>
                <Text style={styles.subTitle}>INFILTRACIÓN TÁCTICA · MÓVIL + RELOJ</Text>
                <Text style={styles.logo}>NEXO</Text>
              </View>

              <View style={styles.startButtonWrapper}>
                <Pressable
                  onPress={() => setShowModeMenu(true)}
                  style={({ pressed }) => [
                    styles.startBtn,
                    pressed && styles.startBtnPressed,
                  ]}
                >
                  <Play size={22} color="#ffffff" fill="#ffffff" />
                  <Text style={styles.startBtnText}>START</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* FASE 2: MENÚ PRINCIPAL DE MODOS (OFFLINE / ONLINE / TALLER DECK) */
            <View style={styles.modeMenuContainer}>
              <View style={styles.modeHeaderBlock}>
                <Text style={styles.modeKicker}>CENTRO DE OPERACIONES NEXO</Text>
                <Text style={styles.modeTitle}>SELECCIONA MODO DE JUEGO</Text>
              </View>

              <View style={styles.modeCardsRow}>
                {/* 1. MODO OFFLINE -> 5 DISTRITOS -> SELECTOR DE PERSONAJE */}
                <Pressable
                  onPress={handleSelectOffline}
                  style={({ pressed }) => [
                    styles.modeCard,
                    styles.modeCardOffline,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={[styles.modeIconBadge, { borderColor: '#ffcc00' }]}>
                    <Map size={24} color="#ffcc00" />
                  </View>
                  <Text style={styles.modeCardTag}>CAMPAÑA SOLITARIO</Text>
                  <Text style={styles.modeCardTitle}>MODO OFFLINE</Text>
                  <Text style={styles.modeCardDesc}>
                    Elige entre los 5 Distritos tácticos, selecciona a tu agente en campo e
                    infiltra el objetivo.
                  </Text>
                  <View style={styles.modeCardFooter}>
                    <Text style={styles.modeCardAction}>ENTRAR A LOS 5 DISTRITOS</Text>
                  </View>
                </Pressable>

                {/* 2. MODO ONLINE -> REQUIERE ENLAZAR RELOJ */}
                <Pressable
                  onPress={handleSelectOnline}
                  style={({ pressed }) => [
                    styles.modeCard,
                    isWatchLinked ? styles.modeCardOnlineReady : styles.modeCardOnlineLocked,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.modeIconBadge,
                      { borderColor: isWatchLinked ? '#00E699' : '#FF8800' },
                    ]}
                  >
                    {isWatchLinked ? (
                      <Globe size={24} color="#00E699" />
                    ) : (
                      <Watch size={24} color="#FF8800" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.modeCardTag,
                      { color: isWatchLinked ? '#00E699' : '#FF8800' },
                    ]}
                  >
                    {isWatchLinked ? 'RELOJ VINCULADO // ONLINE' : 'REQUISITO: ENLAZAR RELOJ'}
                  </Text>
                  <Text style={styles.modeCardTitle}>MODO ONLINE</Text>
                  <Text style={styles.modeCardDesc}>
                    {isWatchLinked
                      ? 'Salas cooperativas de 2 jugadores (4 dispositivos) y asaltos PvP a bases enemigas.'
                      : 'Para jugar Online es obligatorio enlazar primero tu Smartwatch Wear OS con código de 4 dígitos.'}
                  </Text>
                  <View
                    style={[
                      styles.modeCardFooter,
                      !isWatchLinked && styles.modeCardFooterWarn,
                    ]}
                  >
                    {!isWatchLinked ? <Lock size={11} color="#FF8800" /> : null}
                    <Text
                      style={[
                        styles.modeCardAction,
                        { color: isWatchLinked ? '#00E699' : '#FF8800' },
                      ]}
                    >
                      {isWatchLinked ? 'ENTRAR AL LOBBY ONLINE' : 'ENLAZAR RELOJ AHORA'}
                    </Text>
                  </View>
                </Pressable>

                {/* 3. TALLER DECK -> MEJORAS + MI BASE + PERFIL */}
                <Pressable
                  onPress={handleSelectWorkshop}
                  style={({ pressed }) => [
                    styles.modeCard,
                    styles.modeCardWorkshop,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={[styles.modeIconBadge, { borderColor: '#00F0FF' }]}>
                    <Wrench size={24} color="#00F0FF" />
                  </View>
                  <Text style={[styles.modeCardTag, { color: '#00F0FF' }]}>
                    EQUIPAMIENTO Y CUENTA
                  </Text>
                  <Text style={styles.modeCardTitle}>TALLER DECK</Text>
                  <Text style={styles.modeCardDesc}>
                    Mejora el Hacker Deck, equipa habilidades del reloj, edita tu Base PvP 10x10 y
                    consulta tu Perfil.
                  </Text>
                  <View style={[styles.modeCardFooter, styles.modeCardFooterCyan]}>
                    <Text style={[styles.modeCardAction, { color: '#00F0FF' }]}>
                      ABRIR TALLER · BASE · PERFIL
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          )}

          {/* Pie de pantalla */}
          <View style={styles.footer}>
            <Text style={styles.footerBlink}>
              {showModeMenu
                ? isWatchLinked
                  ? `HACKER DECK CONECTADO: ${profile.watch?.deviceName}`
                  : 'ESTADO DEL RELOJ: NO VINCULADO (REQUERIDO PARA MODO ONLINE)'
                : 'PRESS START TO CONTINUE'}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0a0d10',
  },
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 11, 16, 0.65)',
  },
  hazardStrip: {
    height: 6,
    backgroundColor: '#ffb800',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 26,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  systemTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 20, 27, 0.88)',
    borderWidth: 1.5,
    borderColor: '#3d4b5c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  systemTagText: {
    color: '#d0dce8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  backToTitleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 22, 32, 0.92)',
    borderWidth: 1.5,
    borderColor: '#ffcc00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  backToTitleText: {
    color: '#ffcc00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  helpCornerBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(18, 24, 32, 0.92)',
    borderWidth: 2,
    borderColor: '#ffcc00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 6,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
  },
  titleBlock: {
    alignItems: 'center',
  },
  subTitle: {
    color: '#ffcc00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.5,
    marginBottom: 2,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  logo: {
    color: '#ffb800',
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: 14,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 4, height: 5 },
    textShadowRadius: 1,
  },
  startButtonWrapper: {
    width: 240,
    alignItems: 'center',
  },
  startBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#d83800',
    borderWidth: 3,
    borderColor: '#ffcc00',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 8,
  },
  startBtnPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: '#b82e00',
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
  },
  modeMenuContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  modeHeaderBlock: {
    alignItems: 'center',
    gap: 2,
  },
  modeKicker: {
    color: '#ffcc00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  modeTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
  },
  modeCardsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  modeCard: {
    flex: 1,
    backgroundColor: 'rgba(14, 20, 29, 0.94)',
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    justifyContent: 'space-between',
    gap: 6,
  },
  modeCardOffline: {
    borderColor: '#ffcc00',
  },
  modeCardOnlineReady: {
    borderColor: '#00E699',
  },
  modeCardOnlineLocked: {
    borderColor: '#FF8800',
  },
  modeCardWorkshop: {
    borderColor: '#00F0FF',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  modeIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#090d13',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCardTag: {
    color: '#ffcc00',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  modeCardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modeCardDesc: {
    color: '#a9bdd2',
    fontSize: 10,
    lineHeight: 14,
  },
  modeCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 204, 0, 0.14)',
    borderWidth: 1,
    borderColor: '#ffcc00',
    borderRadius: 6,
    paddingVertical: 6,
    marginTop: 2,
  },
  modeCardFooterWarn: {
    backgroundColor: 'rgba(255, 136, 0, 0.14)',
    borderColor: '#FF8800',
  },
  modeCardFooterCyan: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderColor: '#00F0FF',
  },
  modeCardAction: {
    color: '#ffcc00',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  footerBlink: {
    color: '#ffcc00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
