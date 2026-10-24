// HUD táctico compacto para vista horizontal:
// Muestra turno, estado de sigilo/alerta, barra de energía, barra de sospecha y estado del reloj.
import { StyleSheet, Text, View } from 'react-native';
import { Battery, ShieldAlert, Watch } from 'lucide-react-native';
import {
  alertLabel,
  getAlertColor,
  getAlertState,
  withAlpha,
} from '../../theme/colors';
import type { SessionPlayer, SessionState } from '../../lib/types';

interface Props {
  state: SessionState;
  me: SessionPlayer | undefined;
}

function getWatchHint(state: SessionState, me: SessionPlayer | undefined): string {
  if (!me) return 'Esperando jugador...';
  const near = state.entities.find(
    (e) =>
      (e.type === 'door' || e.type === 'dual_door' || e.type === 'terminal') &&
      !e.open &&
      Math.abs(e.x - me.x) + Math.abs(e.y - me.y) === 1,
  );
  if (near?.type === 'terminal') return 'Terminal cerca: usa HACKEAR en tu reloj';
  if (near) return 'Puerta cerca: usa HACKEAR en tu reloj';
  if (getAlertState(state.alert) === 'SUSPICION') return 'En alerta: usa CAMUFLAJE en tu reloj';
  return 'Reloj listo: Escáner, Sabotaje y Camuflaje';
}

export function Hud({ state, me }: Props) {
  const stateKey = getAlertState(state.alert);
  const alertColor = stateKey === 'STEALTH' ? '#00e699' : getAlertColor(state.alert);
  const batteryPct = me ? Math.round((me.battery / me.maxBattery) * 100) : 0;

  return (
    <View style={[styles.panel, { borderColor: withAlpha(alertColor, 0.45) }]}>
      <View style={styles.row}>
        <Text style={styles.turn}>TURNO {state.turn}</Text>
        <View style={[styles.statusPill, { backgroundColor: withAlpha(alertColor, 0.16), borderColor: withAlpha(alertColor, 0.6) }]}>
          <Text style={[styles.alertLabel, { color: alertColor }]}>
            {alertLabel[stateKey].toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Energía */}
      <View style={styles.barRow}>
        <Battery size={14} color="#00e699" />
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${batteryPct}%`, backgroundColor: '#00e699' }]} />
        </View>
        <Text style={[styles.barValue, { color: '#00e699' }]}>
          {me?.battery ?? 0}%
        </Text>
      </View>

      {/* Sospecha / Alerta */}
      <View style={styles.barRow}>
        <ShieldAlert size={14} color={alertColor} />
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${state.alert}%`, backgroundColor: alertColor }]} />
        </View>
        <Text style={[styles.barValue, { color: alertColor }]}>{state.alert}%</Text>
      </View>

      {/* Aviso del reloj */}
      <View style={styles.hint}>
        <Watch size={13} color="#96a8bc" />
        <Text style={styles.hintText} numberOfLines={2}>
          {getWatchHint(state, me)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#131a23',
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 10,
    gap: 7,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turn: {
    color: '#e8f0f8',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  alertLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barTrack: {
    flex: 1,
    height: 7,
    borderRadius: 3,
    backgroundColor: '#0a0e14',
    borderWidth: 1,
    borderColor: '#253242',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  barValue: {
    fontVariant: ['tabular-nums'],
    minWidth: 36,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '800',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  hintText: {
    color: '#96a8bc',
    fontSize: 10,
    lineHeight: 13,
    flex: 1,
  },
});
