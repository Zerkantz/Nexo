// Pantalla de Inicio de Sesión en formato Horizontal (Landscape).
// Conecta con POST /api/auth/login o inicia sesión en modo local de respaldo.
import React, { useState } from 'react';
import { Link, useRouter } from 'expo-router';
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
import { ArrowLeft, KeyRound, LogIn, ShieldCheck, UserPlus } from 'lucide-react-native';
import { MENU_BG } from '../lib/environmentAssets';
import { loginPlayer } from '../lib/playerStore';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('agente@nexo.tactical');
  const [password, setPassword] = useState('nexo2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Ingresa tu correo táctico y contraseña.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await loginPlayer(email, password);
      router.replace('/missions');
    } catch {
      setError('No se pudo validar la credencial.');
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
          {/* Barra superior */}
          <View style={styles.topRow}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={styles.backBtn}
            >
              <ArrowLeft size={18} color="#ffcc00" />
              <Text style={styles.backText}>MENÚ PRINCIPAL</Text>
            </Pressable>

            <View style={styles.securityTag}>
              <ShieldCheck size={14} color="#00E699" />
              <Text style={styles.securityTagText}>AUTENTICACIÓN JWT // NEXO-NET</Text>
            </View>
          </View>

          {/* Panel horizontal de 2 columnas */}
          <View style={styles.mainGrid}>
            {/* Columna izquierda: Identidad del sistema */}
            <View style={styles.leftColumn}>
              <Text style={styles.kicker}>TERMINAL DE ACCESO TÁCTICO</Text>
              <Text style={styles.title}>CREDENCIAL DE AGENTE</Text>
              <Text style={styles.desc}>
                Sincroniza tu perfil para guardar tu progreso en los 5 distritos, mejoras del
                Hacker Deck, reloj Wear OS vinculado y tu fortaleza PvP.
              </Text>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>MODO HÍBRIDO ACTIVO</Text>
                <Text style={styles.infoBody}>
                  Si el servidor VPS está en línea se autentica por HTTPS/JWT; si estás en pruebas
                  locales, tu sesión y recursos se guardan en el dispositivo.
                </Text>
              </View>
            </View>

            {/* Columna derecha: Formulario */}
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <KeyRound size={16} color="#ffcc00" />
                <Text style={styles.formTitle}>INICIAR SESIÓN</Text>
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
                <Text style={styles.label}>CONTRASEÑA DE ACCESO</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor="#5a6b7e"
                  style={styles.input}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                disabled={loading}
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <LogIn size={16} color="#ffffff" />
                    <Text style={styles.submitBtnText}>AUTENTICAR Y ENTRAR</Text>
                  </>
                )}
              </Pressable>

              <Link href="/register" asChild>
                <Pressable style={styles.secondaryBtn}>
                  <UserPlus size={14} color="#ffcc00" />
                  <Text style={styles.secondaryBtnText}>REGISTRAR NUEVO AGENTE</Text>
                </Pressable>
              </Link>
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
    backgroundColor: 'rgba(7, 10, 16, 0.84)',
  },
  hazardTop: {
    height: 5,
    backgroundColor: '#ffb800',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 10,
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
    paddingVertical: 6,
    borderRadius: 6,
  },
  backText: {
    color: '#ffcc00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  securityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 230, 153, 0.1)',
    borderWidth: 1,
    borderColor: '#00E699',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  securityTagText: {
    color: '#00E699',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
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
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  desc: {
    color: '#b0c2d4',
    fontSize: 12,
    lineHeight: 17,
  },
  infoBox: {
    marginTop: 6,
    backgroundColor: 'rgba(18, 26, 36, 0.92)',
    borderWidth: 1.5,
    borderColor: '#2e4158',
    borderRadius: 8,
    padding: 10,
    gap: 3,
  },
  infoTitle: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  infoBody: {
    color: '#8fa5bc',
    fontSize: 11,
    lineHeight: 15,
  },
  formCard: {
    width: 340,
    backgroundColor: '#111822',
    borderWidth: 2,
    borderColor: '#ffcc00',
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#243242',
    paddingBottom: 6,
  },
  formTitle: {
    color: '#ffcc00',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  fieldGroup: {
    gap: 4,
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
    paddingVertical: 7,
    color: '#eef6ff',
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: '#ff4d6d',
    fontSize: 11,
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
    paddingVertical: 10,
    marginTop: 2,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 12,
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
    paddingVertical: 8,
  },
  secondaryBtnText: {
    color: '#ffcc00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
