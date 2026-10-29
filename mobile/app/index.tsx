// Pantalla Principal en formato Horizontal (Landscape):
// - Fase 1 (Pantalla de Titulo): Logo NEXO, boton START centrado y boton (?) arriba a la derecha.
// - Fase 2 (Seleccion de Modo): Solo las 3 tarjetas limpias con su icono grande y su titulo
//   (MODO OFFLINE, MODO ONLINE, TALLER DECK), sin textos ni recuadros de relleno.
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
  Map,
  Play,
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
        <SafeAreaView style={styles.safeArea}>
          {/* Barra superior */}
          <View style={styles.topBar}>
            {showModeMenu ? (
              <Pressable
                onPress={() => setShowModeMenu(false)}
                style={styles.backBtn}
              >
                <ArrowLeft size={16} color="#e2ecf5" />
                <Text style={styles.backBtnText}>Inicio</Text>
              </Pressable>
            ) : (
              <View />
            )}

            <Pressable
              onPress={() => router.push('/how-to-play')}
              style={styles.helpCornerBtn}
              accessibilityLabel="Como jugar"
            >
              <CircleHelp size={22} color="#ffcc00" />
            </Pressable>
          </View>

          {/* FASE 1: PANTALLA DE TITULO (SOLO LOGO Y BOTON START) */}
          {!showModeMenu ? (
            <View style={styles.centerContent}>
              <Text style={styles.logo}>NEXO</Text>

              <Pressable
                onPress={() => setShowModeMenu(true)}
                style={({ pressed }) => [
                  styles.startBtn,
                  pressed && styles.startBtnPressed,
                ]}
              >
                <Play size={20} color="#ffffff" fill="#ffffff" />
                <Text style={styles.startBtnText}>START</Text>
              </Pressable>
            </View>
          ) : (
            /* FASE 2: SELECCIONA MODO DE JUEGO (SOLO ICONO Y TITULO) */
            <View style={styles.modeMenuContainer}>
              <Text style={styles.modeTitle}>SELECCIONA MODO DE JUEGO</Text>

              <View style={styles.modeCardsRow}>
                <Pressable
                  onPress={handleSelectOffline}
                  style={({ pressed }) => [
                    styles.modeCard,
                    styles.cardOffline,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 204, 0, 0.14)' }]}>
                    <Map size={38} color="#ffcc00" />
                  </View>
                  <Text style={styles.modeCardTitle}>MODO OFFLINE</Text>
                </Pressable>

                <Pressable
                  onPress={handleSelectOnline}
                  style={({ pressed }) => [
                    styles.modeCard,
                    styles.cardOnline,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(6, 214, 160, 0.14)' }]}>
                    <Globe size={38} color="#06d6a0" />
                  </View>
                  <Text style={styles.modeCardTitle}>MODO ONLINE</Text>
                </Pressable>

                <Pressable
                  onPress={handleSelectWorkshop}
                  style={({ pressed }) => [
                    styles.modeCard,
                    styles.cardWorkshop,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(76, 201, 240, 0.14)' }]}>
                    <Wrench size={38} color="#4cc9f0" />
                  </View>
                  <Text style={styles.modeCardTitle}>TALLER DECK</Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={styles.footerSpacer} />
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
    backgroundColor: '#0a0d12',
  },
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 12, 18, 0.72)',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20, 29, 41, 0.9)',
    borderWidth: 1,
    borderColor: '#2d3f54',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#e2ecf5',
    fontSize: 12,
    fontWeight: '700',
  },
  helpCornerBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(20, 29, 41, 0.9)',
    borderWidth: 1.5,
    borderColor: '#ffcc00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  logo: {
    color: '#ffb800',
    fontSize: 74,
    fontWeight: '900',
    letterSpacing: 14,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 3, height: 4 },
    textShadowRadius: 4,
  },
  startBtn: {
    width: 220,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#d83800',
    borderWidth: 2.5,
    borderColor: '#ffcc00',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 28,
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
  },
  modeMenuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  modeTitle: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
  },
  modeCardsRow: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
    maxWidth: 680,
    justifyContent: 'center',
  },
  modeCard: {
    flex: 1,
    height: 165,
    backgroundColor: 'rgba(16, 23, 34, 0.92)',
    borderWidth: 1.5,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 16,
  },
  cardOffline: {
    borderColor: 'rgba(255, 204, 0, 0.55)',
  },
  cardOnline: {
    borderColor: 'rgba(6, 214, 160, 0.55)',
  },
  cardWorkshop: {
    borderColor: 'rgba(76, 201, 240, 0.55)',
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  footerSpacer: {
    height: 12,
  },
});
