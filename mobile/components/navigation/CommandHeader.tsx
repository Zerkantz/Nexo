// Barra superior compartida para las pantallas del Centro de Mando en formato Horizontal (Landscape).
// Muestra navegación rápida entre secciones, recursos del jugador (Créditos, Energía, Intel)
// y estado del Smartwatch vinculado.
import React from 'react';
import { Link, usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ArrowLeft,
  Coins,
  Cpu,
  Globe,
  Home,
  Map,
  Shield,
  User,
  Watch,
  Wrench,
  Zap,
} from 'lucide-react-native';
import type { PlayerSummary, WatchDeviceInfo } from '../../lib/api';

interface CommandHeaderProps {
  title: string;
  subtitle?: string;
  player?: PlayerSummary;
  watch?: WatchDeviceInfo | null;
}

const NAV_ITEMS = [
  { href: '/missions', label: 'NIVELES', Icon: Map },
  { href: '/workshop', label: 'TALLER', Icon: Wrench },
  { href: '/online', label: 'ONLINE', Icon: Globe },
  { href: '/base', label: 'MI BASE', Icon: Shield },
  { href: '/pair', label: 'RELOJ', Icon: Watch },
  { href: '/profile', label: 'PERFIL', Icon: User },
] as const;

export function CommandHeader({ title, subtitle, player, watch }: CommandHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.wrapper}>
      <View style={styles.hazardTop} />
      <View style={styles.bar}>
        {/* Bloque izquierdo: Volver al inicio + Título */}
        <View style={styles.leftGroup}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={styles.iconBtn}
            accessibilityLabel="Volver"
          >
            <ArrowLeft size={16} color="#ffcc00" />
          </Pressable>
          <Link href="/" asChild>
            <Pressable style={styles.iconBtn} accessibilityLabel="Menú Principal">
              <Home size={16} color="#9fb3c8" />
            </Pressable>
          </Link>
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

        {/* Bloque central: Pestañas de navegación rápida */}
        <View style={styles.navTabs}>
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href as any} asChild>
                <Pressable style={[styles.navTab, active && styles.navTabActive]}>
                  <Icon size={12} color={active ? '#0b0e14' : '#ffcc00'} />
                  <Text style={[styles.navTabText, active && styles.navTabTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>

        {/* Bloque derecho: Recursos del jugador y estado del reloj */}
        {player ? (
          <View style={styles.resourcesGroup}>
            <View style={styles.resBadge}>
              <Coins size={12} color="#FFD700" />
              <Text style={[styles.resValue, { color: '#FFD700' }]}>{player.credits}</Text>
            </View>
            <View style={styles.resBadge}>
              <Zap size={12} color="#00F0FF" />
              <Text style={[styles.resValue, { color: '#00F0FF' }]}>{player.energy}</Text>
            </View>
            <View style={styles.resBadge}>
              <Cpu size={12} color="#BD00FF" />
              <Text style={[styles.resValue, { color: '#E299FF' }]}>{player.intel}</Text>
            </View>
            <Link href="/pair" asChild>
              <Pressable
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
                  {watch ? 'DECK OK' : 'SIN RELOJ'}
                </Text>
              </Pressable>
            </Link>
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
    gap: 6,
    flexShrink: 1,
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
  navTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#141c26',
    borderWidth: 1,
    borderColor: '#2c3b4e',
  },
  navTabActive: {
    backgroundColor: '#ffcc00',
    borderColor: '#ffffff',
  },
  navTabText: {
    color: '#d4e2f0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  navTabTextActive: {
    color: '#0b0e14',
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
    paddingHorizontal: 7,
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
    paddingHorizontal: 7,
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
