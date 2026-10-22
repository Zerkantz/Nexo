// Guía completa "Cómo jugar": explica la idea del juego y todas las mecánicas por grupos.
// Se abre desde el inicio y desde el botón de ayuda durante la partida.
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowRightLeft, RotateCcw, Smartphone, Watch } from 'lucide-react-native';
import { colors, withAlpha } from '../../theme/colors';
import { GROUP_LABEL, TIPS, type TipGroup } from '../../tutorial/tips';
import { TipContent } from './TipContent';

interface Props {
  /** Si se pasa, aparece el botón "Repetir tutorial" */
  onResetTutorial?: () => void;
}

const GROUPS: TipGroup[] = ['intro', 'danger', 'map', 'advanced'];

export function HowToPlayGuide({ onResetTutorial }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Idea central: dos dispositivos */}
      <View style={styles.devices}>
        <View style={styles.device}>
          <Smartphone size={28} color={colors.stealth} />
          <Text style={styles.deviceTitle}>Móvil</Text>
          <Text style={styles.deviceText}>El campo de juego: mueves a tu agente por el mapa.</Text>
        </View>
        <ArrowRightLeft size={20} color={colors.textMuted} />
        <View style={styles.device}>
          <Watch size={28} color={colors.stealth} />
          <Text style={styles.deviceTitle}>Reloj</Text>
          <Text style={styles.deviceText}>Tu herramienta de hacker: habilidades y hackeos.</Text>
        </View>
      </View>

      {GROUPS.map((group) => (
        <View key={group} style={styles.group}>
          <Text style={styles.groupTitle}>{GROUP_LABEL[group].toUpperCase()}</Text>
          {TIPS.filter((t) => t.group === group).map((tip) => (
            <View key={tip.id} style={[styles.card, { borderColor: withAlpha(tip.color, 0.4) }]}>
              <TipContent tip={tip} compact />
            </View>
          ))}
        </View>
      ))}

      {onResetTutorial && (
        <Pressable style={styles.reset} onPress={onResetTutorial}>
          <RotateCcw size={16} color={colors.stealth} />
          <Text style={styles.resetText}>Repetir tutorial en la partida</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 20,
    paddingBottom: 40,
  },
  devices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  device: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
  },
  deviceTitle: {
    color: colors.text,
    fontWeight: '800',
    letterSpacing: 1,
  },
  deviceText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  group: {
    gap: 10,
  },
  groupTitle: {
    color: colors.stealth,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
  },
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  reset: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.stealth,
  },
  resetText: {
    color: colors.stealth,
    fontWeight: '700',
  },
});
