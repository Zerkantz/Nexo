// Pantalla de Selector de Personaje (Estilo Arcade Cabinet SNK Neo-Geo / Metal Slug 32-Bit).
// Muestra las cartas completas sin recortar con sus placas de nombre originales,
// estética arcade militar, barras de atributos y botón START para desplegar en el nivel.
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Shield, Zap } from 'lucide-react-native';
import { colors } from '../theme/colors';
import {
  CHARACTER_LIST,
  getCharacterCards,
  getSelectedCharacter,
  setSelectedCharacter,
  type CharacterId,
} from '../lib/characters';
import { CharacterSprite } from '../components/game/CharacterSprite';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.52, 210);

export default function CharacterSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const [selectedId, setSelectedId] = useState<CharacterId>('jesus');
  const [previewAction, setPreviewAction] = useState<'down' | 'right' | 'left' | 'hack' | 'idle'>('down');
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    getSelectedCharacter().then((id) => {
      setSelectedId(id);
    });
  }, []);

  const handleSelect = async (id: CharacterId) => {
    setSelectedId(id);
    await setSelectedCharacter(id);
  };

  const handleStartMission = async () => {
    setDeploying(true);
    await setSelectedCharacter(selectedId);
    setTimeout(() => {
      const destination = params.next || '/game/demo';
      router.replace(destination as any);
    }, 200);
  };

  const selectedDef = CHARACTER_LIST.find((c) => c.id === selectedId) || CHARACTER_LIST[0];

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Franja de advertencia industrial (Metal Slug hazard stripe) */}
      <View style={styles.hazardMarquee} />

      {/* 2. Cabecera estilo Arcade Cabinet */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color="#ffcc00" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.arcadeBadge}>NEO-GEO MVS // 32-BIT</Text>
          <Text style={styles.arcadeTitle}>SELECT OPERATOR</Text>
        </View>
        <View style={styles.creditBadge}>
          <Text style={styles.creditText}>1P READY</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 3. Carrusel de Cartas sin recortes (muestra retrato y placa de nombre completa) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsTrack}
          snapToInterval={CARD_WIDTH + 14}
          decelerationRate="fast"
        >
          {CHARACTER_LIST.map((char) => {
            const isSelected = char.id === selectedId;
            const cards = getCharacterCards(char.id);
            const cardImg = isSelected ? cards.selected : cards.relaxed;

            return (
              <Pressable
                key={char.id}
                onPress={() => handleSelect(char.id)}
                style={[
                  styles.cardBox,
                  { width: CARD_WIDTH },
                  isSelected && styles.cardBoxActive,
                ]}
              >
                {/* Insignia P1 estilo Arcade */}
                {isSelected && (
                  <View style={styles.p1Badge}>
                    <Text style={styles.p1BadgeText}>P1</Text>
                  </View>
                )}

                {/* Contenedor completo de la carta original sin cortes */}
                <View style={styles.cardImageContainer}>
                  <Image source={cardImg} style={styles.fullCardImage} />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 4. Panel de Información Táctica Militar (Briefing Room) */}
        <View style={styles.briefingBox}>
          <View style={styles.briefingTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.briefingName}>
                {selectedDef.name.toUpperCase()} // "{selectedDef.alias}"
              </Text>
              <Text style={styles.briefingRole}>{selectedDef.role.toUpperCase()}</Text>
            </View>

            {/* Caja de sprite top-down 32-bit en vivo */}
            <View style={styles.spritePreviewBox}>
              <CharacterSprite
                characterId={selectedDef.id}
                action={previewAction}
                isMoving={previewAction === 'down' || previewAction === 'right' || previewAction === 'left'}
                isHacking={previewAction === 'hack'}
                size={50}
              />
            </View>
          </View>

          {/* Selector de postura / movimiento del sprite */}
          <View style={styles.actionPills}>
            {(['down', 'left', 'right', 'hack', 'idle'] as const).map((act) => (
              <Pressable
                key={act}
                onPress={() => setPreviewAction(act)}
                style={[
                  styles.actionPill,
                  previewAction === act && styles.actionPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.actionPillText,
                    previewAction === act && styles.actionPillTextActive,
                  ]}
                >
                  {act.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Banner de Habilidad Pasiva estilo militar */}
          <View style={styles.passiveBanner}>
            <View style={styles.passiveTitleRow}>
              <Zap size={14} color="#00ff88" />
              <Text style={styles.passiveTitle}>
                HABILIDAD PASIVA: {selectedDef.passiveName.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.passiveDesc}>{selectedDef.passiveDescription}</Text>
          </View>

          {/* Barras de estadísticas segmentadas estilo Neo-Geo */}
          <View style={styles.statsList}>
            <StatRow label="SIGILO" value={selectedDef.stats.stealth} />
            <StatRow label="VELOCIDAD" value={selectedDef.stats.speed} />
            <StatRow label="BATERÍA" value={selectedDef.stats.battery} />
            <StatRow label="HACKEO" value={selectedDef.stats.hack} />
          </View>
        </View>

        {/* 5. Botón de inicio arcade grande 3D (START // INICIAR NIVEL 1) */}
        <View style={styles.deployBar}>
          <Pressable
            onPress={handleStartMission}
            disabled={deploying}
            style={({ pressed }) => [
              styles.startArcadeBtn,
              pressed && styles.startArcadeBtnPressed,
            ]}
          >
            <Play size={20} color="#ffffff" fill="#ffffff" />
            <Text style={styles.startBtnText}>
              {deploying ? 'DESPLEGANDO OPERACIÓN...' : 'START // INICIAR NIVEL 1'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statName}>{label}</Text>
      <View style={styles.statBars}>
        {[1, 2, 3, 4, 5].map((lvl) => (
          <View
            key={lvl}
            style={[
              styles.statSeg,
              lvl <= value ? styles.statSegFill : styles.statSegEmpty,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0f12',
  },
  hazardMarquee: {
    height: 10,
    backgroundColor: '#ffb800',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#161b21',
    borderBottomWidth: 3,
    borderBottomColor: '#242c36',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#222933',
    borderWidth: 1.5,
    borderColor: '#3c4856',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  arcadeBadge: {
    color: '#8a9ba8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  arcadeTitle: {
    color: '#ffcc00',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  creditBadge: {
    backgroundColor: '#091c12',
    borderWidth: 1.5,
    borderColor: '#00ff88',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  creditText: {
    color: '#00ff88',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  cardsTrack: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    backgroundColor: '#111418',
    borderBottomWidth: 3,
    borderBottomColor: '#20262e',
  },
  cardBox: {
    backgroundColor: '#1a2027',
    borderWidth: 3,
    borderColor: '#343f4c',
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
  cardBoxActive: {
    borderColor: '#ffcc00',
    backgroundColor: '#232b26',
    shadowColor: '#ffcc00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  p1Badge: {
    position: 'absolute',
    top: -9,
    left: 8,
    backgroundColor: '#d81b1b',
    borderWidth: 1.5,
    borderColor: '#ffcc00',
    borderRadius: 3,
    paddingHorizontal: 7,
    paddingVertical: 1,
    zIndex: 10,
  },
  p1BadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardImageContainer: {
    width: '100%',
    aspectRatio: 440 / 980,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#080a0c',
    borderWidth: 1.5,
    borderColor: '#242c36',
  },
  fullCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  briefingBox: {
    marginHorizontal: 14,
    marginTop: 14,
    backgroundColor: '#161c22',
    borderWidth: 2,
    borderColor: '#303b47',
    borderRadius: 10,
    padding: 14,
  },
  briefingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#252e37',
    paddingBottom: 10,
  },
  briefingName: {
    color: '#ffcc00',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  briefingRole: {
    color: '#8e9eaf',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  spritePreviewBox: {
    width: 60,
    height: 60,
    backgroundColor: '#0a0d10',
    borderWidth: 2,
    borderColor: '#435161',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPills: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  actionPill: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: '#202630',
    borderWidth: 1,
    borderColor: '#384556',
    alignItems: 'center',
  },
  actionPillActive: {
    backgroundColor: '#ffcc00',
    borderColor: '#ffcc00',
  },
  actionPillText: {
    color: '#8e9eaf',
    fontSize: 9,
    fontWeight: '800',
  },
  actionPillTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  passiveBanner: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#1b261e',
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
    borderRadius: 4,
  },
  passiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  passiveTitle: {
    color: '#00ff88',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  passiveDesc: {
    color: '#d6dfe8',
    fontSize: 11,
    lineHeight: 15,
  },
  statsList: {
    marginTop: 12,
    gap: 6,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statName: {
    color: '#8e9eaf',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statBars: {
    flexDirection: 'row',
    gap: 4,
  },
  statSeg: {
    width: 18,
    height: 8,
    borderRadius: 2,
  },
  statSegFill: {
    backgroundColor: '#ffaa00',
    shadowColor: '#ffaa00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  statSegEmpty: {
    backgroundColor: '#27313c',
  },
  deployBar: {
    marginHorizontal: 14,
    marginTop: 16,
  },
  startArcadeBtn: {
    backgroundColor: '#d83800',
    borderWidth: 3,
    borderColor: '#ffaa00',
    borderRadius: 10,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 8,
  },
  startArcadeBtnPressed: {
    backgroundColor: '#b82e00',
    transform: [{ translateY: 2 }],
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
