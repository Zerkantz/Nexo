// Menú Principal en formato Horizontal (Landscape) con fondo de arte pixel art.
// Diseño centrado y limpio: sin tarjeta de último agente y con acceso al manual
// táctico mediante botón de signo de interrogación (?) en la esquina.
import React from 'react';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleHelp, Play, ShieldAlert } from 'lucide-react-native';
import { MENU_BG } from '../lib/environmentAssets';

export default function Index() {
  return (
    <ImageBackground source={MENU_BG} style={styles.bgImage} resizeMode="cover">
      <StatusBar hidden />
      <View style={styles.darkOverlay}>
        {/* Franja superior arcade */}
        <View style={styles.hazardStrip} />

        <SafeAreaView style={styles.safeArea}>
          {/* Barra superior con etiqueta del sistema y botón (?) de Manual Táctico en la esquina */}
          <View style={styles.topBar}>
            <View style={styles.systemTag}>
              <ShieldAlert size={14} color="#ffcc00" />
              <Text style={styles.systemTagText}>NEXO // TACTICAL STEALTH</Text>
            </View>

            <Link href="/how-to-play" asChild>
              <Pressable
                style={styles.helpCornerBtn}
                accessibilityLabel="Manual táctico: Cómo jugar"
              >
                <CircleHelp size={22} color="#ffcc00" />
              </Pressable>
            </Link>
          </View>

          {/* Bloque central: Título y Botón principal centrados */}
          <View style={styles.centerContent}>
            <View style={styles.titleBlock}>
              <Text style={styles.subTitle}>INFILTRACIÓN TÁCTICA · MÓVIL + RELOJ</Text>
              <Text style={styles.logo}>NEXO</Text>
              <View style={styles.missionBadge}>
                <Text style={styles.missionBadgeText}>OPERACIÓN 01: ACCESO PERIMETRAL</Text>
              </View>
            </View>

            <View style={styles.menuButtons}>
              <Link href={'/character-select?next=/game/demo' as any} asChild>
                <Pressable style={styles.startBtn}>
                  <Play size={20} color="#ffffff" fill="#ffffff" />
                  <Text style={styles.startBtnText}>INICIAR NIVEL 1 // START</Text>
                </Pressable>
              </Link>
            </View>
          </View>

          {/* Pie de pantalla limpio */}
          <View style={styles.footer}>
            <Text style={styles.footerBlink}>PRESS START TO DEPLOY</Text>
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
    backgroundColor: 'rgba(8, 11, 16, 0.56)',
  },
  hazardStrip: {
    height: 6,
    backgroundColor: '#ffb800',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 12,
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
    gap: 22,
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
    fontSize: 68,
    fontWeight: '900',
    letterSpacing: 12,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 4, height: 5 },
    textShadowRadius: 1,
  },
  missionBadge: {
    marginTop: 6,
    backgroundColor: 'rgba(18, 24, 32, 0.92)',
    borderWidth: 1.5,
    borderColor: '#ff5500',
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  missionBadgeText: {
    color: '#eef4fa',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  menuButtons: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  startBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#d83800',
    borderWidth: 3,
    borderColor: '#ffcc00',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 8,
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  footerBlink: {
    color: '#ffcc00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
