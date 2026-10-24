// Cruceta de movimiento + botón Esperar (en el centro) con acabado táctil arcade 15-bit.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Hourglass } from 'lucide-react-native';
import { colors, withAlpha } from '../../theme/colors';
import type { Direction } from '../../lib/types';

interface Props {
  accent: string;
  disabled?: boolean;
  onMove: (dir: Direction) => void;
  onWait: () => void;
}

const BTN = 54;

interface ArrowProps {
  dir: Direction;
  Icon: typeof ChevronUp;
  accent: string;
  disabled?: boolean;
  onMove: (dir: Direction) => void;
}

function ArrowButton({ dir, Icon, accent, disabled, onMove }: ArrowProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => onMove(dir)}
      style={({ pressed }) => [
        styles.btn,
        { borderColor: withAlpha(accent, 0.7) },
        pressed && [styles.btnPressed, { backgroundColor: withAlpha(accent, 0.25) }],
        disabled && styles.disabled,
      ]}
    >
      <Icon size={28} color={accent} />
    </Pressable>
  );
}

export function DPad({ accent, disabled, onMove, onWait }: Props) {
  const common = { accent, disabled, onMove };

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <View style={styles.spacer} />
        <ArrowButton dir="up" Icon={ChevronUp} {...common} />
        <View style={styles.spacer} />
      </View>
      <View style={styles.row}>
        <ArrowButton dir="left" Icon={ChevronLeft} {...common} />
        <Pressable
          disabled={disabled}
          onPress={onWait}
          style={({ pressed }) => [
            styles.btn,
            styles.wait,
            pressed && styles.btnPressed,
            disabled && styles.disabled,
          ]}
        >
          <Hourglass size={16} color={colors.text} />
          <Text style={styles.waitText}>Esperar</Text>
        </Pressable>
        <ArrowButton dir="right" Icon={ChevronRight} {...common} />
      </View>
      <View style={styles.row}>
        <View style={styles.spacer} />
        <ArrowButton dir="down" Icon={ChevronDown} {...common} />
        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 5,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 5,
  },
  spacer: {
    width: BTN,
    height: BTN,
  },
  btn: {
    width: BTN,
    height: BTN,
    borderRadius: 12,
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    backgroundColor: '#151d27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    transform: [{ translateY: 1 }],
  },
  wait: {
    borderColor: '#3d4d60',
    backgroundColor: '#121820',
  },
  waitText: {
    color: '#d0dce8',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  disabled: {
    opacity: 0.35,
  },
});
