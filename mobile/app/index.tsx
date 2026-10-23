// Pantalla de inicio de NEXO con selección de operador arcade 32-bit.
import React, { useEffect, useState } from 'react';
import { Link, useFocusEffect } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Play, Users } from 'lucide-react-native';
import { colors, withAlpha } from '../theme/colors';
import { API_URL } from '../lib/config';
import {
  CHARACTERS,
  getCharacterAvatar,
  getSelectedCharacter,
  type CharacterId,
} from '../lib/characters';

export default function Index() {
  const [characterId, setCharacterId] = useState<CharacterId>('jesus');

  // Recargar el operador activo cuando la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      getSelectedCharacter().then(setCharacterId);
    }, []),
  );

  const activeChar = CHARACTERS[characterId];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>NEXO</Text>
        <Text style={styles.tagline}>Infiltración táctica · Móvil + Reloj</Text>

        {/* Badge del Agente Activo (32-Bit Arcade) */}
        <Link href={'/character-select' as any} asChild>
          <Pressable style={StyleSheet.flatten([styles.agentPill, { borderColor: activeChar.accentColor }])}>
            <Image source={getCharacterAvatar(characterId)} style={styles.agentPillAvatar} />
            <View style={styles.agentPillText}>
              <Text style={styles.agentPillLabel}>AGENTE ACTIVO</Text>
              <Text style={[styles.agentPillName, { color: activeChar.accentColor }]}>
                {activeChar.name.toUpperCase()} · "{activeChar.alias}"
              </Text>
            </View>
          </Pressable>
        </Link>
      </View>

      <View style={styles.menu}>
        <Link href={'/character-select' as any} asChild>
          <Pressable
            style={StyleSheet.flatten([
              styles.button,
              { borderColor: activeChar.accentColor, backgroundColor: withAlpha(activeChar.accentColor, 0.14) },
            ])}
          >
            <Users size={18} color={activeChar.accentColor} />
            <Text style={[styles.buttonText, { color: activeChar.accentColor }]}>Selección de Agente (32-Bit)</Text>
          </Pressable>
        </Link>

        <Link href="/game/demo" asChild>
          <Pressable style={styles.button}>
            <Play size={18} color={colors.stealth} />
            <Text style={styles.buttonText}>Desplegar Operación (12×12)</Text>
          </Pressable>
        </Link>

        <Link href="/how-to-play" asChild>
          <Pressable style={StyleSheet.flatten([styles.button, styles.secondary])}>
            <BookOpen size={18} color={colors.text} />
            <Text style={[styles.buttonText, { color: colors.text }]}>Cómo jugar</Text>
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
    marginTop: 50,
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
    marginBottom: 24,
  },
  agentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#0c111c',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  agentPillAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  agentPillText: {
    alignItems: 'flex-start',
  },
  agentPillLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  agentPillName: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  menu: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.stealth,
    backgroundColor: withAlpha(colors.stealth, 0.12),
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondary: {
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: colors.panel,
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
