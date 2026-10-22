// Animación de cambio de cuarto / sector táctico
import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, DoorOpen, Shield } from 'lucide-react-native';
import { colors, withAlpha } from '../../theme/colors';

interface Props {
  visible: boolean;
  roomName: string;
  onAnimationComplete?: () => void;
}

export function RoomTransitionOverlay({ visible, roomName, onAnimationComplete }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      scanAnim.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.delay(200),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        onAnimationComplete?.();
      });
    }
  }, [visible, fadeAnim, scanAnim, onAnimationComplete]);

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <DoorOpen size={36} color={colors.stealth} />
        </View>
        <Text style={styles.label}>// COMPUERTA DE ENLACE // </Text>
        <Text style={styles.title}>{roomName.toUpperCase()}</Text>
        <View style={styles.statusRow}>
          <Shield size={14} color={colors.success} />
          <Text style={styles.statusText}>ESCLUSA DESPRESURIZADA · ACCEDIENDO</Text>
          <ArrowRight size={14} color={colors.stealth} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 9, 19, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  content: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
    borderWidth: 1.5,
    borderColor: colors.stealth,
    borderRadius: 16,
    backgroundColor: colors.panelSolid,
    shadowColor: colors.stealth,
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.stealth,
    backgroundColor: withAlpha(colors.stealth, 0.15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.stealth,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
