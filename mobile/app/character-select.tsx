// Pantalla de Selector de Personaje (32-bit Retro Metal Slug Style).
// Muestra las 4 cartas de los operadores tácticos (Jesús, Vicente, Francisco, Alberto)
// con sus retratos (Relajado vs Seleccionado), pasivas, estadísticas y previsualización de sprite.
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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Battery,
  CheckCircle2,
  Cpu,
  Footprints,
  Play,
  Shield,
  Zap,
} from 'lucide-react-native';
import { colors, withAlpha } from '../theme/colors';
import {
  CHARACTER_LIST,
  getCharacterCards,
  getSelectedCharacter,
  setSelectedCharacter,
  type CharacterDef,
  type CharacterId,
} from '../lib/characters';
import { CharacterSprite } from '../components/game/CharacterSprite';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.76, 320);

export default function CharacterSelectScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<CharacterId>('jesus');
  const [previewAction, setPreviewAction] = useState<'down' | 'right' | 'hack' | 'idle'>('down');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    getSelectedCharacter().then((id) => {
      setSelectedId(id);
    });
  }, []);

  const handleSelect = async (id: CharacterId) => {
    setSelectedId(id);
    await setSelectedCharacter(id);
  };

  const handleConfirmAndDeploy = async () => {
    await setSelectedCharacter(selectedId);
    setConfirmed(true);
    setTimeout(() => {
      router.push('/game/demo');
    }, 250);
  };

  const selectedDef = CHARACTER_LIST.find((c) => c.id === selectedId) || CHARACTER_LIST[0];

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header arcade */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.arcadeBadge}>ARCADE CODEX // 32-BIT</Text>
          <Text style={styles.headerTitle}>SELECCIÓN DE AGENTE</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. Carrusel horizontal de cartas arcade */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsTrack}
          snapToInterval={CARD_WIDTH + 16}
          decelerationRate="fast"
        >
          {CHARACTER_LIST.map((char, index) => {
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
                  isSelected && {
                    borderColor: char.accentColor,
                    shadowColor: char.accentColor,
                    backgroundColor: withAlpha(char.accentColor, 0.12),
                  },
                ]}
              >
                {/* Cabecera de la tarjeta */}
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardSlot, isSelected && { color: char.accentColor }]}>
                    OPERADOR 0{index + 1}
                  </Text>
                  {isSelected && (
                    <View style={[styles.activeTag, { backgroundColor: char.accentColor }]}>
                      <CheckCircle2 size={12} color={colors.background} />
                      <Text style={styles.activeTagText}>ACTIVO</Text>
                    </View>
                  )}
                </View>

                {/* Retrato pixel art 32-bit (Relajado vs Seleccionado) */}
                <View style={[styles.portraitContainer, isSelected && { borderColor: char.accentColor }]}>
                  <Image source={cardImg} style={styles.portraitImage} />
                  {isSelected && <View style={[styles.glowBorder, { borderColor: char.accentColor }]} />}
                </View>

                {/* Datos del Agente */}
                <View style={styles.cardInfo}>
                  <Text style={[styles.charName, isSelected && { color: char.accentColor }]}>
                    {char.name.toUpperCase()}
                  </Text>
                  <Text style={styles.charAlias}>"{char.alias}"</Text>
                  <Text style={styles.charRole}>{char.role}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 3. Panel detallado del Agente Seleccionado */}
        <View style={[styles.detailPanel, { borderColor: selectedDef.accentColor }]}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailLabel}>ESPECIFICACIONES TÁCTICAS</Text>
              <Text style={[styles.detailName, { color: selectedDef.accentColor }]}>
                {selectedDef.name} · {selectedDef.role}
              </Text>
            </View>
            <View style={[styles.spriteBox, { borderColor: withAlpha(selectedDef.accentColor, 0.5) }]}>
              <CharacterSprite
                characterId={selectedDef.id}
                action={previewAction}
                isMoving={previewAction === 'down' || previewAction === 'right'}
                isHacking={previewAction === 'hack'}
                size={54}
              />
            </View>
          </View>

          {/* Selector de acción del sprite de prueba */}
          <View style={styles.actionPills}>
            {(['down', 'right', 'hack', 'idle'] as const).map((act) => (
              <Pressable
                key={act}
                onPress={() => setPreviewAction(act)}
                style={[
                  styles.actionPill,
                  previewAction === act && {
                    backgroundColor: selectedDef.accentColor,
                    borderColor: selectedDef.accentColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.actionPillText,
                    previewAction === act && { color: colors.background, fontWeight: '800' },
                  ]}
                >
                  {act.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Descripción / Lore */}
          <Text style={styles.taglineText}>{selectedDef.tagline}</Text>

          {/* Habilidad Pasiva */}
          <View style={[styles.passiveBox, { borderColor: withAlpha(selectedDef.accentColor, 0.35) }]}>
            <View style={styles.passiveTitleRow}>
              <Zap size={14} color={selectedDef.accentColor} />
              <Text style={[styles.passiveTitle, { color: selectedDef.accentColor }]}>
                PASIVA: {selectedDef.passiveName.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.passiveDesc}>{selectedDef.passiveDescription}</Text>
          </View>

          {/* Barras de Atributos */}
          <View style={styles.statsGrid}>
            <StatRow
              label="SIGILO"
              value={selectedDef.stats.stealth}
              color={colors.stealth}
              icon={<Shield size={13} color={colors.stealth} />}
            />
            <StatRow
              label="VELOCIDAD"
              value={selectedDef.stats.speed}
              color={colors.success}
              icon={<Footprints size={13} color={colors.success} />}
            />
            <StatRow
              label="BATERÍA"
              value={selectedDef.stats.battery}
              color={colors.suspicion}
              icon={<Battery size={13} color={colors.suspicion} />}
            />
            <StatRow
              label="HACKEO"
              value={selectedDef.stats.hack}
              color="#BD00FF"
              icon={<Cpu size={13} color="#BD00FF" />}
            />
          </View>
        </View>

        {/* 4. Botón de despliegue a la partida */}
        <Pressable
          onPress={handleConfirmAndDeploy}
          style={[
            styles.deployButton,
            { backgroundColor: selectedDef.accentColor, shadowColor: selectedDef.accentColor },
          ]}
        >
          <Play size={18} color={colors.background} />
          <Text style={styles.deployButtonText}>
            {confirmed ? 'DESPLEGANDO AGENTE...' : `DESPLEGAR CON ${selectedDef.name.toUpperCase()}`}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatRow({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statLabelRow}>
        {icon}
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <View style={styles.statBars}>
        {[1, 2, 3, 4, 5].map((lvl) => (
          <View
            key={lvl}
            style={[
              styles.statSegment,
              lvl <= value
                ? { backgroundColor: color, shadowColor: color, shadowRadius: 3 }
                : { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  arcadeBadge: {
    color: colors.stealth,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  cardsTrack: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  cardBox: {
    backgroundColor: colors.panel,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardSlot: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTagText: {
    color: colors.background,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  portraitContainer: {
    width: '100%',
    height: 280,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#0a0d14',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  portraitImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: 8,
  },
  cardInfo: {
    marginTop: 10,
    alignItems: 'center',
  },
  charName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  charAlias: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  charRole: {
    color: colors.stealth,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  detailPanel: {
    marginHorizontal: 16,
    marginTop: 6,
    backgroundColor: colors.panel,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  detailName: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  spriteBox: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#090c13',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPills: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionPill: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: '#121722',
    alignItems: 'center',
  },
  actionPillText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  taglineText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 12,
  },
  passiveBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#0d111a',
    borderWidth: 1,
  },
  passiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  passiveTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  passiveDesc: {
    color: colors.text,
    fontSize: 11,
    lineHeight: 15,
  },
  statsGrid: {
    marginTop: 14,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  statBars: {
    flexDirection: 'row',
    gap: 4,
  },
  statSegment: {
    width: 20,
    height: 8,
    borderRadius: 2,
  },
  deployButton: {
    marginHorizontal: 16,
    marginTop: 18,
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  deployButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});
