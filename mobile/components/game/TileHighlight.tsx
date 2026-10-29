// Marco que parpadea sobre una casilla para señalarla durante el tutorial.
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { withAlpha } from '../../theme/colors';

interface Props {
  left: number;
  top: number;
  size: number;
  color?: string;
}

export function TileHighlight({ left, top, size, color = '#00F0FF' }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const safeColor = color || '#00F0FF';

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.box,
        {
          left,
          top,
          width: size,
          height: size,
          borderColor: safeColor,
          backgroundColor: withAlpha(safeColor, 0.18),
          shadowColor: safeColor,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
});
