// Cruceta de movimiento + botón Esperar (en el centro).
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

const BTN = 58;

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
        { borderColor: withAlpha(accent, 0.6) },
        pressed && { backgroundColor: withAlpha(accent, 0.25) },
        disabled && styles.disabled,
      ]}
    >
      <Icon size={30} color={accent} />
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
            pressed && { backgroundColor: 'rgba(255,255,255,0.12)' },
            disabled && styles.disabled,
          ]}
        >
          <Hourglass size={18} color={colors.text} />
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
    gap: 6,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  spacer: {
    width: BTN,
    height: BTN,
  },
  btn: {
    width: BTN,
    height: BTN,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wait: {
    borderColor: 'rgba(255,255,255,0.25)',
  },
  waitText: {
    color: colors.text,
    fontSize: 10,
    marginTop: 2,
  },
  disabled: {
    opacity: 0.35,
  },
});
