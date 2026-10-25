// Pantalla de Registro de Nuevo Agente en formato Horizontal (Landscape).
// Conecta con POST /api/auth/register o crea el perfil local con recursos iniciales.
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Coins, Cpu, LogIn, UserPlus, Zap } from 'lucide-react-native';
import { MENU_BG } from '../lib/environmentAssets';
import { registerPlayer } from '../lib/playerStore';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || password.length < 4) {
      setError('Completa alias de agente, correo y contraseña (mínimo 4 caracteres).');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await registerPlayer(username, email, password);
      router.replace('/missions');
    } catch {
      setError('No se pudo registrar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={MENU_BG} style={styles.bg} resizeMode="cover">
      <StatusBar hidden />
      <View style={styles.overlay}>
        <View style={styles.hazardTop} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topRow}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
              style={styles.backBtn}
            >
              <ArrowLeft size={18} color="#ffcc00" />
              <Text style={styles.backText}>VOLVER</Text>
            </Pressable>
            <Text style={styles.topBadge}>ALTA DE AGENTE EN CAMPO // NEXO</Text>
          </View>

          <View style={styles.mainGrid}>
            {/* Columna izquierda: Dotación inicial */}
            <View style={styles.leftColumn}>
              <Text style={styles.kicker}>RECLUTAMIENTO OPERATIVO</Text>
              <Text style={styles.title}>NUEVA CUENTA DE AGENTE</Text>
              <Text style={styles.desc}>
                Al dar de alta tu expediente recibes un Hacker Deck nivel 1 con las 3 habilidades
                iniciales equipadas (Escáner, Sabotaje y Camuflaje) más recursos de arranque.
              </Text>

              <View style={styles.starterPack}>
                <Text style={styles.starterTitle}>DOTACIÓN INICIAL INCLUIDA:</Text>
                <View style={styles.starterRow}>
                  <View style={styles.resPill}>
                    <Coins size={13} color="#FFD700" />
                    <Text style={[styles.resPillText, { color: '#FFD700' }]}>350 CRÉDITOS</Text>
                  </View>
                  <View style={styles.resPill}>
                    <Zap size={13} color="#00F0FF" />
                    <Text style={[styles.resPillText, { color: '#00F0FF' }]}>90 ENERGÍA</Text>
                  </View>
                  <View style={styles.resPill}>
                    <Cpu size={13} color="#E299FF" />
                    <Text style={[styles.resPillText, { color: '#E299FF' }]}>35 INTEL</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Columna derecha: Formulario de registro */}
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <UserPlus size={16} color="#ffcc00" />
                <Text style={styles.formTitle}>CREAR EXPEDIENTE</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>ALIAS TÁCTICO (USERNAME)</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="characters"
                  placeholder="EJ. AGENTE_KRONOS"
                  placeholderTextColor="#5a6b7e"
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="agente@nexo.tactical"
                  placeholderTextColor="#5a6b7e"
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>CONTRASEÑA</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Mínimo 4 caracteres"
                  placeholderTextColor="#5a6b7e"
                  style={styles.input}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                disabled={loading}
                onPress={handleRegister}
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <UserPlus size={16} color="#ffffff" />
                    <Text style={styles.submitBtnText}>CONFIRMAR ALTA DE AGENTE</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={() => router.push('/login')}
                style={styles.secondaryBtn}
              >
                <LogIn size={13} color="#ffcc00" />
                <Text style={styles.secondaryBtnText}>YA TENGO CUENTA // INICIAR SESIÓN</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#070a0f',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 10, 16, 0.85)',
  },
  hazardTop: {
    height: 5,
    backgroundColor: '#ffb800',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#141c26',
    borderWidth: 1.5,
    borderColor: '#344558',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  backText: {
    color: '#ffcc00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  topBadge: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  mainGrid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  leftColumn: {
    flex: 1,
    maxWidth: 360,
    gap: 8,
  },
  kicker: {
    color: '#ffcc00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  desc: {
    color: '#b0c2d4',
    fontSize: 11,
    lineHeight: 16,
  },
  starterPack: {
    marginTop: 6,
    backgroundColor: '#111924',
    borderWidth: 1.5,
    borderColor: '#2d3f54',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  starterTitle: {
    color: '#ffcc00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  starterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  resPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0b1017',
    borderWidth: 1,
    borderColor: '#263648',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  resPillText: {
    fontSize: 10,
    fontWeight: '900',
  },
  formCard: {
    width: 350,
    backgroundColor: '#111822',
    borderWidth: 2,
    borderColor: '#ffcc00',
    borderRadius: 10,
    padding: 12,
    gap: 7,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#243242',
    paddingBottom: 5,
  },
  formTitle: {
    color: '#ffcc00',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  fieldGroup: {
    gap: 3,
  },
  label: {
    color: '#9db1c6',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#0b1017',
    borderWidth: 1.5,
    borderColor: '#2c3d50',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#eef6ff',
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: '#ff4d6d',
    fontSize: 10,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d83800',
    borderWidth: 2,
    borderColor: '#ffcc00',
    borderRadius: 7,
    paddingVertical: 9,
    marginTop: 2,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#17212e',
    borderWidth: 1,
    borderColor: '#36485e',
    borderRadius: 6,
    paddingVertical: 7,
  },
  secondaryBtnText: {
    color: '#ffcc00',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
