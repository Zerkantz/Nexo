// Menú Principal en formato Horizontal (Landscape) con fondo de arte pixel art.
// Diseño centrado y limpio: sin tarjeta de último agente, con el botón (?) de Manual
// Táctico en la esquina superior derecha y barra centrada de acceso al Centro de Mando
// (Niveles 1-5, Taller del Reloj, Online Co-op/PvP, Mi Base, Vincular Reloj y Perfil).
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
import {
  CircleHelp,
  Globe,
  KeyRound,
  Map,
  Play,
  Shield,
  ShieldAlert,
  User,
  Watch,
  Wrench,
} from 'lucide-react-native';
import { MENU_BG } from '../lib/environmentAssets';

export default function Index() {
  return (
    <ImageBackground source={MENU_BG} style={styles.bgImage} resizeMode="cover">
      <StatusBar hidden />
      <View style={styles.darkOverlay}>
        {/* Franja superior arcade */}
        <View style={styles.hazardStrip} />

        <SafeAreaView style={styles.safeArea}>
          {/* Barra superior con etiqueta del sistema, acceso a Login y botón (?) en la esquina */}
          <View style={styles.topBar}>
            <View style={styles.topLeftGroup}>
              <View style={styles.systemTag}>
                <ShieldAlert size={14} color="#ffcc00" />
                <Text style={styles.systemTagText}>NEXO // TACTICAL STEALTH</Text>
              </View>

              <Link href="/login" asChild>
                <Pressable style={styles.loginChip}>
                  <KeyRound size={12} color="#00F0FF" />
                  <Text style={styles.loginChipText}>ACCESO / CUENTA</Text>
                </Pressable>
              </Link>
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

          {/* Bloque central: Título, Botón principal y accesos del Centro de Mando centrados */}
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

            {/* Barra centrada de acceso a todas las pantallas del sistema */}
            <View style={styles.commandDock}>
              <Link href="/missions" asChild>
                <Pressable style={styles.dockBtn}>
                  <Map size={13} color="#ffcc00" />
                  <Text style={styles.dockBtnText}>DISTRITOS (1-5)</Text>
                </Pressable>
              </Link>

              <Link href="/workshop" asChild>
                <Pressable style={styles.dockBtn}>
                  <Wrench size={13} color="#00F0FF" />
                  <Text style={styles.dockBtnText}>TALLER DECK</Text>
                </Pressable>
              </Link>

              <Link href="/online" asChild>
                <Pressable style={styles.dockBtn}>
                  <Globe size={13} color="#00E699" />
                  <Text style={styles.dockBtnText}>CO-OP / PvP</Text>
                </Pressable>
              </Link>

              <Link href="/base" asChild>
                <Pressable style={styles.dockBtn}>
                  <Shield size={13} color="#E299FF" />
                  <Text style={styles.dockBtnText}>MI BASE 10x10</Text>
                </Pressable>
              </Link>

              <Link href="/pair" asChild>
                <Pressable style={styles.dockBtn}>
                  <Watch size={13} color="#FF8800" />
                  <Text style={styles.dockBtnText}>VINCULAR RELOJ</Text>
                </Pressable>
              </Link>

              <Link href="/profile" asChild>
                <Pressable style={styles.dockBtn}>
                  <User size={13} color="#ffffff" />
                  <Text style={styles.dockBtnText}>PERFIL</Text>
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
    backgroundColor: 'rgba(8, 11, 16, 0.58)',
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
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  loginChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 22, 32, 0.9)',
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  loginChipText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
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
    gap: 14,
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
    fontSize: 60,
    fontWeight: '900',
    letterSpacing: 12,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 4, height: 5 },
    textShadowRadius: 1,
  },
  missionBadge: {
    marginTop: 4,
    backgroundColor: 'rgba(18, 24, 32, 0.92)',
    borderWidth: 1.5,
    borderColor: '#ff5500',
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  missionBadgeText: {
    color: '#eef4fa',
    fontSize: 10,
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 8,
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  commandDock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  dockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 23, 34, 0.92)',
    borderWidth: 1.5,
    borderColor: '#36485e',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 7,
  },
  dockBtnText: {
    color: '#eef6ff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
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
    letterSpacing: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
