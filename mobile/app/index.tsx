// Pantalla de inicio TEMPORAL (Día 1). Cuando estén Login y Hub, esta pantalla
// redirigirá a /(auth)/login o a /(tabs) según haya token o no.
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, withAlpha } from '../theme/colors';
import { API_URL } from '../lib/config';

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>NEXO</Text>
        <Text style={styles.tagline}>Infiltración táctica · Móvil + Reloj</Text>
      </View>

      <View style={styles.menu}>
        <Link href="/game/demo" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Probar tablero (datos falsos)</Text>
          </Pressable>
        </Link>
      </View>

      <Text style={styles.footer}>Servidor: {API_URL}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 80,
    alignItems: 'center',
  },
  logo: {
    color: colors.stealth,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 12,
    textShadowColor: colors.stealth,
    textShadowRadius: 18,
  },
  tagline: {
    color: colors.textMuted,
    marginTop: 8,
    letterSpacing: 1,
  },
  menu: {
    gap: 12,
  },
  button: {
    borderWidth: 1.5,
    borderColor: colors.stealth,
    backgroundColor: withAlpha(colors.stealth, 0.12),
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.stealth,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footer: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});
