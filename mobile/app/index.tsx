// Menú Principal en formato Horizontal (Landscape) con fondo de arte 32-bit pixel art
// y estética arcade Metal Slug / Neo-Geo.
import React, { useState } from 'react';
import { Link, useFocusEffect } from 'expo-router';
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Play, ShieldAlert } from 'lucide-react-native';
import { API_URL } from '../lib/config';
import { MENU_BG } from '../lib/environmentAssets';
import {
  CHARACTERS,
  getCharacterAvatar,
  getSelectedCharacter,
  type CharacterId,
} from '../lib/characters';

export default function Index() {
  const [characterId, setCharacterId] = useState<CharacterId>('jesus');

  useFocusEffect(
    React.useCallback(() => {
      getSelectedCharacter().then(setCharacterId);
    }, []),
  );

  const activeChar = CHARACTERS[characterId];

  return (
    <ImageBackground source={MENU_BG} style={styles.bgImage} resizeMode="cover">
      {/* Viñeta oscura lateral para legibilidad sobre el arte 32-bit */}
      <View style={styles.darkOverlay}>
        {/* Franja superior de peligro industrial */}
        <View style={styles.hazardStrip} />

        <SafeAreaView style={styles.safeArea}>
          {/* Barra superior de gabinete Arcade */}
          <View style={styles.topBar}>
            <View style={styles.systemTag}>
              <ShieldAlert size={14} color="#ffcc00" />
              <Text style={styles.systemTagText}>MVS 32-BIT // TACTICAL STEALTH</Text>
            </View>
            <View style={styles.creditBox}>
              <Text style={styles.creditText}>CREDIT 01 // 1P READY</Text>
            </View>
          </View>

          {/* Contenido central en Horizontal: Izquierda Título/Menú, Derecha Arte de Bóveda + Agente */}
          <View style={styles.mainContent}>
            {/* Columna izquierda: Logo y botones Arcade */}
            <View style={styles.leftColumn}>
              <View style={styles.titleBlock}>
                <Text style={styles.subTitle}>INFILTRACIÓN TÁCTICA · MÓVIL + RELOJ</Text>
                <Text style={styles.logoShadow}>NEXO</Text>
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

                <Link href="/how-to-play" asChild>
                  <Pressable style={styles.secondaryBtn}>
                    <BookOpen size={18} color="#ffcc00" />
                    <Text style={styles.secondaryBtnText}>MANUAL TÁCTICO // CÓMO JUGAR</Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            {/* Columna derecha: Tarjeta flotante del último agente equipado */}
            <View style={styles.rightColumn}>
              <Link href={'/character-select?next=/game/demo' as any} asChild>
                <Pressable style={styles.operatorCard}>
                  <Image source={getCharacterAvatar(characterId)} style={styles.operatorAvatar} />
                  <View style={styles.operatorInfo}>
                    <Text style={styles.operatorLabel}>ÚLTIMO AGENTE SELECCIONADO</Text>
                    <Text style={styles.operatorName}>{activeChar.name.toUpperCase()}</Text>
                    <Text style={styles.operatorRole}>{activeChar.role}</Text>
                  </View>
                </Pressable>
              </Link>
            </View>
          </View>

          {/* Pie de pantalla */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>NEXO ARCADE SYSTEM · SERVIDOR: {API_URL}</Text>
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
    backgroundColor: 'rgba(8, 11, 15, 0.58)',
  },
  hazardStrip: {
    height: 8,
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
    backgroundColor: 'rgba(18, 23, 29, 0.88)',
    borderWidth: 1.5,
    borderColor: '#435160',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  systemTagText: {
    color: '#c8d4e0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  creditBox: {
    backgroundColor: 'rgba(10, 28, 18, 0.9)',
    borderWidth: 1.5,
    borderColor: '#00ff88',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  creditText: {
    color: '#00ff88',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  leftColumn: {
    flex: 1.2,
    maxWidth: 440,
    gap: 18,
  },
  titleBlock: {
    position: 'relative',
  },
  subTitle: {
    color: '#ffcc00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  logoShadow: {
    position: 'absolute',
    top: 19,
    left: 4,
    color: '#000000',
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: 10,
  },
  logo: {
    color: '#ffb800',
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: 10,
    textShadowColor: '#b83000',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  missionBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: 'rgba(26, 33, 41, 0.92)',
    borderLeftWidth: 4,
    borderLeftColor: '#ff4400',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  missionBadgeText: {
    color: '#e5ecf4',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  menuButtons: {
    gap: 10,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#d83800',
    borderWidth: 3,
    borderColor: '#ffcc00',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
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
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(22, 28, 36, 0.92)',
    borderWidth: 2,
    borderColor: '#4e5d6c',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  secondaryBtnText: {
    color: '#e0e8f0',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  rightColumn: {
    flex: 0.8,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(18, 23, 30, 0.92)',
    borderWidth: 2,
    borderColor: '#ffb800',
    borderRadius: 10,
    padding: 10,
    maxWidth: 290,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 6,
  },
  operatorAvatar: {
    width: 54,
    height: 54,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4a5868',
    backgroundColor: '#0c1015',
  },
  operatorInfo: {
    flex: 1,
  },
  operatorLabel: {
    color: '#8e9eaf',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  operatorName: {
    color: '#ffcc00',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  operatorRole: {
    color: '#c8d4e0',
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 6,
  },
  footerText: {
    color: '#8e9eaf',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  footerBlink: {
    color: '#ffcc00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
