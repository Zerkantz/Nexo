// Modal de victoria o derrota (evento `game:ended`).
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CreditCard, Database, Sparkles, Zap, type LucideIcon } from 'lucide-react-native';
import { colors, withAlpha } from '../../theme/colors';
import type { GameEnded } from '../../lib/types';

function Reward({ Icon, color, value, label }: { Icon: LucideIcon; color: string; value: number; label: string }) {
  return (
    <View style={styles.rewardItem}>
      <Icon size={22} color={color} />
      <Text style={styles.reward}>{value}</Text>
      <Text style={styles.rewardLabel}>{label}</Text>
    </View>
  );
}

interface Props {
  result: GameEnded | null;
  onBack: () => void;
  /** Opcional (solo demo): volver a jugar */
  onRetry?: () => void;
}

export function ResultModal({ result, onBack, onRetry }: Props) {
  if (!result) return null;
  const won = result.result === 'WON';
  const color = won ? colors.success : colors.danger;

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.backdrop}>
        <View style={[styles.card, { borderColor: color, shadowColor: color }]}>
          <Text style={[styles.title, { color }]}>{won ? 'MISIÓN CUMPLIDA' : 'LOCKDOWN'}</Text>
          <Text style={styles.subtitle}>
            {won ? 'Extracción completada' : 'Te descubrieron. Conservas el 50 % del botín.'}
          </Text>

          <View style={styles.rewards}>
            <Reward Icon={CreditCard} color="#FFD700" value={result.rewards.credits} label="Créditos" />
            <Reward Icon={Zap} color={colors.stealth} value={result.rewards.energy} label="Energía" />
            <Reward Icon={Database} color={colors.success} value={result.rewards.intel} label="Información" />
          </View>

          {result.unlockedSkill && (
            <View style={styles.unlockedRow}>
              <Sparkles size={16} color={colors.stealth} />
              <Text style={styles.unlocked}>Nueva habilidad desbloqueada: {result.unlockedSkill}</Text>
            </View>
          )}

          {onRetry && (
            <Pressable style={[styles.button, { borderColor: colors.textMuted }]} onPress={onRetry}>
              <Text style={[styles.buttonText, { color: colors.text }]}>Reintentar</Text>
            </Pressable>
          )}
          <Pressable style={[styles.button, { borderColor: color, backgroundColor: withAlpha(color, 0.15) }]} onPress={onBack}>
            <Text style={[styles.buttonText, { color }]}>Volver a la base</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 19, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.panelSolid,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 24,
    gap: 12,
    alignItems: 'center',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 3,
  },
  subtitle: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  rewards: {
    flexDirection: 'row',
    gap: 24,
    marginVertical: 8,
  },
  rewardItem: {
    alignItems: 'center',
    gap: 4,
  },
  reward: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  rewardLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  unlockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unlocked: {
    color: colors.stealth,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '800',
    letterSpacing: 1,
  },
});
