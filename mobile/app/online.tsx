// Pantalla de Modo Online simplificada y suave (Landscape):
// - Cooperativo (2 jugadores): crear sala o unirse con código de forma directa.
// - Asaltar Bases: lista limpia de bases de otros jugadores y el botín disponible.
// - Defensas: historial claro de incursiones recibidas en tu base.
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
  const [activeRoomCode, setActiveRoomCode] = useState<string>('NX-4821');
  const [joinInput, setJoinInput] = useState('');
  const [isHost, setIsHost] = useState(true);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  useEffect(() => {
    loadPlayerProfile().then(setProfile);
  }, []);

  const handleCreateCoopRoom = async () => {
    setIsHost(true);
    try {
      const res = await sessionApi.createCoopRoom(selectedMissionId);
      setActiveRoomCode(res.roomCode);
      setStatusNote(`Sala ${res.roomCode} creada. Eres Jugador 1 (Anfitrión).`);
    } catch {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const code = `NX-${randomNum}`;
      setActiveRoomCode(code);
      setStatusNote(`Sala ${code} lista. Eres Jugador 1 (Anfitrión).`);
    }
  };

  const handleJoinCoopRoom = async () => {
    const clean = joinInput.trim().toUpperCase();
    if (!clean) {
      setStatusNote('Ingresa un código de sala (ej. NX-4821).');
      return;
    }
    const formatted = clean.startsWith('NX-') ? clean : `NX-${clean}`;
    setIsHost(false);
    try {
      await sessionApi.joinCoopRoom(formatted);
    } catch {
      // Continuar en modo local
    }
    setActiveRoomCode(formatted);
    setJoinInput('');
    setStatusNote(`Conectado a la sala ${formatted} como Jugador 2 (Invitado).`);
  };

  const handleStartCoopGame = () => {
    const codeSlug = activeRoomCode.toLowerCase();
    const slot = isHost ? 1 : 2;
    router.push(`/character-select?next=/game/coop-${codeSlug}?slot=${slot}` as any);
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
        title="Modo Online"
        player={profile.player}
        watch={profile.watch}
        backTo="/?menu=1"
      />

      {!profile.watch ? (
        <View style={styles.watchGateContainer}>
          <View style={styles.watchGateCard}>
            <View style={styles.watchIconCircle}>
              <Watch size={32} color="#FF9E44" />
            </View>
            <Text style={styles.watchGateTitle}>Enlaza tu reloj para jugar Online</Text>
            <Text style={styles.watchGateDesc}>
              El modo cooperativo y los asaltos requieren que tu Smartwatch esté vinculado.
            </Text>
            <Pressable
              onPress={() => router.replace('/pair?next=/online' as any)}
              style={styles.watchGateBtn}
            >
              <Watch size={16} color="#090d14" />
              <Text style={styles.watchGateBtnText}>Enlazar Reloj</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          {/* Barra superior de pestañas limpia */}
          <View style={styles.topBar}>
            <View style={styles.tabsRow}>
              <Pressable
                onPress={() => setTab('COOP')}
                style={[styles.tabBtn, tab === 'COOP' && styles.tabBtnActive]}
              >
                <Users size={15} color={tab === 'COOP' ? '#090d14' : '#94a3b8'} />
                <Text style={[styles.tabBtnText, tab === 'COOP' && styles.tabBtnTextActive]}>
                  Cooperativo
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setTab('RAIDS')}
                style={[styles.tabBtn, tab === 'RAIDS' && styles.tabBtnActive]}
              >
                <Swords size={15} color={tab === 'RAIDS' ? '#090d14' : '#94a3b8'} />
                <Text style={[styles.tabBtnText, tab === 'RAIDS' && styles.tabBtnTextActive]}>
                  Asaltar Bases ({profile.raidTargets.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setTab('REPORTS')}
                style={[styles.tabBtn, tab === 'REPORTS' && styles.tabBtnActive]}
              >
                <FileWarning size={15} color={tab === 'REPORTS' ? '#090d14' : '#94a3b8'} />
                <Text style={[styles.tabBtnText, tab === 'REPORTS' && styles.tabBtnTextActive]}>
                  Defensas ({profile.raidReports.length})
                </Text>
              </Pressable>
            </View>

            {statusNote ? <Text style={styles.statusToast}>{statusNote}</Text> : null}
          </View>

          {/* PESTAÑA 1: COOPERATIVO */}
          {tab === 'COOP' ? (
            <View style={styles.coopContainer}>
              {/* Izquierda: Crear o Unirse */}
              <View style={styles.coopLeft}>
                <View style={styles.softCard}>
                  <Text style={styles.cardTitle}>Crear Sala</Text>
                  <Text style={styles.cardHint}>Elige el nivel para jugar en pareja:</Text>

                  <View style={styles.missionChipsRow}>
                    {profile.missions.map((m) => {
                      const active = selectedMissionId === m.id;
                      return (
                        <Pressable
                          key={m.id}
                          onPress={() => setSelectedMissionId(m.id)}
                          style={[styles.missionChip, active && styles.missionChipActive]}
                        >
                          <Text
                            style={[
                              styles.missionChipText,
                              active && styles.missionChipTextActive,
                            ]}
                          >
                            Nv.{m.levelNumber}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable onPress={handleCreateCoopRoom} style={styles.secondaryBtn}>
                    <Plus size={14} color="#00F0FF" />
                    <Text style={styles.secondaryBtnText}>Generar nuevo código</Text>
                  </Pressable>
                </View>

                <View style={styles.softCard}>
                  <Text style={styles.cardTitle}>Unirse con Código</Text>
                  <View style={styles.joinRow}>
                    <TextInput
                      value={joinInput}
                      onChangeText={setJoinInput}
                      autoCapitalize="characters"
                      placeholder="Ej. NX-4821"
                      placeholderTextColor="#64748b"
                      style={styles.joinInput}
                    />
                    <Pressable onPress={handleJoinCoopRoom} style={styles.joinBtn}>
                      <Text style={styles.joinBtnText}>Unirse</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Derecha: Sala Activa */}
              <View style={styles.coopRight}>
                <View style={styles.roomTop}>
                  <View>
                    <Text style={styles.roomLabel}>Código de Sala</Text>
                    <Text style={styles.roomCodeText}>{activeRoomCode}</Text>
                  </View>
                  <View style={styles.readyBadge}>
                    <Watch size={13} color="#00E699" />
                    <Text style={styles.readyBadgeText}>Relojes Sincronizados</Text>
                  </View>
                </View>

                <View style={styles.slotsRow}>
                  <View
                    style={[
                      styles.slotBox,
                      isHost && { borderColor: '#00F0FF', borderWidth: 1.5 },
                    ]}
                  >
                    <Text style={[styles.slotLabel, isHost && { color: '#00F0FF' }]}>
                      Jugador 1 (Anfitrión){isHost ? ' · TÚ' : ''}
                    </Text>
                    <Text style={styles.slotName}>
                      {isHost ? profile.player.username : 'ANFITRIÓN_NEXO'}
                    </Text>
                    <Text style={styles.slotSub}>
                      {isHost ? (profile.watch?.deviceName || 'Wear OS Conectado') : 'Deck Sincronizado'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.slotBox,
                      !isHost && { borderColor: '#00E699', borderWidth: 1.5 },
                    ]}
                  >
                    <Text style={[styles.slotLabel, { color: '#00E699' }]}>
                      Jugador 2 (Compañero){!isHost ? ' · TÚ' : ''}
                    </Text>
                    <Text style={styles.slotName}>
                      {!isHost ? profile.player.username : 'AGENTE_VEX'}
                    </Text>
                    <Text style={styles.slotSub}>
                      {!isHost ? (profile.watch?.deviceName || 'Wear OS Conectado') : 'Conectado y listo'}
                    </Text>
                  </View>
                </View>

                <Pressable onPress={handleStartCoopGame} style={styles.startCoopBtn}>
                  <Play size={16} color="#090d14" fill="#090d14" />
                  <Text style={styles.startCoopBtnText}>
                    Iniciar Partida como Jugador {isHost ? '1 (P1)' : '2 (P2)'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* PESTAÑA 2: ASALTAR BASES */}
          {tab === 'RAIDS' ? (
            <ScrollView contentContainerStyle={styles.listContainer}>
              {profile.raidTargets.map((target) => {
                const lootAmount = Math.floor(target.vaultCredits * 0.3);
                return (
                  <View key={target.id} style={styles.raidCard}>
                    <View style={styles.raidInfo}>
                      <Text style={styles.raidBaseName}>{target.baseName}</Text>
                      <Text style={styles.raidSub}>
                        De {target.ownerUsername} · {target.securityRating}
                      </Text>
                    </View>

                    <View style={styles.lootBadge}>
                      <Coins size={15} color="#FFD700" />
                      <Text style={styles.lootValue}>+{lootAmount} CR</Text>
                    </View>

                    <Pressable
                      onPress={() => handleStartRaid(target.id)}
                      style={styles.raidBtn}
                    >
                      <Swords size={15} color="#090d14" />
                      <Text style={styles.raidBtnText}>Asaltar</Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          ) : null}

          {/* PESTAÑA 3: DEFENSAS */}
          {tab === 'REPORTS' ? (
            <ScrollView contentContainerStyle={styles.listContainer}>
              {profile.raidReports.map((rep) => (
                <View key={rep.id} style={styles.reportCard}>
                  {rep.success ? (
                    <ShieldAlert size={20} color="#ff5c7c" />
                  ) : (
                    <CheckCircle2 size={20} color="#00E699" />
                  )}

                  <View style={styles.reportBody}>
                    <Text style={styles.reportTitle}>
                      {rep.attackerUsername} —{' '}
                      {rep.success ? 'Robó recursos de tu base' : 'Fue detenido por tus defensas'}
                    </Text>
                    <Text style={styles.reportTime}>{rep.createdAt}</Text>
                  </View>

                  <Text
                    style={[
                      styles.reportDelta,
                      { color: rep.success ? '#ff5c7c' : '#00E699' },
                    ]}
                  >
                    {rep.success ? `-${rep.creditsStolen} CR` : 'Defendida'}
                  </Text>
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
    backgroundColor: '#090d14',
  },
  watchGateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  watchGateCard: {
    maxWidth: 420,
    backgroundColor: '#111926',
    borderWidth: 1,
    borderColor: '#253348',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  watchIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 158, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchGateTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  watchGateDesc: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  watchGateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00E699',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginTop: 4,
  },
  watchGateBtnText: {
    color: '#090d14',
    fontSize: 13,
    fontWeight: '800',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#111926',
    borderWidth: 1,
    borderColor: '#223044',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#00F0FF',
    borderColor: '#00F0FF',
  },
  tabBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#090d14',
    fontWeight: '800',
  },
  statusToast: {
    color: '#00E699',
    fontSize: 12,
    fontWeight: '700',
  },
  coopContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 16,
  },
  coopLeft: {
    width: '44%',
    gap: 12,
  },
  softCard: {
    flex: 1,
    backgroundColor: '#111926',
    borderWidth: 1,
    borderColor: '#1e2b3c',
    borderRadius: 14,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  cardHint: {
    color: '#94a3b8',
    fontSize: 11,
  },
  missionChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  missionChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0c131d',
    borderWidth: 1,
    borderColor: '#223044',
  },
  missionChipActive: {
    backgroundColor: '#00F0FF',
    borderColor: '#00F0FF',
  },
  missionChipText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  missionChipTextActive: {
    color: '#090d14',
    fontWeight: '800',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderRadius: 9,
    paddingVertical: 8,
  },
  secondaryBtnText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '700',
  },
  joinRow: {
    flexDirection: 'row',
    gap: 8,
  },
  joinInput: {
    flex: 1,
    backgroundColor: '#0c131d',
    borderWidth: 1,
    borderColor: '#223044',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  joinBtn: {
    backgroundColor: '#00F0FF',
    borderRadius: 9,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  joinBtnText: {
    color: '#090d14',
    fontSize: 12,
    fontWeight: '800',
  },
  coopRight: {
    flex: 1,
    backgroundColor: '#111926',
    borderWidth: 1,
    borderColor: '#233246',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  roomTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  roomCodeText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 230, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 153, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  readyBadgeText: {
    color: '#00E699',
    fontSize: 11,
    fontWeight: '700',
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  slotBox: {
    flex: 1,
    backgroundColor: '#0c131d',
    borderWidth: 1,
    borderColor: '#1e2b3c',
    borderRadius: 12,
    padding: 12,
    gap: 3,
  },
  slotLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  slotName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  slotSub: {
    color: '#00E699',
    fontSize: 11,
    fontWeight: '600',
  },
  startCoopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00E699',
    borderRadius: 11,
    paddingVertical: 12,
  },
  startCoopBtnText: {
    color: '#090d14',
    fontSize: 14,
    fontWeight: '800',
  },
  listContainer: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 10,
  },
  raidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111926',
    borderWidth: 1,
    borderColor: '#1e2b3c',
    borderRadius: 14,
    padding: 14,
    gap: 14,
  },
  raidInfo: {
    flex: 1,
    gap: 3,
  },
  raidBaseName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  raidSub: {
    color: '#94a3b8',
    fontSize: 12,
  },
  lootBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  lootValue: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '800',
  },
  raidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#00F0FF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  raidBtnText: {
    color: '#090d14',
    fontSize: 13,
    fontWeight: '800',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#111926',
    borderWidth: 1,
    borderColor: '#1e2b3c',
    borderRadius: 14,
    padding: 14,
  },
  reportBody: {
    flex: 1,
    gap: 2,
  },
  reportTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  reportTime: {
    color: '#64748b',
    fontSize: 11,
  },
  reportDelta: {
    fontSize: 13,
    fontWeight: '800',
  },
});
