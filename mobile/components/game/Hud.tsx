// HUD: turno, batería, alerta (cambia de color) y aviso de lo que hay que hacer en el reloj.
import { StyleSheet, Text, View } from 'react-native';
import { Battery, ShieldAlert, Watch } from 'lucide-react-native';
import {
  alertLabel,
  colors,
  getAlertColor,
  getAlertState,
  withAlpha,
} from '../../theme/colors';
import type { SessionPlayer, SessionState } from '../../lib/types';

interface Props {
  state: SessionState;
  me: SessionPlayer | undefined;
}

/**
 * Texto de ayuda sobre el reloj. Solo es visual: el servidor decide si de verdad
 * se puede hackear (y se lo dice al reloj con `watch:context`).
 */
function getWatchHint(state: SessionState, me: SessionPlayer | undefined): string {
  if (!me) return 'Esperando jugador...';
  const near = state.entities.find(
    (e) =>
      (e.type === 'door' || e.type === 'dual_door' || e.type === 'terminal') &&
      !e.open &&
      Math.abs(e.x - me.x) + Math.abs(e.y - me.y) === 1,
  );
  if (near?.type === 'terminal') return 'Terminal cerca: usa HACKEAR en tu reloj para extraer datos';
  if (near) return 'Puerta bloqueada: usa HACKEAR en tu reloj para abrirla';
  if (getAlertState(state.alert) === 'SUSPICION') return '¡Te están buscando! Usa CAMUFLAJE en tu reloj';
  return 'Reloj listo · Escáner, Sabotaje y Camuflaje disponibles';
}

export function Hud({ state, me }: Props) {
  const alertColor = getAlertColor(state.alert);
  const batteryPct = me ? Math.round((me.battery / me.maxBattery) * 100) : 0;

  return (
    <View style={[styles.panel, { borderColor: withAlpha(alertColor, 0.6) }]}>
      <View style={styles.row}>
        <Text style={styles.turn}>TURNO {state.turn}</Text>
        <Text style={[styles.alertLabel, { color: alertColor }]}>
          {alertLabel[getAlertState(state.alert)].toUpperCase()}
        </Text>
      </View>

      {/* Batería */}
      <View style={styles.barRow}>
        <Battery size={16} color={colors.stealth} />
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${batteryPct}%`, backgroundColor: colors.stealth }]} />
        </View>
        <Text style={styles.barValue}>
          {me?.battery ?? 0}/{me?.maxBattery ?? 0}%
        </Text>
      </View>

      {/* Alerta */}
      <View style={styles.barRow}>
        <ShieldAlert size={16} color={alertColor} />
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${state.alert}%`, backgroundColor: alertColor }]} />
        </View>
        <Text style={[styles.barValue, { color: alertColor }]}>{state.alert}%</Text>
      </View>

      {/* Aviso del reloj */}
      <View style={styles.hint}>
        <Watch size={14} color={colors.textMuted} />
        <Text style={styles.hintText}>{getWatchHint(state, me)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  turn: {
    color: colors.text,
    fontWeight: '700',
    letterSpacing: 2,
  },
  alertLabel: {
    fontWeight: '800',
    letterSpacing: 2,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barValue: {
    color: colors.stealth,
    fontVariant: ['tabular-nums'],
    minWidth: 64,
    textAlign: 'right',
    fontSize: 12,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 12,
    flex: 1,
  },
});
