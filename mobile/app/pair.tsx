// Pantalla de Vinculación del Reloj Inteligente (Wear OS) en formato Horizontal.
// Permite ingresar el código temporal de 4 dígitos mostrado en el Smartwatch
// (POST /api/pairing/claim) y escucha el evento en tiempo real `pairing:linked`.
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  Delete,
  Link2,
  Radio,
  RefreshCw,
  Unlink,
  Watch,
} from 'lucide-react-native';
import { CommandHeader } from '../components/navigation/CommandHeader';
import {
  DEFAULT_PROFILE_STATE,
  linkWatchWithCode,
  loadPlayerProfile,
  SKILL_CATALOG,
  unlinkWatch,
  type PlayerProfileState,
} from '../lib/playerStore';
import { getSocket } from '../lib/socket';

export default function PairWatchScreen() {
  const [profile, setProfile] = useState<PlayerProfileState>(DEFAULT_PROFILE_STATE);
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    loadPlayerProfile().then(setProfile);

    const socket = getSocket();
    const onLinked = () => {
      loadPlayerProfile().then(setProfile);
      setFeedback({
        ok: true,
        text: 'Evento pairing:linked recibido: Smartwatch sincronizado en tiempo real.',
      });
    };
    socket?.on('pairing:linked', onLinked);
    return () => {
      socket?.off('pairing:linked', onLinked);
    };
  }, []);

  const handleDigit = (digit: string) => {
    if (code.length >= 4) return;
    setCode((prev) => prev + digit);
    setFeedback(null);
  };

  const handleBackspace = () => {
    setCode((prev) => prev.slice(0, -1));
    setFeedback(null);
  };

  const handleClaim = async (targetCode?: string) => {
    const finalCode = targetCode ?? code;
    const res = await linkWatchWithCode(finalCode);
    setProfile(res.profile);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) setCode('');
  };

  const handleUnlink = async () => {
    const next = await unlinkWatch();
    setProfile(next);
    setFeedback({ ok: true, text: 'Smartwatch desvinculado de la cuenta.' });
  };

  const maxBattery =
    profile.upgrades.battery === 3 ? 150 : profile.upgrades.battery === 2 ? 125 : 100;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden />
      <CommandHeader
        title="VINCULACIÓN DE RELOJ // WEAR OS"
        subtitle="SINCRONIZACIÓN DEL HACKER DECK EN MUÑECA"
        player={profile.player}
        watch={profile.watch}
      />

      <View style={styles.body}>
        {/* Columna Izquierda: Estado del Reloj y Deck Táctico */}
        <View style={styles.leftPanel}>
          <View style={styles.watchStatusCard}>
            <View style={styles.watchCircleFrame}>
              <Watch
                size={34}
                color={profile.watch ? '#00E699' : '#FF8800'}
              />
              <Text
                style={[
                  styles.watchCircleState,
                  { color: profile.watch ? '#00E699' : '#FF8800' },
                ]}
              >
                {profile.watch ? 'ONLINE' : 'PENDIENTE'}
              </Text>
            </View>

            <View style={styles.watchMeta}>
              <Text style={styles.watchMetaKicker}>ESTADO DEL DISPOSITIVO WEAR OS</Text>
              <Text style={styles.watchMetaName}>
                {profile.watch ? profile.watch.deviceName : 'NINGÚN RELOJ VINCULADO'}
              </Text>
              <Text style={styles.watchMetaSub}>
                {profile.watch
                  ? `${profile.watch.linkedAt} · ${profile.watch.lastSeenAt}`
                  : 'Abre la app NEXO en el Smartwatch para obtener un código de 4 dígitos.'}
              </Text>

              <View style={styles.specsRow}>
                <View style={styles.specBadge}>
                  <Text style={styles.specLabel}>BATERÍA MÁX.</Text>
                  <Text style={styles.specValue}>{maxBattery}%</Text>
                </View>
                <View style={styles.specBadge}>
                  <Text style={styles.specLabel}>CHIP CIPHER</Text>
                  <Text style={styles.specValue}>NV. {profile.upgrades.cipher}</Text>
                </View>
                <View style={styles.specBadge}>
                  <Text style={styles.specLabel}>EFICIENCIA</Text>
                  <Text style={styles.specValue}>NV. {profile.upgrades.efficiency}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Habilidades actualmente cargadas en la muñeca */}
          <View style={styles.deckSkillsCard}>
            <View style={styles.deckSkillsHeader}>
              <Radio size={14} color="#00F0FF" />
              <Text style={styles.deckSkillsTitle}>
                MÓDULOS CARGADOS EN EL RELOJ ({profile.equippedSkills.length}/4 + HACK)
              </Text>
            </View>

            <View style={styles.skillsGrid}>
              <View style={[styles.skillChip, styles.skillChipAlways]}>
                <Text style={styles.skillChipCode}>HACK (FIJA)</Text>
                <Text style={styles.skillChipCost}>20% BAT · Minijuego contextual</Text>
              </View>
              {profile.equippedSkills.map((codeKey) => {
                const def = SKILL_CATALOG.find((s) => s.code === codeKey);
                return (
                  <View key={codeKey} style={styles.skillChip}>
                    <Text style={styles.skillChipCode}>{def?.name ?? codeKey}</Text>
                    <Text style={styles.skillChipCost}>{def?.cost ?? 20}% BAT · Equipada</Text>
                  </View>
                );
              })}
            </View>

            {profile.watch ? (
              <Pressable onPress={handleUnlink} style={styles.unlinkBtn}>
                <Unlink size={13} color="#ff4d6d" />
                <Text style={styles.unlinkBtnText}>DESVINCULAR SMARTWATCH ACTUAL</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Columna Derecha: Ingreso del Código de 4 Dígitos */}
        <View style={styles.rightPanel}>
          <Text style={styles.keypadKicker}>EMPAREJAMIENTO POR CÓDIGO TEMPORAL</Text>
          <Text style={styles.keypadTitle}>INGRESA LOS 4 DÍGITOS DEL RELOJ</Text>

          {/* 4 casillas de dígitos */}
          <View style={styles.digitsRow}>
            {[0, 1, 2, 3].map((idx) => {
              const char = code[idx] ?? '';
              const active = code.length === idx;
              return (
                <View
                  key={idx}
                  style={[
                    styles.digitBox,
                    active && styles.digitBoxActive,
                    char !== '' && styles.digitBoxFilled,
                  ]}
                >
                  <Text style={styles.digitText}>{char || '·'}</Text>
                </View>
              );
            })}
          </View>

          {/* Teclado táctico compacto */}
          <View style={styles.keypadGrid}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <Pressable
                key={d}
                onPress={() => handleDigit(d)}
                style={({ pressed }) => [
                  styles.keyBtn,
                  pressed && styles.keyBtnPressed,
                ]}
              >
                <Text style={styles.keyBtnText}>{d}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                setCode('4821');
                handleClaim('4821');
              }}
              style={[styles.keyBtn, styles.keyBtnDemo]}
            >
              <RefreshCw size={13} color="#00F0FF" />
              <Text style={styles.keyBtnDemoText}>DEMO</Text>
            </Pressable>
            <Pressable
              onPress={() => handleDigit('0')}
              style={({ pressed }) => [
                styles.keyBtn,
                pressed && styles.keyBtnPressed,
              ]}
            >
              <Text style={styles.keyBtnText}>0</Text>
            </Pressable>
            <Pressable onPress={handleBackspace} style={styles.keyBtn}>
              <Delete size={16} color="#ffcc00" />
            </Pressable>
          </View>

          {feedback ? (
            <View
              style={[
                styles.feedbackBar,
                feedback.ok ? styles.feedbackOk : styles.feedbackErr,
              ]}
            >
              <CheckCircle2 size={13} color={feedback.ok ? '#00E699' : '#ff4d6d'} />
              <Text
                style={[
                  styles.feedbackText,
                  { color: feedback.ok ? '#00E699' : '#ff4d6d' },
                ]}
              >
                {feedback.text}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => handleClaim()}
            style={({ pressed }) => [
              styles.claimBtn,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <Link2 size={16} color="#ffffff" />
            <Text style={styles.claimBtnText}>VINCULAR RELOJ A MI CUENTA</Text>
          </Pressable>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 14,
  },
  leftPanel: {
    flex: 1.25,
    justifyContent: 'space-between',
    gap: 10,
  },
  watchStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#101722',
    borderWidth: 2,
    borderColor: '#29394d',
    borderRadius: 10,
    padding: 12,
  },
  watchCircleFrame: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#0a0f16',
    borderWidth: 3,
    borderColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  watchCircleState: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  watchMeta: {
    flex: 1,
    gap: 3,
  },
  watchMetaKicker: {
    color: '#ffcc00',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  watchMetaName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  watchMetaSub: {
    color: '#93a8be',
    fontSize: 10,
    lineHeight: 14,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  specBadge: {
    backgroundColor: '#0b1017',
    borderWidth: 1,
    borderColor: '#273648',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  specLabel: {
    color: '#7f95ab',
    fontSize: 8,
    fontWeight: '800',
  },
  specValue: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '900',
  },
  deckSkillsCard: {
    flex: 1,
    backgroundColor: '#101722',
    borderWidth: 1.5,
    borderColor: '#263648',
    borderRadius: 10,
    padding: 11,
    justifyContent: 'space-between',
  },
  deckSkillsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deckSkillsTitle: {
    color: '#d8e6f4',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  skillChip: {
    width: '48%',
    backgroundColor: '#0b1017',
    borderWidth: 1,
    borderColor: '#2d3f54',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  skillChipAlways: {
    borderColor: '#ffcc00',
  },
  skillChipCode: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  skillChipCost: {
    color: '#8aa0b7',
    fontSize: 9,
    fontWeight: '700',
  },
  unlinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
    borderWidth: 1,
    borderColor: '#ff4d6d',
  },
  unlinkBtnText: {
    color: '#ff4d6d',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#101722',
    borderWidth: 2,
    borderColor: '#ffcc00',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keypadKicker: {
    color: '#ffcc00',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  keypadTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  digitsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  digitBox: {
    width: 44,
    height: 44,
    borderRadius: 7,
    backgroundColor: '#090d13',
    borderWidth: 2,
    borderColor: '#2b3b4e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBoxActive: {
    borderColor: '#00F0FF',
  },
  digitBoxFilled: {
    borderColor: '#ffcc00',
  },
  digitText: {
    color: '#ffcc00',
    fontSize: 20,
    fontWeight: '900',
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 216,
    gap: 6,
    justifyContent: 'center',
  },
  keyBtn: {
    width: 66,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#17212e',
    borderWidth: 1.5,
    borderColor: '#33465c',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  keyBtnPressed: {
    backgroundColor: '#27384d',
  },
  keyBtnText: {
    color: '#eef6ff',
    fontSize: 14,
    fontWeight: '900',
  },
  keyBtnDemo: {
    borderColor: '#00F0FF',
  },
  keyBtnDemoText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: '900',
  },
  feedbackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    width: '100%',
  },
  feedbackOk: {
    backgroundColor: 'rgba(0, 230, 153, 0.1)',
    borderColor: '#00E699',
  },
  feedbackErr: {
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
    borderColor: '#ff4d6d',
  },
  feedbackText: {
    fontSize: 9,
    fontWeight: '800',
    flex: 1,
  },
  claimBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#d83800',
    borderWidth: 2,
    borderColor: '#ffcc00',
    borderRadius: 7,
    paddingVertical: 9,
  },
  claimBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
