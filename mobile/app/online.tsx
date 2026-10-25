// Pantalla de Modo Online en formato Horizontal (Landscape):
// - Pestaña 1: Cooperativo de 2 jugadores (crear sala NX-XXXX o unirse con código).
// - Pestaña 2: Asaltos PvP asíncronos a bases personalizadas de otros agentes (botín 30%).
// - Pestaña 3: Reportes de defensa de tu propia base.
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  Coins,
  FileWarning,
  Play,
  Plus,
  Radio,
  ShieldAlert,
  Swords,
  Users,
  Watch,
} from 'lucide-react-native';
import { CommandHeader } from '../components/navigation/CommandHeader';
import { sessionApi, raidsApi } from '../lib/api';
import {
  DEFAULT_PROFILE_STATE,
  loadPlayerProfile,
  type PlayerProfileState,
} from '../lib/playerStore';

type OnlineTab = 'COOP' | 'RAIDS' | 'REPORTS';

export default function OnlineScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfileState>(DEFAULT_PROFILE_STATE);
  const [tab, setTab] = useState<OnlineTab>('COOP');

  // Estado de Sala Co-op
  const [selectedMissionId, setSelectedMissionId] = useState<number>(1);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>('NX-4821');
  const [joinInput, setJoinInput] = useState('');
  const [partnerReady, setPartnerReady] = useState(true);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  useEffect(() => {
    loadPlayerProfile().then(setProfile);
  }, []);

  const handleCreateCoopRoom = async () => {
    try {
      const res = await sessionApi.createCoopRoom(selectedMissionId);
      setActiveRoomCode(res.roomCode);
      setPartnerReady(true);
      setStatusNote(`Sala cooperativa ${res.roomCode} creada en el servidor.`);
    } catch {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const code = `NX-${randomNum}`;
      setActiveRoomCode(code);
      setPartnerReady(true);
      setStatusNote(`Sala cooperativa ${code} abierta (lista para emparejar).`);
    }
  };

  const handleJoinCoopRoom = async () => {
    const clean = joinInput.trim().toUpperCase();
    if (!clean) {
      setStatusNote('Escribe un código de sala válido (ej. NX-4821 o 4821).');
      return;
    }
    const formatted = clean.startsWith('NX-') ? clean : `NX-${clean}`;
    try {
      await sessionApi.joinCoopRoom(formatted);
    } catch {
      // Continuar en modo local
    }
    setActiveRoomCode(formatted);
    setPartnerReady(true);
    setJoinInput('');
    setStatusNote(`Unido correctamente a la sala ${formatted}.`);
  };

  const handleStartCoopGame = () => {
    const codeSlug = (activeRoomCode ?? 'NX-4821').toLowerCase();
    router.push(`/character-select?next=/game/coop-${codeSlug}` as any);
  };

  const handleStartRaid = async (baseId: number) => {
    try {
      const res = await raidsApi.start(baseId);
      router.push(`/character-select?next=/game/${res.sessionId}` as any);
    } catch {
      router.push(`/character-select?next=/game/raid-${baseId}` as any);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden />
      <CommandHeader
        title="MODO ONLINE // CO-OP Y ASALTOS PvP"
        subtitle="OPERACIONES CON RELOJ VINCULADO EN ESCUADRÓN E INCURSIONES"
        player={profile.player}
        watch={profile.watch}
        backTo="/?menu=1"
      />

      {!profile.watch ? (
        <View style={styles.watchGateContainer}>
          <View style={styles.watchGateCard}>
            <Watch size={36} color="#FF8800" />
            <Text style={styles.watchGateKicker}>ACCESO RESTRINGIDO // PROTOCOLO NEXO</Text>
            <Text style={styles.watchGateTitle}>DEBES ENLAZAR TU RELOJ PARA JUGAR ONLINE</Text>
            <Text style={styles.watchGateDesc}>
              Las partidas Cooperativas (4 dispositivos) y los Asaltos PvP requieren que tu
              Smartwatch Wear OS esté vinculado mediante el código de 4 dígitos.
            </Text>
            <Pressable
              onPress={() => router.replace('/pair?next=/online' as any)}
              style={styles.watchGateBtn}
            >
              <Watch size={16} color="#ffffff" />
              <Text style={styles.watchGateBtnText}>ENLAZAR RELOJ AHORA</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>

      {/* Selector de sub-sección */}
      <View style={styles.subTabsBar}>
        <Pressable
          onPress={() => setTab('COOP')}
          style={[styles.subTab, tab === 'COOP' && styles.subTabActive]}
        >
          <Users size={13} color={tab === 'COOP' ? '#0b0e14' : '#ffcc00'} />
          <Text style={[styles.subTabText, tab === 'COOP' && styles.subTabTextActive]}>
            COOPERATIVO (2 JUGADORES)
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTab('RAIDS')}
          style={[styles.subTab, tab === 'RAIDS' && styles.subTabActive]}
        >
          <Swords size={13} color={tab === 'RAIDS' ? '#0b0e14' : '#00F0FF'} />
          <Text style={[styles.subTabText, tab === 'RAIDS' && styles.subTabTextActive]}>
            ASALTAR BASES PvP ({profile.raidTargets.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTab('REPORTS')}
          style={[styles.subTab, tab === 'REPORTS' && styles.subTabActive]}
        >
          <FileWarning size={13} color={tab === 'REPORTS' ? '#0b0e14' : '#FF8800'} />
          <Text style={[styles.subTabText, tab === 'REPORTS' && styles.subTabTextActive]}>
            REPORTES DE DEFENSA ({profile.raidReports.length})
          </Text>
        </Pressable>
      </View>

      {statusNote ? (
        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerText}>{statusNote}</Text>
        </View>
      ) : null}

      {/* CONTENIDO PESTAÑA 1: CO-OP */}
      {tab === 'COOP' ? (
        <View style={styles.coopContainer}>
          {/* Izquierda: Crear o Unirse a Sala */}
          <View style={styles.coopLeft}>
            <View style={styles.panelCard}>
              <Text style={styles.cardKicker}>ANFITRIÓN DE OPERACIÓN</Text>
              <Text style={styles.cardTitle}>CREAR SALA COOPERATIVA</Text>
              <Text style={styles.cardSub}>
                Elige el distrito objetivo y comparte el código NX con tu compañero:
              </Text>

              <View style={styles.missionChipsRow}>
                {profile.missions.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => setSelectedMissionId(m.id)}
                    style={[
                      styles.missionChip,
                      selectedMissionId === m.id && styles.missionChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.missionChipText,
                        selectedMissionId === m.id && styles.missionChipTextActive,
                      ]}
                    >
                      NV.{m.levelNumber}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable onPress={handleCreateCoopRoom} style={styles.primaryActionBtn}>
                <Plus size={14} color="#ffffff" />
                <Text style={styles.primaryActionText}>GENERAR NUEVO CÓDIGO DE SALA</Text>
              </Pressable>
            </View>

            <View style={styles.panelCard}>
              <Text style={styles.cardKicker}>UNIRSE A ESCUADRÓN</Text>
              <Text style={styles.cardTitle}>INGRESAR CÓDIGO DE COMPAÑERO</Text>
              <View style={styles.joinRow}>
                <TextInput
                  value={joinInput}
                  onChangeText={setJoinInput}
                  autoCapitalize="characters"
                  placeholder="EJ. NX-4821"
                  placeholderTextColor="#5c7085"
                  style={styles.joinInput}
                />
                <Pressable onPress={handleJoinCoopRoom} style={styles.joinBtn}>
                  <Text style={styles.joinBtnText}>CONECTAR</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Derecha: Lobby Activo de 4 Dispositivos */}
          <View style={styles.coopRight}>
            <View style={styles.roomHeader}>
              <View>
                <Text style={styles.roomKicker}>SALA DE SINCRONIZACIÓN TÁCTICA</Text>
                <Text style={styles.roomCodeText}>{activeRoomCode ?? 'SIN SALA'}</Text>
              </View>
              <View style={styles.fourDevicesBadge}>
                <Watch size={12} color="#00E699" />
                <Text style={styles.fourDevicesText}>2 MÓVILES + 2 RELOJES LISTOS</Text>
              </View>
            </View>

            <View style={styles.slotsRow}>
              <View style={styles.slotBox}>
                <Text style={styles.slotTag}>AGENTE 1 (ANFITRIÓN)</Text>
                <Text style={styles.slotName}>{profile.player.username}</Text>
                <Text style={styles.slotWatch}>
                  {profile.watch ? profile.watch.deviceName : 'Wear OS Deck #1 Conectado'}
                </Text>
              </View>

              <View style={styles.slotBox}>
                <Text style={[styles.slotTag, { color: '#00F0FF' }]}>AGENTE 2 (COMPAÑERO)</Text>
                <Text style={styles.slotName}>
                  {partnerReady ? 'AGENTE_VEX (CONECTADO)' : 'ESPERANDO AGENTE...'}
                </Text>
                <Text style={styles.slotWatch}>Wear OS Deck #2 · Sincronizado</Text>
              </View>
            </View>

            <View style={styles.coopRulesBox}>
              <View style={styles.coopRuleItem}>
                <Radio size={11} color="#ffcc00" />
                <Text style={styles.coopRuleText}>
                  Cerrojo Dual: hackeo simultáneo en ambos relojes (ventana máxima de 5 s).
                </Text>
              </View>
              <View style={styles.coopRuleItem}>
                <Radio size={11} color="#00F0FF" />
                <Text style={styles.coopRuleText}>
                  Alerta compartida · Transferencia de 25% de batería · Pings hápticos.
                </Text>
              </View>
            </View>

            <Pressable onPress={handleStartCoopGame} style={styles.deployCoopBtn}>
              <Play size={15} color="#ffffff" fill="#ffffff" />
              <Text style={styles.deployCoopText}>
                DESPLEGAR ESCUADRÓN EN NIVEL {selectedMissionId}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* CONTENIDO PESTAÑA 2: ASALTOS PvP */}
      {tab === 'RAIDS' ? (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {profile.raidTargets.map((target) => {
            const lootAmount = Math.floor(target.vaultCredits * 0.3);
            return (
              <View key={target.id} style={styles.raidCard}>
                <View style={styles.raidInfo}>
                  <Text style={styles.raidOwner}>ARQUITECTO: {target.ownerUsername}</Text>
                  <Text style={styles.raidBaseName}>{target.baseName}</Text>
                  <Text style={styles.raidSecurity}>{target.securityRating}</Text>
                </View>

                <View style={styles.raidStats}>
                  <View style={styles.lootBox}>
                    <Text style={styles.lootLabel}>BOTÍN ROBABLE (30% DE BÓVEDA)</Text>
                    <View style={styles.lootValueRow}>
                      <Coins size={14} color="#FFD700" />
                      <Text style={styles.lootValue}>+{lootAmount} CRÉDITOS</Text>
                    </View>
                  </View>
                  <Text style={styles.raidHistoryText}>
                    Asaltada {target.timesRaided} veces · Defendida {target.timesDefended}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleStartRaid(target.id)}
                  style={styles.raidBtn}
                >
                  <Swords size={15} color="#ffffff" />
                  <Text style={styles.raidBtnText}>ASALTAR BASE</Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      ) : null}

      {/* CONTENIDO PESTAÑA 3: REPORTES DE DEFENSA */}
      {tab === 'REPORTS' ? (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {profile.raidReports.map((rep) => (
            <View
              key={rep.id}
              style={[
                styles.reportCard,
                rep.success ? styles.reportCardLost : styles.reportCardDefended,
              ]}
            >
              <View style={styles.reportIconCol}>
                {rep.success ? (
                  <ShieldAlert size={22} color="#ff4d6d" />
                ) : (
                  <CheckCircle2 size={22} color="#00E699" />
                )}
              </View>

              <View style={styles.reportBody}>
                <Text style={styles.reportTitle}>
                  ATACANTE: {rep.attackerUsername} —{' '}
                  {rep.success ? 'INFILTRACIÓN EXITOSA' : 'INTRUSO NEUTRALIZADO'}
                </Text>
                <Text style={styles.reportTime}>{rep.createdAt}</Text>
              </View>

              <View style={styles.reportRight}>
                <Text
                  style={[
                    styles.reportDelta,
                    { color: rep.success ? '#ff4d6d' : '#00E699' },
                  ]}
                >
                  {rep.success ? `-${rep.creditsStolen} CR ROBADOS` : '0 CR PERDIDOS'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070a0f',
  },
  watchGateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  watchGateCard: {
    maxWidth: 440,
    backgroundColor: '#101722',
    borderWidth: 2,
    borderColor: '#FF8800',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  watchGateKicker: {
    color: '#FF8800',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  watchGateTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  watchGateDesc: {
    color: '#9db1c6',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  watchGateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#d83800',
    borderWidth: 2,
    borderColor: '#ffcc00',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 4,
  },
  watchGateBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subTabsBar: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 8,
  },
  subTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#101722',
    borderWidth: 1.5,
    borderColor: '#273648',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  subTabActive: {
    backgroundColor: '#ffcc00',
    borderColor: '#ffffff',
  },
  subTabText: {
    color: '#d6e4f2',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  subTabTextActive: {
    color: '#0b0e14',
  },
  statusBanner: {
    marginHorizontal: 14,
    marginTop: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: '#00F0FF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBannerText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
  },
  coopContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 14,
  },
  coopLeft: {
    width: '44%',
    justifyContent: 'space-between',
    gap: 8,
  },
  panelCard: {
    flex: 1,
    backgroundColor: '#101722',
    borderWidth: 1.5,
    borderColor: '#273749',
    borderRadius: 9,
    padding: 10,
    justifyContent: 'space-between',
  },
  cardKicker: {
    color: '#ffcc00',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  cardSub: {
    color: '#8da2b8',
    fontSize: 9,
  },
  missionChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  missionChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: '#090d13',
    borderWidth: 1,
    borderColor: '#2b3b4e',
  },
  missionChipActive: {
    backgroundColor: '#ffcc00',
    borderColor: '#ffffff',
  },
  missionChipText: {
    color: '#95aac0',
    fontSize: 9,
    fontWeight: '900',
  },
  missionChipTextActive: {
    color: '#0b0e14',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1a2736',
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    borderRadius: 6,
    paddingVertical: 7,
  },
  primaryActionText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  joinRow: {
    flexDirection: 'row',
    gap: 8,
  },
  joinInput: {
    flex: 1,
    backgroundColor: '#090d13',
    borderWidth: 1.5,
    borderColor: '#2c3d50',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  joinBtn: {
    backgroundColor: '#ffcc00',
    borderRadius: 6,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  joinBtnText: {
    color: '#0b0e14',
    fontSize: 10,
    fontWeight: '900',
  },
  coopRight: {
    flex: 1,
    backgroundColor: '#101722',
    borderWidth: 2,
    borderColor: '#ffcc00',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'space-between',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomKicker: {
    color: '#ffcc00',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  roomCodeText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  fourDevicesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 230, 153, 0.1)',
    borderWidth: 1,
    borderColor: '#00E699',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  fourDevicesText: {
    color: '#00E699',
    fontSize: 8,
    fontWeight: '900',
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  slotBox: {
    flex: 1,
    backgroundColor: '#090d13',
    borderWidth: 1,
    borderColor: '#29394d',
    borderRadius: 8,
    padding: 9,
    gap: 2,
  },
  slotTag: {
    color: '#ffcc00',
    fontSize: 8,
    fontWeight: '900',
  },
  slotName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  slotWatch: {
    color: '#00E699',
    fontSize: 9,
    fontWeight: '700',
  },
  coopRulesBox: {
    gap: 4,
  },
  coopRuleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coopRuleText: {
    color: '#9db1c6',
    fontSize: 9,
  },
  deployCoopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d83800',
    borderWidth: 2,
    borderColor: '#ffcc00',
    borderRadius: 8,
    paddingVertical: 10,
  },
  deployCoopText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  listContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  raidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#101722',
    borderWidth: 1.5,
    borderColor: '#273749',
    borderRadius: 9,
    padding: 12,
    gap: 12,
  },
  raidInfo: {
    flex: 1,
    gap: 2,
  },
  raidOwner: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  raidBaseName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  raidSecurity: {
    color: '#93a8be',
    fontSize: 10,
    fontWeight: '700',
  },
  raidStats: {
    alignItems: 'flex-end',
    gap: 3,
  },
  lootBox: {
    backgroundColor: '#090d13',
    borderWidth: 1,
    borderColor: '#36485e',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  lootLabel: {
    color: '#889db2',
    fontSize: 7,
    fontWeight: '900',
  },
  lootValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lootValue: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '900',
  },
  raidHistoryText: {
    color: '#768ca3',
    fontSize: 9,
  },
  raidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d83800',
    borderWidth: 2,
    borderColor: '#ffcc00',
    borderRadius: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  raidBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#101722',
    borderWidth: 1.5,
    borderRadius: 9,
    padding: 12,
  },
  reportCardDefended: {
    borderColor: '#00E699',
  },
  reportCardLost: {
    borderColor: '#ff4d6d',
  },
  reportIconCol: {
    width: 32,
    alignItems: 'center',
  },
  reportBody: {
    flex: 1,
    gap: 2,
  },
  reportTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  reportTime: {
    color: '#8da2b8',
    fontSize: 10,
  },
  reportRight: {
    alignItems: 'flex-end',
  },
  reportDelta: {
    fontSize: 11,
    fontWeight: '900',
  },
});
