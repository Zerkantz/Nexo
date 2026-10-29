// HUD tactico compacto para vista horizontal:
// Muestra turno, estado de sigilo/alerta, barra de energia, barra de sospecha,
// contadores de progreso del sector (Terminales y Compuertas) y el objetivo paso a paso.
import { StyleSheet, Text, View } from 'react-native';
import { Battery, Crosshair, Cpu, DoorOpen, ShieldAlert } from 'lucide-react-native';
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
 * Guia contextual paso a paso para que el jugador sepa que recurso del mapa necesita utilizar.
 */
function getTacticalObjective(state: SessionState, me: SessionPlayer | undefined): string {
  if (!me) return 'Esperando agente...';
  const totalTerms = state.entities.filter((e) => e.type === 'terminal').length;
  const unhackedTerms = state.entities.filter((e) => e.type === 'terminal' && !e.open).length;
  const closedDoors = state.entities.filter((e) => e.type === 'door' && !e.open).length;

  if (unhackedTerms > 0) {
    if (me.battery < 25) {
      return `1. Bateria baja (${me.battery}%): Ve al Modulo de Energia (+35%) marcado con [OBJ].`;
    }
    return `2. Hackea las Terminales de Datos (${totalTerms - unhackedTerms}/${totalTerms} listas, 25% bat. c/u) marcadas con [OBJ].`;
  }

  if (closedDoors > 0 && me.battery < 25) {
    return `3. Terminales listas: Recoge el Modulo de Energia (+35%) marcado con [OBJ] para abrir la Compuerta (25%).`;
  }

  if (state.roomId === 'sector_1') {
    return '4. Terminales listas: Abre la Compuerta Central (25%) y cruza la Esclusa Morada al Sector 2.';
  }

  return '4. Abre las Compuertas de la Boveda (25% bat.) y pisa la Plataforma de Extraccion [OBJ].';
}

export function Hud({ state, me }: Props) {
  const stateKey = getAlertState(state.alert);
  const alertColor = stateKey === 'STEALTH' ? '#00e699' : getAlertColor(state.alert);
  const batteryPct = me ? Math.min(100, Math.round((me.battery / me.maxBattery) * 100)) : 0;

  const totalTerms = state.entities.filter((e) => e.type === 'terminal').length;
  const hackedTerms = state.entities.filter((e) => e.type === 'terminal' && e.open).length;
  const totalDoors = state.entities.filter(
    (e) => e.type === 'door' && e.id !== 'DOOR_AIRLOCK_S2',
  ).length;
  const openDoors = state.entities.filter(
    (e) => e.type === 'door' && e.id !== 'DOOR_AIRLOCK_S2' && e.open,
  ).length;

  return (
    <View style={[styles.panel, { borderColor: withAlpha(alertColor, 0.45) }]}>
      <View style={styles.row}>
        <Text style={styles.turn}>TURNO {state.turn}</Text>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: withAlpha(alertColor, 0.16),
              borderColor: withAlpha(alertColor, 0.6),
            },
          ]}
        >
          <Text style={[styles.alertLabel, { color: alertColor }]}>
            {alertLabel[stateKey].toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Energia */}
      <View style={styles.barRow}>
        <Battery size={14} color="#00e699" />
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${batteryPct}%`, backgroundColor: '#00e699' }]} />
        </View>
        <Text style={[styles.barValue, { color: '#00e699' }]}>{me?.battery ?? 0}%</Text>
      </View>

      {/* Sospecha / Alerta */}
      <View style={styles.barRow}>
        <ShieldAlert size={14} color={alertColor} />
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${state.alert}%`, backgroundColor: alertColor }]} />
        </View>
        <Text style={[styles.barValue, { color: alertColor }]}>{state.alert}%</Text>
      </View>

      {/* Contadores de progreso del sector */}
      <View style={styles.progressRow}>
        <View
          style={[
            styles.progressChip,
            hackedTerms === totalTerms && totalTerms > 0 && styles.progressChipDone,
          ]}
        >
          <Cpu size={11} color={hackedTerms === totalTerms ? '#00E699' : '#00F0FF'} />
          <Text
            style={[
              styles.progressChipText,
              { color: hackedTerms === totalTerms ? '#00E699' : '#00F0FF' },
            ]}
          >
            TERMINALES: {hackedTerms}/{totalTerms}
          </Text>
        </View>

        <View
          style={[
            styles.progressChip,
            openDoors === totalDoors && totalDoors > 0 && styles.progressChipDone,
          ]}
        >
          <DoorOpen size={11} color={openDoors === totalDoors ? '#00E699' : '#ffcc00'} />
          <Text
            style={[
              styles.progressChipText,
              { color: openDoors === totalDoors ? '#00E699' : '#ffcc00' },
            ]}
          >
            PUERTAS: {openDoors}/{totalDoors}
          </Text>
        </View>
      </View>

      {/* Objetivo tactico dinamico */}
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
    padding: 9,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turn: {
    color: '#e8f0f8',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  alertLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1.1,
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
    fontSize: 10.5,
    fontWeight: '800',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 5,
  },
  progressChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#0a0f16',
    borderWidth: 1,
    borderColor: '#263648',
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  progressChipDone: {
    borderColor: '#00E699',
    backgroundColor: 'rgba(0, 230, 153, 0.1)',
  },
  progressChipText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  hintText: {
    color: '#d8e4f0',
    fontSize: 9.5,
    lineHeight: 12.5,
    fontWeight: '700',
    flex: 1,
  },
});
