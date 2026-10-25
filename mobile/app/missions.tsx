// Pantalla Hub de Operaciones / Selector de los 5 Niveles en formato Horizontal (Landscape).
// Muestra los 5 distritos de docs/NEXO_Contexto_IA.md (Sección 5) con su color de acento,
// mecánicas, minijuego del reloj, recompensas y habilidad desbloqueable.
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  Coins,
  Cpu,
  Lock,
  Play,
  Radio,
  ShieldAlert,
  Unlock,
  Watch,
  Zap,
} from 'lucide-react-native';
import { CommandHeader } from '../components/navigation/CommandHeader';
import type { MissionInfo } from '../lib/api';
import {
  DEFAULT_PROFILE_STATE,
  loadPlayerProfile,
  savePlayerProfile,
  SKILL_CATALOG,
  type PlayerProfileState,
} from '../lib/playerStore';
import { getLevelAccent } from '../theme/colors';

export default function MissionsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfileState>(DEFAULT_PROFILE_STATE);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);

  useEffect(() => {
    loadPlayerProfile().then((loaded) => {
      setProfile(loaded);
    });
  }, []);

  const currentMission: MissionInfo =
    profile.missions.find((m) => m.levelNumber === selectedLevel) ?? profile.missions[0];
  const accent = getLevelAccent(currentMission.theme);
  const skillDef = SKILL_CATALOG.find((s) => s.code === currentMission.unlocksSkill);

  const handleDeploy = () => {
    const targetSession =
      currentMission.levelNumber === 1 ? 'demo' : `level-${currentMission.levelNumber}`;
    router.push(`/character-select?next=/game/${targetSession}` as any);
  };

  const handleUnlockAllForDemo = async () => {
    const next = await savePlayerProfile({
      ...profile,
      missions: profile.missions.map((m) =>
        m.status === 'LOCKED' ? { ...m, status: 'AVAILABLE' } : m,
      ),
    });
    setProfile(next);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden />
      <CommandHeader
        title="MODO OFFLINE // LOS 5 DISTRITOS"
        subtitle="ELIGE UN DISTRITO PARA PASAR AL SELECTOR DE PERSONAJE"
        player={profile.player}
        watch={profile.watch}
        backTo="/?menu=1"
      />

      <View style={styles.body}>
        {/* Columna Izquierda: Lista de los 5 Niveles */}
        <View style={styles.leftColumn}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listHeaderTitle}>CAMPAÑA PRINCIPAL (NIVELES 1–5)</Text>
            <Pressable onPress={handleUnlockAllForDemo} style={styles.unlockDemoBtn}>
              <Unlock size={11} color="#ffcc00" />
              <Text style={styles.unlockDemoText}>HABILITAR TODOS</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.levelsScroll}>
            {profile.missions.map((mission) => {
              const isSelected = mission.levelNumber === selectedLevel;
              const mAccent = getLevelAccent(mission.theme);
              const isLocked = mission.status === 'LOCKED';
              const isCompleted = mission.status === 'COMPLETED';

              return (
                <Pressable
                  key={mission.id}
                  onPress={() => setSelectedLevel(mission.levelNumber)}
                  style={[
                    styles.levelItem,
                    isSelected && {
                      borderColor: mAccent,
                      backgroundColor: '#152030',
                    },
                  ]}
                >
                  <View style={[styles.levelNumberBox, { borderColor: mAccent }]}>
                    <Text style={[styles.levelNumberText, { color: mAccent }]}>
                      0{mission.levelNumber}
                    </Text>
                  </View>

                  <View style={styles.levelItemBody}>
                    <Text style={styles.levelItemName} numberOfLines={1}>
                      {mission.name}
                    </Text>
                    <Text style={styles.levelItemSub} numberOfLines={1}>
                      {mission.minigame}
                    </Text>
                  </View>

                  <View style={styles.levelStatusBox}>
                    {isCompleted ? (
                      <View style={styles.statusCompleted}>
                        <CheckCircle2 size={13} color="#00E699" />
                        <Text style={styles.statusCompletedText}>SUPERADO</Text>
                      </View>
                    ) : isLocked ? (
                      <View style={styles.statusLocked}>
                        <Lock size={13} color="#7B8CA6" />
                        <Text style={styles.statusLockedText}>BLOQUEADO</Text>
                      </View>
                    ) : (
                      <View style={[styles.statusAvailable, { borderColor: mAccent }]}>
                        <Text style={[styles.statusAvailableText, { color: mAccent }]}>
                          ACTIVO
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Columna Derecha: Informe Táctico del Nivel Seleccionado */}
        <View style={[styles.rightColumn, { borderColor: accent }]}>
          <View style={styles.briefHeader}>
            <View>
              <Text style={[styles.briefKicker, { color: accent }]}>
                OPERACIÓN 0{currentMission.levelNumber} // TEMA: {currentMission.theme}
              </Text>
              <Text style={styles.briefTitle}>{currentMission.name}</Text>
            </View>

            <View style={styles.recordBadge}>
              <Text style={styles.recordLabel}>MEJOR REGISTRO</Text>
              <Text style={styles.recordValue}>
                {currentMission.bestTurns ? `${currentMission.bestTurns} TURNOS` : 'SIN RÉCORD'}
              </Text>
            </View>
          </View>

          <Text style={styles.briefDesc}>{currentMission.description}</Text>

          {/* Tarjetas técnicas: Minijuego del reloj y Habilidad que desbloquea */}
          <View style={styles.techRow}>
            <View style={styles.techCard}>
              <View style={styles.techCardHeader}>
                <Watch size={13} color="#00F0FF" />
                <Text style={styles.techCardTitle}>MINIJUEGO EN SMARTWATCH</Text>
              </View>
              <Text style={styles.techCardValue}>{currentMission.minigame}</Text>
              <Text style={styles.techCardSub}>
                Se activa en la muñeca al hackear terminales o puertas blindadas.
              </Text>
            </View>

            <View style={styles.techCard}>
              <View style={styles.techCardHeader}>
                <Radio size={13} color="#ffcc00" />
                <Text style={styles.techCardTitle}>DESBLOQUEA EN EL RELOJ</Text>
              </View>
              <Text style={[styles.techCardValue, { color: '#ffcc00' }]}>
                {skillDef?.name ?? currentMission.unlocksSkill} ({skillDef?.cost ?? 20}% BAT)
              </Text>
              <Text style={styles.techCardSub}>{skillDef?.effect}</Text>
            </View>
          </View>

          {/* Fila inferior: Recompensas + Botón de Despliegue */}
          <View style={styles.bottomActionRow}>
            <View style={styles.rewardsBox}>
              <Text style={styles.rewardsLabel}>RECOMPENSA POR EXTRACCIÓN:</Text>
              <View style={styles.rewardsPills}>
                <View style={styles.rewardPill}>
                  <Coins size={12} color="#FFD700" />
                  <Text style={[styles.rewardPillText, { color: '#FFD700' }]}>
                    +{currentMission.rewardCredits} CR
                  </Text>
                </View>
                <View style={styles.rewardPill}>
                  <Zap size={12} color="#00F0FF" />
                  <Text style={[styles.rewardPillText, { color: '#00F0FF' }]}>
                    +{currentMission.rewardEnergy} EN
                  </Text>
                </View>
                <View style={styles.rewardPill}>
                  <Cpu size={12} color="#E299FF" />
                  <Text style={[styles.rewardPillText, { color: '#E299FF' }]}>
                    +{currentMission.rewardIntel} IN
                  </Text>
                </View>
              </View>
            </View>

            {currentMission.status === 'LOCKED' ? (
              <Pressable onPress={handleUnlockAllForDemo} style={styles.lockedDeployBtn}>
                <ShieldAlert size={15} color="#ffcc00" />
                <Text style={styles.lockedDeployText}>DESBLOQUEAR NIVEL (MODO DEMO)</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleDeploy}
                style={({ pressed }) => [
                  styles.deployBtn,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <Play size={16} color="#ffffff" fill="#ffffff" />
                <Text style={styles.deployBtnText}>ELEGIR AGENTE Y DESPLEGAR</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070a0f',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 14,
  },
  leftColumn: {
    width: '43%',
    gap: 6,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listHeaderTitle: {
    color: '#9fb3c8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  unlockDemoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#17212e',
    borderWidth: 1,
    borderColor: '#ffcc00',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  unlockDemoText: {
    color: '#ffcc00',
    fontSize: 8,
    fontWeight: '900',
  },
  levelsScroll: {
    gap: 6,
    paddingBottom: 6,
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#101722',
    borderWidth: 1.5,
    borderColor: '#253344',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  levelNumberBox: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#090d13',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumberText: {
    fontSize: 13,
    fontWeight: '900',
  },
  levelItemBody: {
    flex: 1,
    gap: 2,
  },
  levelItemName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  levelItemSub: {
    color: '#889db2',
    fontSize: 9,
    fontWeight: '700',
  },
  levelStatusBox: {
    alignItems: 'flex-end',
  },
  statusCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 230, 153, 0.1)',
    borderWidth: 1,
    borderColor: '#00E699',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusCompletedText: {
    color: '#00E699',
    fontSize: 8,
    fontWeight: '900',
  },
  statusLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0b1017',
    borderWidth: 1,
    borderColor: '#283646',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusLockedText: {
    color: '#7B8CA6',
    fontSize: 8,
    fontWeight: '900',
  },
  statusAvailable: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  statusAvailableText: {
    fontSize: 8,
    fontWeight: '900',
  },
  rightColumn: {
    flex: 1,
    backgroundColor: '#101722',
    borderWidth: 2,
    borderRadius: 10,
    padding: 13,
    justifyContent: 'space-between',
  },
  briefHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  briefKicker: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  briefTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  recordBadge: {
    backgroundColor: '#090d13',
    borderWidth: 1,
    borderColor: '#2b3b4e',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignItems: 'flex-end',
  },
  recordLabel: {
    color: '#7e93a8',
    fontSize: 8,
    fontWeight: '900',
  },
  recordValue: {
    color: '#00E699',
    fontSize: 11,
    fontWeight: '900',
  },
  briefDesc: {
    color: '#b5c7d9',
    fontSize: 11,
    lineHeight: 16,
  },
  techRow: {
    flexDirection: 'row',
    gap: 10,
  },
  techCard: {
    flex: 1,
    backgroundColor: '#0a0f16',
    borderWidth: 1,
    borderColor: '#253547',
    borderRadius: 8,
    padding: 9,
    gap: 3,
  },
  techCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  techCardTitle: {
    color: '#8ca2b8',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  techCardValue: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '900',
  },
  techCardSub: {
    color: '#7f94aa',
    fontSize: 9,
    lineHeight: 12,
  },
  bottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#223142',
    paddingTop: 9,
  },
  rewardsBox: {
    gap: 4,
  },
  rewardsLabel: {
    color: '#8ca2b8',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  rewardsPills: {
    flexDirection: 'row',
    gap: 6,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#090d13',
    borderWidth: 1,
    borderColor: '#263648',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
  },
  rewardPillText: {
    fontSize: 10,
    fontWeight: '900',
  },
  deployBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#d83800',
    borderWidth: 2,
    borderColor: '#ffcc00',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  deployBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  lockedDeployBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#192330',
    borderWidth: 1.5,
    borderColor: '#ffcc00',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  lockedDeployText: {
    color: '#ffcc00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
