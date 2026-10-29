// Pantalla Modo Offline (Selector de los 5 Niveles) con diseno suave, limpio e intuitivo.
// Quita el ruido visual y explica claramente que modulo desbloquea cada nivel y como utilizarlo.
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  Lock,
  Play,
  Radio,
  Unlock,
} from 'lucide-react-native';
import { CommandHeader } from '../components/navigation/CommandHeader';
import type { MissionInfo, SkillCode } from '../lib/api';
import {
  DEFAULT_PROFILE_STATE,
  loadPlayerProfile,
  savePlayerProfile,
  SKILL_CATALOG,
  type PlayerProfileState,
} from '../lib/playerStore';
import { getLevelAccent } from '../theme/colors';

const MODULE_USAGE_GUIDE: Record<SkillCode, string> = {
  SCANNER:
    'Tocalo en el reloj o en el panel derecho del juego cuando sospeches que hay minas ocultas en el pasillo. Consume 15% de bateria y las hace visibles.',
  SABOTAGE:
    'Acercate a una camara activa y pulsa Sabotaje. Consume 25% de bateria y apaga esa camara por 4 turnos para que cruces sin subir alerta.',
  CAMOUFLAGE:
    'Activalo justo antes de cruzar frente a un guardia o camara. Consume 35% de bateria y te vuelve invisible durante 3 turnos.',
  OVERLOAD:
    'Cuando una mina laser bloquee un pasillo estrecho, pulsa Sobrecarga (20% de bateria) para destruir todas las minas en un radio de 4 casillas.',
  RADAR:
    'Activalo (15% de bateria) para encender la brujula en tu Smartwatch; te indicara la direccion y distancia exacta hacia la salida.',
  EMP:
    'Usalo cuando un guardia o dron rapido este cerca (30% de bateria). Lo paraliza en su sitio y apaga su vision durante 4 turnos.',
  THERMAL:
    'Activalo (25% de bateria) en sectores oscuros o minados para revelar al instante todas las trampas laser de todo el mapa.',
  TIMEDILATE:
    'Tu recurso definitivo (40% de bateria): congela al mismo tiempo a todos los guardias, drones y camaras del sector durante 2 turnos.',
};

export default function MissionsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfileState>(DEFAULT_PROFILE_STATE);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);

  useEffect(() => {
    loadPlayerProfile().then(setProfile);
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
        title="Modo Offline · Selecciona un Nivel"
        player={profile.player}
        watch={profile.watch}
        backTo="/?menu=1"
      />

      <View style={styles.body}>
        {/* Columna Izquierda: Lista limpia de los 5 Niveles */}
        <View style={styles.leftColumn}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listHeaderTitle}>Distritos</Text>
            <Pressable onPress={handleUnlockAllForDemo} style={styles.unlockLink}>
              <Unlock size={12} color="#94a3b8" />
              <Text style={styles.unlockLinkText}>Desbloquear todos</Text>
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
                      backgroundColor: '#162232',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.levelNumberText,
                      { color: isSelected ? mAccent : '#64748b' },
                    ]}
                  >
                    0{mission.levelNumber}
                  </Text>

                  <Text
                    style={[
                      styles.levelItemName,
                      isLocked && !isSelected && { color: '#94a3b8' },
                    ]}
                    numberOfLines={1}
                  >
                    {mission.name}
                  </Text>

                  {isCompleted ? (
                    <CheckCircle2 size={16} color="#06d6a0" />
                  ) : isLocked ? (
                    <Lock size={15} color="#64748b" />
                  ) : (
                    <View style={[styles.activeDot, { backgroundColor: mAccent }]} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Columna Derecha: Explicacion suave y clara del nivel y su modulo */}
        <View style={styles.rightColumn}>
          <View style={styles.topInfo}>
            <Text style={[styles.levelBadge, { color: accent }]}>
              Nivel {currentMission.levelNumber}
            </Text>
            <Text style={styles.briefTitle}>{currentMission.name}</Text>
            <Text style={styles.briefDesc}>{currentMission.description}</Text>
          </View>

          {/* Tarjeta unica y clara explicando como usar el modulo de este nivel */}
          <View style={styles.moduleGuideCard}>
            <View style={styles.moduleHeader}>
              <Radio size={16} color="#4cc9f0" />
              <Text style={styles.moduleTitle}>
                Modulo que desbloqueas: {skillDef?.name ?? currentMission.unlocksSkill} ({skillDef?.cost ?? 20}% bat.)
              </Text>
            </View>
            <Text style={styles.moduleHowTo}>
              {MODULE_USAGE_GUIDE[currentMission.unlocksSkill] ?? skillDef?.effect}
            </Text>
          </View>

          {/* Barra inferior limpia */}
          <View style={styles.bottomActionRow}>
            <Text style={styles.rewardSummary}>
              Recompensa: +{currentMission.rewardCredits} Creditos · +{currentMission.rewardEnergy} Energia
            </Text>

            {currentMission.status === 'LOCKED' ? (
              <Pressable onPress={handleUnlockAllForDemo} style={styles.unlockBtn}>
                <Unlock size={15} color="#ffd166" />
                <Text style={styles.unlockBtnText}>Habilitar nivel</Text>
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
                <Text style={styles.deployBtnText}>Elegir Personaje y Jugar</Text>
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
    backgroundColor: '#090e16',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 18,
  },
  leftColumn: {
    width: '36%',
    gap: 8,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  listHeaderTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  unlockLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  unlockLinkText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  levelsScroll: {
    gap: 8,
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#111926',
    borderWidth: 1.5,
    borderColor: '#1e2b3c',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  levelNumberText: {
    fontSize: 14,
    fontWeight: '800',
  },
  levelItemName: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '700',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rightColumn: {
    flex: 1,
    backgroundColor: '#111926',
    borderWidth: 1.5,
    borderColor: '#1e2b3c',
    borderRadius: 16,
    padding: 18,
    justifyContent: 'space-between',
  },
  topInfo: {
    gap: 6,
  },
  levelBadge: {
    fontSize: 12,
    fontWeight: '800',
  },
  briefTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  briefDesc: {
    color: '#94a3b8',
    fontSize: 12.5,
    lineHeight: 18,
  },
  moduleGuideCard: {
    backgroundColor: '#0c131d',
    borderWidth: 1,
    borderColor: '#233449',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moduleTitle: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '800',
  },
  moduleHowTo: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  bottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e2b3c',
  },
  rewardSummary: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  deployBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#d83800',
    borderWidth: 1.5,
    borderColor: '#ffcc00',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  deployBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#182436',
    borderWidth: 1,
    borderColor: '#ffd166',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  unlockBtnText: {
    color: '#ffd166',
    fontSize: 12,
    fontWeight: '700',
  },
});
