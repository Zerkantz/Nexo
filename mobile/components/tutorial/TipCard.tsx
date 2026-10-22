// Carta de alerta del tutorial. Aparece flotando sobre la cruceta (el juego queda en pausa
// mientras está visible) y deja ver el tablero, donde parpadean las casillas que explica.
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, withAlpha } from '../../theme/colors';
import { INTRO_TIPS, type Tip } from '../../tutorial/tips';
import { TipContent } from './TipContent';

interface Props {
  tip: Tip;
  hasMore: boolean;
  onNext: () => void;
  onSkip: () => void;
}

const useNative = Platform.OS !== 'web';

export function TipCard({ tip, hasMore, onNext, onSkip }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  // Animación de entrada cada vez que cambia la carta
  useEffect(() => {
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: useNative, friction: 7, tension: 60 }).start();
  }, [tip.id, anim]);

  const introIndex = INTRO_TIPS.findIndex((t) => t.id === tip.id);
  const isIntro = introIndex >= 0;
  const tag = isIntro ? `TUTORIAL ${introIndex + 1}/${INTRO_TIPS.length}` : 'NUEVA MECÁNICA';

  return (
    <Animated.View
      style={[
        styles.card,
        {
          borderColor: tip.color,
          shadowColor: tip.color,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        },
      ]}
    >
      {/* Línea de acento superior */}
      <View style={[styles.accentBar, { backgroundColor: tip.color }]} />

      <TipContent tip={tip} tag={tag} />

      {isIntro && (
        <View style={styles.dots}>
          {INTRO_TIPS.map((t, i) => (
            <View
              key={t.id}
              style={[
                styles.dot,
                { backgroundColor: i <= introIndex ? tip.color : 'rgba(255,255,255,0.15)' },
                i === introIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Pressable onPress={onSkip} hitSlop={8}>
          <Text style={styles.skip}>{isIntro ? 'Saltar tutorial' : 'Ocultar consejos'}</Text>
        </Pressable>
        <Pressable
          onPress={onNext}
          style={({ pressed }) => [
            styles.primary,
            { borderColor: tip.color, backgroundColor: withAlpha(tip.color, pressed ? 0.3 : 0.15) },
          ]}
        >
          <Text style={[styles.primaryText, { color: tip.color }]}>{hasMore ? 'Siguiente' : 'Entendido'}</Text>
          <ChevronRight size={18} color={tip.color} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panelSolid,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    paddingTop: 18,
    gap: 12,
    overflow: 'hidden',
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skip: {
    color: colors.textMuted,
    fontSize: 13,
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingLeft: 18,
    paddingRight: 12,
  },
  primaryText: {
    fontWeight: '800',
    letterSpacing: 1,
  },
});
