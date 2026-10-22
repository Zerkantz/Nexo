// Contenido de una carta (ícono, título, texto y leyenda). Se usa en la carta del
// tutorial durante la partida y en la guía "Cómo jugar".
import { StyleSheet, Text, View } from 'react-native';
import { colors, withAlpha } from '../../theme/colors';
import type { Tip } from '../../tutorial/tips';

interface Props {
  tip: Tip;
  tag?: string;
  compact?: boolean;
}

export function TipContent({ tip, tag, compact }: Props) {
  const Icon = tip.icon;
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconCircle,
            { borderColor: tip.color, backgroundColor: withAlpha(tip.color, 0.14), shadowColor: tip.color },
          ]}
        >
          <Icon size={compact ? 20 : 24} color={tip.color} />
        </View>
        <View style={styles.headerText}>
          {tag && <Text style={[styles.tag, { color: tip.color }]}>{tag}</Text>}
          <Text style={styles.title}>{tip.title}</Text>
        </View>
      </View>

      <Text style={styles.body}>{tip.body}</Text>

      {tip.legend && tip.legend.length > 0 && (
        <View style={styles.legend}>
          {tip.legend.map((item, i) => {
            const LegendIcon = item.icon;
            return (
              <View key={i} style={styles.legendRow}>
                {LegendIcon ? (
                  <LegendIcon size={16} color={item.color} />
                ) : (
                  <View
                    style={[
                      styles.swatch,
                      { backgroundColor: withAlpha(item.swatch ?? item.color, 0.35), borderColor: item.color },
                    ]}
                  />
                )}
                <Text style={styles.legendText}>{item.text}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  headerText: {
    flex: 1,
  },
  tag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  body: {
    color: colors.text,
    opacity: 0.85,
    fontSize: 14,
    lineHeight: 20,
  },
  legend: {
    gap: 6,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 13,
    flex: 1,
  },
});
