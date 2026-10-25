// Pantalla de Perfil del Agente e Historial de Misiones en formato Horizontal (Landscape).
// Accesible desde el Taller Deck (/workshop).
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Award,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  ShieldAlert,
  UserCheck,
} from 'lucide-react-native';
import { CommandHeader } from '../components/navigation/CommandHeader';
import {
  CHARACTERS,
  getCharacterAvatar,
  getSelectedCharacter,
  type CharacterId,
} from '../lib/characters';
import {
  DEFAULT_PROFILE_STATE,
  loadPlayerProfile,
  logoutPlayer,
  type PlayerProfileState,
} from '../lib/playerStore';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfileState>(DEFAULT_PROFILE_STATE);
  const [charId, setCharId] = useState<CharacterId>('jesus');

  useEffect(() => {
    loadPlayerProfile().then(setProfile);
    getSelectedCharacter().then(setCharId);
  }, []);

  const handleLogout = async () => {
    await logoutPlayer();
    router.replace('/login');
  };

  const activeChar = CHARACTERS[charId];
  const wins = profile.history.filter((h) => h.result === 'WON').length;
  const totalMatches = profile.history.length;
  const completedMissions = profile.missions.filter((m) => m.status === 'COMPLETED').length;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden />
      <CommandHeader
        title="PERFIL DEL AGENTE // HISTORIAL"
        subtitle="ACCESO DESDE TALLER DECK · ESTADÍSTICAS Y BITÁCORA"
        player={profile.player}
        watch={profile.watch}
        backTo="/workshop"
      />

      <View style={styles.body}>
        {/* Columna Izquierda: Ficha del Agente y Estadísticas */}
        <View style={styles.leftColumn}>
          <View style={styles.agentCard}>
            <Image source={getCharacterAvatar(charId)} style={styles.avatar} />
            <View style={styles.agentMeta}>
              <Text style={styles.agentKicker}>CREDENCIAL ACTIVA</Text>
              <Text style={styles.agentUsername}>{profile.player.username}</Text>
              <Text style={styles.agentEmail}>{profile.player.email}</Text>
              <Text style={styles.agentCharBadge}>
                OPERADOR EN CAMPO: {activeChar.name.toUpperCase()} ({activeChar.alias})
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{wins}/{totalMatches}</Text>
              <Text style={styles.statLabel}>MISIONES GANADAS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#00E699' }]}>
                {completedMissions}/5
              </Text>
              <Text style={styles.statLabel}>DISTRITOS SUPERADOS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#00F0FF' }]}>
                {profile.unlockedSkills.length}/8
              </Text>
              <Text style={styles.statLabel}>MÓDULOS RELOJ</Text>
            </View>
          </View>

          <View style={styles.accountActions}>
            <Pressable
              onPress={() => router.push('/character-select?next=/profile' as any)}
              style={styles.changeCharBtn}
            >
              <UserCheck size={14} color="#ffcc00" />
              <Text style={styles.changeCharText}>CAMBIAR AGENTE</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/login')} style={styles.loginBtn}>
              <LogIn size={14} color="#00F0FF" />
              <Text style={styles.loginBtnText}>CUENTA / LOGIN</Text>
            </Pressable>

            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <LogOut size={14} color="#ff4d6d" />
            </Pressable>
          </View>
        </View>

        {/* Columna Derecha: Historial de Misiones (mission_history) */}
        <View style={styles.rightColumn}>
          <View style={styles.historyHeader}>
            <Award size={14} color="#ffcc00" />
            <Text style={styles.historyTitle}>
              HISTORIAL DE OPERACIONES ({profile.history.length})
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.historyList}>
            {profile.history.map((entry) => {
              const won = entry.result === 'WON';
              return (
                <View
                  key={entry.id}
                  style={[
                    styles.historyCard,
                    won ? styles.historyCardWon : styles.historyCardLost,
                  ]}
                >
                  <View style={styles.historyLeft}>
                    {won ? (
                      <CheckCircle2 size={18} color="#00E699" />
                    ) : (
                      <ShieldAlert size={18} color="#ff4d6d" />
                    )}
                    <View style={styles.historyTextCol}>
                      <View style={styles.historyTopLine}>
                        <Text style={styles.historyTypeBadge}>{entry.type}</Text>
                        <Text style={styles.historyName} numberOfLines={1}>
                          {entry.missionName}
                        </Text>
                      </View>
                      <View style={styles.historyMetaLine}>
                        <Clock size={10} color="#8ba0b6" />
                        <Text style={styles.historyMetaText}>
                          {entry.turns} turnos · Alerta máx. {entry.maxAlert}% · {entry.playedAt}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.historyRight}>
                    <Text
                      style={[
                        styles.historyResultText,
                        { color: won ? '#00E699' : '#ff4d6d' },
                      ]}
                    >
                      {won ? 'EXTRACCIÓN OK' : 'LOCKDOWN'}
                    </Text>
                    {won ? (
                      <Text style={styles.historyRewardsText}>
                        +{entry.creditsEarned} CR · +{entry.energyEarned} EN · +{entry.intelEarned} IN
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </ScrollView>
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
    width: '42%',
    justifyContent: 'space-between',
    gap: 8,
  },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#101722',
    borderWidth: 2,
    borderColor: '#ffcc00',
    borderRadius: 10,
    padding: 11,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffcc00',
    backgroundColor: '#080c12',
  },
  agentMeta: {
    flex: 1,
    gap: 2,
  },
  agentKicker: {
    color: '#ffcc00',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  agentUsername: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  agentEmail: {
    color: '#8da2b8',
    fontSize: 10,
  },
  agentCharBadge: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#101722',
    borderWidth: 1.5,
    borderColor: '#263648',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: '#ffcc00',
    fontSize: 16,
    fontWeight: '900',
  },
  statLabel: {
    color: '#8ca1b7',
    fontSize: 7,
    fontWeight: '900',
    textAlign: 'center',
  },
  accountActions: {
    flexDirection: 'row',
    gap: 6,
  },
  changeCharBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#151f2c',
    borderWidth: 1.5,
    borderColor: '#ffcc00',
    borderRadius: 7,
    paddingVertical: 9,
  },
  changeCharText: {
    color: '#ffcc00',
    fontSize: 9,
    fontWeight: '900',
  },
  loginBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#151f2c',
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    borderRadius: 7,
    paddingVertical: 9,
  },
  loginBtnText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: '900',
  },
  logoutBtn: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
    borderWidth: 1.5,
    borderColor: '#ff4d6d',
    borderRadius: 7,
  },
  rightColumn: {
    flex: 1,
    backgroundColor: '#101722',
    borderWidth: 1.5,
    borderColor: '#263648',
    borderRadius: 10,
    padding: 11,
    gap: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyTitle: {
    color: '#d8e6f4',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  historyList: {
    gap: 7,
    paddingBottom: 6,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0f16',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
  },
  historyCardWon: {
    borderColor: 'rgba(0, 230, 153, 0.45)',
  },
  historyCardLost: {
    borderColor: 'rgba(255, 77, 109, 0.45)',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  historyTextCol: {
    flex: 1,
    gap: 2,
  },
  historyTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyTypeBadge: {
    backgroundColor: '#1b2838',
    color: '#00F0FF',
    fontSize: 8,
    fontWeight: '900',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  historyName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    flex: 1,
  },
  historyMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyMetaText: {
    color: '#889db2',
    fontSize: 9,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  historyResultText: {
    fontSize: 9,
    fontWeight: '900',
  },
  historyRewardsText: {
    color: '#FFD700',
    fontSize: 8,
    fontWeight: '800',
  },
});
