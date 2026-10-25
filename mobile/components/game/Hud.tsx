// HUD táctico compacto para vista horizontal:
// Muestra turno, estado de sigilo/alerta, barra de energía, barra de sospecha y
// el objetivo táctico actual según los recursos restantes del sector.
import { StyleSheet, Text, View } from 'react-native';
import { Battery, Crosshair, ShieldAlert } from 'lucide-react-native';
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

/**
 * Guía contextual paso a paso para que el jugador sepa qué recurso del mapa necesita utilizar.
 */
function getTacticalObjective(state: SessionState, me: SessionPlayer | undefined): string {
  if (!me) return 'Esperando agente...';
  const unhackedTerm = state.entities.find((e) => e.type === 'terminal' && !e.open);
  const closedDoors = state.entities.filter((e) => e.type === 'door' && !e.open);

  if (unhackedTerm) {
    if (me.battery < 25) {
      return '1. Recoge un Módulo de Energía (+40%) para poder hackear la Terminal.';
    }
    return '2. Ve a la Terminal de Datos (25% bat.) para desbloquear compuertas y apagar cámaras.';
  }

  if (closedDoors.length > 0 && me.battery < 25) {
    return '3. Recoge el otro Módulo de Energía (+40%) para abrir la siguiente Compuerta (25% bat.).';
  }

  if (state.roomId === 'sector_1') {
    return '4. Abre la Compuerta y cruza la Puerta Morada hacia el Sector 2.';
  }

  return '4. Abre la Compuerta Final y llega a la Plataforma de Extracción.';
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

      {/* Objetivo táctico dinámico */}
      <View style={styles.hint}>
        <Crosshair size={13} color="#ffcc00" />
        <Text style={styles.hintText} numberOfLines={3}>
          {getTacticalObjective(state, me)}
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
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  hintText: {
    color: '#d8e4f0',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    flex: 1,
  },
});
