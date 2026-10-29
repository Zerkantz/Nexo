// Barra superior limpia y suave para las pantallas internas en formato Horizontal (Landscape).
import React from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ArrowLeft,
  Coins,
  Cpu,
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
      <View style={styles.bar}>
        <View style={styles.leftGroup}>
          <Pressable
            onPress={handleBack}
            style={styles.backBtn}
            accessibilityLabel="Volver"
          >
            <ArrowLeft size={15} color="#e2ecf5" />
            <Text style={styles.backBtnText}>Volver</Text>
          </Pressable>

          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {player ? (
          <View style={styles.resourcesGroup}>
            <View style={styles.resBadge}>
              <Coins size={12} color="#ffd166" />
              <Text style={styles.resValue}>{player.credits}</Text>
            </View>
            <View style={styles.resBadge}>
              <Zap size={12} color="#4cc9f0" />
              <Text style={styles.resValue}>{player.energy}</Text>
            </View>
            <View style={styles.resBadge}>
              <Cpu size={12} color="#c77dff" />
              <Text style={styles.resValue}>{player.intel}</Text>
            </View>
            <Pressable
              onPress={() => router.push('/pair')}
              style={[
                styles.watchBadge,
                watch ? styles.watchBadgeLinked : styles.watchBadgeUnlinked,
              ]}
            >
              <Watch size={12} color={watch ? '#06d6a0' : '#ffb703'} />
              <Text
                style={[
                  styles.watchBadgeText,
                  { color: watch ? '#06d6a0' : '#ffb703' },
                ]}
              >
                {watch ? 'Reloj activo' : 'Enlazar reloj'}
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
    backgroundColor: '#0d131c',
    borderBottomWidth: 1,
    borderBottomColor: '#1e2b3c',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#16202e',
    borderWidth: 1,
    borderColor: '#2b3b4e',
  },
  backBtnText: {
    color: '#e2ecf5',
    fontSize: 11,
    fontWeight: '700',
  },
  titleText: {
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resourcesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#141d29',
    borderWidth: 1,
    borderColor: '#233246',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  resValue: {
    color: '#e2ecf5',
    fontSize: 11,
    fontWeight: '700',
  },
  watchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  watchBadgeLinked: {
    backgroundColor: 'rgba(6, 214, 160, 0.1)',
    borderColor: 'rgba(6, 214, 160, 0.45)',
  },
  watchBadgeUnlinked: {
    backgroundColor: 'rgba(255, 183, 3, 0.1)',
    borderColor: 'rgba(255, 183, 3, 0.45)',
  },
  watchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
