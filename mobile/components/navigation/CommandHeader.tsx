// Barra superior para las pantallas internas en formato Horizontal (Landscape).
// Permite regresar al Menú de Modos (/?menu=1), muestra el título de la sección actual,
// los recursos del jugador (Créditos, Energía, Intel) y el estado del Smartwatch.
import React from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ArrowLeft,
  Coins,
  Cpu,
  Home,
  Watch,
  Zap,
} from 'lucide-react-native';
import type { PlayerSummary, WatchDeviceInfo } from '../../lib/api';

interface CommandHeaderProps {
  title: string;
  subtitle?: string;
  player?: PlayerSummary;
  watch?: WatchDeviceInfo | null;
  backTo?: string;
}

export function CommandHeader({
  title,
  subtitle,
  player,
  watch,
  backTo,
}: CommandHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backTo) {
      router.replace(backTo as any);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/?menu=1' as any);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.hazardTop} />
      <View style={styles.bar}>
        {/* Bloque izquierdo: Volver + Menú de Modos + Título */}
        <View style={styles.leftGroup}>
          <Pressable
            onPress={handleBack}
            style={styles.backBtn}
            accessibilityLabel="Volver"
          >
            <ArrowLeft size={15} color="#ffcc00" />
            <Text style={styles.backBtnText}>VOLVER</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/?menu=1' as any)}
            style={styles.iconBtn}
            accessibilityLabel="Menú de Modos"
          >
            <Home size={15} color="#9fb3c8" />
          </Pressable>

          <View style={styles.titleBox}>
            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitleText} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Bloque derecho: Recursos del jugador y estado del reloj */}
        {player ? (
          <View style={styles.resourcesGroup}>
            <View style={styles.resBadge}>
              <Coins size={12} color="#FFD700" />
              <Text style={[styles.resValue, { color: '#FFD700' }]}>{player.credits} CR</Text>
            </View>
            <View style={styles.resBadge}>
              <Zap size={12} color="#00F0FF" />
              <Text style={[styles.resValue, { color: '#00F0FF' }]}>{player.energy} EN</Text>
            </View>
            <View style={styles.resBadge}>
              <Cpu size={12} color="#BD00FF" />
              <Text style={[styles.resValue, { color: '#E299FF' }]}>{player.intel} IN</Text>
            </View>
            <Pressable
              onPress={() => router.push('/pair')}
              style={[
                styles.watchBadge,
                watch ? styles.watchBadgeLinked : styles.watchBadgeUnlinked,
              ]}
            >
              <Watch size={12} color={watch ? '#00E699' : '#FF8800'} />
              <Text
                style={[
                  styles.watchBadgeText,
                  { color: watch ? '#00E699' : '#FF8800' },
                ]}
              >
                {watch ? 'RELOJ ENLAZADO' : 'RELOJ NO ENLAZADO'}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#0c1118',
    borderBottomWidth: 2,
    borderBottomColor: '#253244',
  },
  hazardTop: {
    height: 4,
    backgroundColor: '#ffb800',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 10,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#151d28',
    borderWidth: 1.5,
    borderColor: '#ffcc00',
  },
  backBtnText: {
    color: '#ffcc00',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#151d28',
    borderWidth: 1.5,
    borderColor: '#334458',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBox: {
    marginLeft: 2,
    flexShrink: 1,
  },
  titleText: {
    color: '#ffcc00',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  subtitleText: {
    color: '#889bb0',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  resourcesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#121923',
    borderWidth: 1,
    borderColor: '#2a394a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  resValue: {
    fontSize: 10,
    fontWeight: '900',
  },
  watchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
  },
  watchBadgeLinked: {
    backgroundColor: 'rgba(0, 230, 153, 0.1)',
    borderColor: '#00E699',
  },
  watchBadgeUnlinked: {
    backgroundColor: 'rgba(255, 136, 0, 0.12)',
    borderColor: '#FF8800',
  },
  watchBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});
