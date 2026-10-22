// Modal de victoria o derrota (evento `game:ended`).
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, withAlpha } from '../../theme/colors';
import type { GameEnded } from '../../lib/types';

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
            <Text style={styles.reward}>💳 {result.rewards.credits}</Text>
            <Text style={styles.reward}>⚡ {result.rewards.energy}</Text>
            <Text style={styles.reward}>💾 {result.rewards.intel}</Text>
          </View>

          {result.unlockedSkill && (
            <Text style={styles.unlocked}>Nueva habilidad desbloqueada: {result.unlockedSkill}</Text>
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
    gap: 18,
    marginVertical: 8,
  },
  reward: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
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
