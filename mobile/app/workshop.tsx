// Pantalla del Taller Deck en formato Horizontal (Landscape).
// Desde aquí el jugador mejora el Hacker Deck (Sección 7), equipa habilidades del reloj (Sección 6),
// entra a su Base PvP 10x10 (/base) y consulta su Perfil de Agente (/profile).
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BatteryCharging,
  Check,
  Coins,
  Cpu,
  Lock,
  PlusCircle,
  Radio,
  Shield,
  User,
  Watch,
  Wrench,
  Zap,
} from 'lucide-react-native';
import { CommandHeader } from '../components/navigation/CommandHeader';
import type { SkillCode, UpgradeType } from '../lib/api';
import {
  DEFAULT_PROFILE_STATE,
  loadPlayerProfile,
  purchaseUpgrade,
  savePlayerProfile,
  SKILL_CATALOG,
  toggleEquipSkill,
  UPGRADE_CATALOG,
  type PlayerProfileState,
} from '../lib/playerStore';
import { upgradesApi } from '../lib/api';

export default function WorkshopScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfileState>(DEFAULT_PROFILE_STATE);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    loadPlayerProfile().then(setProfile);
  }, []);

  const handleBuyUpgrade = async (type: UpgradeType) => {
    const res = await purchaseUpgrade(type);
    setProfile(res.profile);
    setStatusMsg({ ok: res.ok, text: res.message });
  };

  const handleToggleSkill = async (code: SkillCode) => {
    const res = await toggleEquipSkill(code);
    setProfile(res.profile);
    setStatusMsg({ ok: res.ok, text: res.message });
  };

  const handleGrantDemoResources = async () => {
    try {
      await upgradesApi.grantSupplies();
    } catch {
      // Respaldo local
    }
    const next = await savePlayerProfile({
      ...profile,
      player: {
        ...profile.player,
        credits: profile.player.credits + 500,
        energy: profile.player.energy + 150,
        intel: profile.player.intel + 60,
      },
      unlockedSkills: SKILL_CATALOG.map((s) => s.code),
    });
    setProfile(next);
    setStatusMsg({
      ok: true,
      text: 'Suministros acreditados en MySQL (+500 CR, +150 EN, +60 IN) y modulos desbloqueados.',
    });
  };

  const discount =
    profile.upgrades.efficiency === 3 ? 10 : profile.upgrades.efficiency === 2 ? 5 : 0;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden />
      <CommandHeader
        title="TALLER DECK // EQUIPAMIENTO, BASE Y PERFIL"
        subtitle="MEJORA TU RELOJ, EDITA TU BASE 10x10 O REVISA TU EXPEDIENTE"
        player={profile.player}
        watch={profile.watch}
        backTo="/?menu=1"
      />

      {/* Barra de navegación interna del Taller Deck: acceso directo a Mi Base y Perfil */}
      <View style={styles.hubNavRow}>
        <View style={[styles.hubNavBtn, styles.hubNavBtnActive]}>
          <Wrench size={14} color="#0b0e14" />
          <Text style={[styles.hubNavText, styles.hubNavTextActive]}>
            MEJORAS Y MÓDULOS DECK
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/base')}
          style={[styles.hubNavBtn, styles.hubNavBtnBase]}
        >
          <Shield size={14} color="#00E699" />
          <Text style={[styles.hubNavText, { color: '#00E699' }]}>
            ENTRAR A MI BASE (EDITOR 10x10)
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/profile')}
          style={[styles.hubNavBtn, styles.hubNavBtnProfile]}
        >
          <User size={14} color="#00F0FF" />
          <Text style={[styles.hubNavText, { color: '#00F0FF' }]}>
            VER MI PERFIL Y BITÁCORA
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/pair')}
          style={[styles.hubNavBtn, styles.hubNavBtnWatch]}
        >
          <Watch size={14} color="#ffcc00" />
          <Text style={[styles.hubNavText, { color: '#ffcc00' }]}>
            ENLAZAR RELOJ
          </Text>
        </Pressable>
      </View>

      {statusMsg ? (
        <View
          style={[
            styles.banner,
            statusMsg.ok ? styles.bannerOk : styles.bannerErr,
          ]}
        >
          <Text
            style={[
              styles.bannerText,
              { color: statusMsg.ok ? '#00E699' : '#ff4d6d' },
            ]}
          >
            {statusMsg.text}
          </Text>
        </View>
      ) : null}

      <View style={styles.body}>
        {/* Columna Izquierda: Las 3 Mejoras del Reloj */}
        <View style={styles.leftColumn}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <Wrench size={14} color="#ffcc00" />
              <Text style={styles.sectionTitle}>MEJORAS DE HARDWARE (NIVEL 1 A 3)</Text>
            </View>
            <Pressable onPress={handleGrantDemoResources} style={styles.supplyBtn}>
              <PlusCircle size={11} color="#00F0FF" />
              <Text style={styles.supplyBtnText}>+SUMINISTROS DEMO</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.upgradesList}>
            {UPGRADE_CATALOG.map((item) => {
              const currentLv = profile.upgrades[item.type];
              const currentInfo = item.tiers[currentLv - 1];
              const nextInfo =
                currentLv === 1 ? item.tiers[1] : currentLv === 2 ? item.tiers[2] : null;

              return (
                <View key={item.type} style={styles.upgradeCard}>
                  <View style={styles.upgradeTopRow}>
                    <View style={styles.upgradeTitleCol}>
                      <Text style={styles.upgradeName}>{item.name}</Text>
                      <Text style={styles.upgradeSub}>{item.subtitle}</Text>
                    </View>

                    <View style={styles.levelPips}>
                      {[1, 2, 3].map((lv) => (
                        <View
                          key={lv}
                          style={[
                            styles.pip,
                            lv <= currentLv && styles.pipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.pipText,
                              lv <= currentLv && styles.pipTextActive,
                            ]}
                          >
                            N{lv}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.upgradeFooterRow}>
                    <View style={styles.benefitCol}>
                      <Text style={styles.currentBenefit}>ACTUAL: {currentInfo.label}</Text>
                      {nextInfo ? (
                        <Text style={styles.nextBenefit}>SIGUIENTE: {nextInfo.label}</Text>
                      ) : (
                        <Text style={styles.maxedBenefit}>MÁXIMA CAPACIDAD ALCANZADA</Text>
                      )}
                    </View>

                    {nextInfo ? (
                      <Pressable
                        onPress={() => handleBuyUpgrade(item.type)}
                        style={styles.buyBtn}
                      >
                        <Text style={styles.buyBtnTitle}>MEJORAR A NV.{nextInfo.level}</Text>
                        <View style={styles.costRow}>
                          {nextInfo.costCredits > 0 ? (
                            <View style={styles.costItem}>
                              <Coins size={10} color="#FFD700" />
                              <Text style={[styles.costText, { color: '#FFD700' }]}>
                                {nextInfo.costCredits}
                              </Text>
                            </View>
                          ) : null}
                          {nextInfo.costEnergy > 0 ? (
                            <View style={styles.costItem}>
                              <Zap size={10} color="#00F0FF" />
                              <Text style={[styles.costText, { color: '#00F0FF' }]}>
                                {nextInfo.costEnergy}
                              </Text>
                            </View>
                          ) : null}
                          {nextInfo.costIntel > 0 ? (
                            <View style={styles.costItem}>
                              <Cpu size={10} color="#E299FF" />
                              <Text style={[styles.costText, { color: '#E299FF' }]}>
                                {nextInfo.costIntel}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </Pressable>
                    ) : (
                      <View style={styles.maxBadge}>
                        <Check size={13} color="#00E699" />
                        <Text style={styles.maxBadgeText}>NV. 3 MÁX</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Columna Derecha: Equipamiento de Habilidades del Reloj */}
        <View style={styles.rightColumn}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <Radio size={14} color="#00F0FF" />
              <Text style={styles.sectionTitle}>
                HABILIDADES DEL RELOJ ({profile.equippedSkills.length}/4 EQUIPADAS + HACK)
              </Text>
            </View>
            {discount > 0 ? (
              <View style={styles.discountBadge}>
                <BatteryCharging size={11} color="#00E699" />
                <Text style={styles.discountText}>AHORRO -{discount}% BAT</Text>
              </View>
            ) : null}
          </View>

          <ScrollView contentContainerStyle={styles.skillsGrid}>
            {SKILL_CATALOG.map((skill) => {
              const unlocked = profile.unlockedSkills.includes(skill.code);
              const equipped = profile.equippedSkills.includes(skill.code);
              const finalCost = Math.max(5, skill.cost - discount);

              return (
                <Pressable
                  key={skill.code}
                  onPress={() => handleToggleSkill(skill.code)}
                  style={[
                    styles.skillCard,
                    equipped && styles.skillCardEquipped,
                    !unlocked && styles.skillCardLocked,
                  ]}
                >
                  <View style={styles.skillTop}>
                    <Text style={styles.skillName} numberOfLines={1}>
                      {skill.name}
                    </Text>
                    <View style={styles.skillCostPill}>
                      <Text style={styles.skillCostText}>{finalCost}% BAT</Text>
                    </View>
                  </View>

                  <Text style={styles.skillEffect} numberOfLines={2}>
                    {skill.effect}
                  </Text>

                  <View style={styles.skillBottom}>
                    <Text style={styles.skillOrigin}>
                      {skill.unlockedAtLevel === 0
                        ? 'MÓDULO INICIAL'
                        : `NIVEL ${skill.unlockedAtLevel}`}
                    </Text>

                    {!unlocked ? (
                      <View style={styles.skillStateLocked}>
                        <Lock size={10} color="#7B8CA6" />
                        <Text style={styles.skillStateLockedText}>BLOQUEADA</Text>
                      </View>
                    ) : equipped ? (
                      <View style={styles.skillStateEquipped}>
                        <Check size={10} color="#0b0e14" />
                        <Text style={styles.skillStateEquippedText}>EQUIPADA</Text>
                      </View>
                    ) : (
                      <View style={styles.skillStateAvailable}>
                        <Text style={styles.skillStateAvailableText}>EQUIPAR</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
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
  hubNavRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 8,
  },
  hubNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#101722',
    borderWidth: 1.5,
    borderColor: '#2a3b4e',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 7,
  },
  hubNavBtnActive: {
    backgroundColor: '#ffcc00',
    borderColor: '#ffffff',
  },
  hubNavBtnBase: {
    borderColor: '#00E699',
    backgroundColor: 'rgba(0, 230, 153, 0.08)',
  },
  hubNavBtnProfile: {
    borderColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  hubNavBtnWatch: {
    flex: 0.7,
    borderColor: '#ffcc00',
  },
  hubNavText: {
    color: '#d8e6f4',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  hubNavTextActive: {
    color: '#0b0e14',
  },
  banner: {
    marginHorizontal: 14,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  bannerOk: {
    backgroundColor: 'rgba(0, 230, 153, 0.1)',
    borderColor: '#00E699',
  },
  bannerErr: {
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
    borderColor: '#ff4d6d',
  },
  bannerText: {
    fontSize: 10,
    fontWeight: '800',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 14,
  },
  leftColumn: {
    flex: 1.05,
    gap: 6,
  },
  rightColumn: {
    flex: 1,
    gap: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: '#d8e6f4',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  supplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#131d29',
    borderWidth: 1,
    borderColor: '#00F0FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  supplyBtnText: {
    color: '#00F0FF',
    fontSize: 8,
    fontWeight: '900',
  },
  upgradesList: {
    gap: 8,
    paddingBottom: 8,
  },
  upgradeCard: {
    backgroundColor: '#101722',
    borderWidth: 1.5,
    borderColor: '#273749',
    borderRadius: 9,
    padding: 10,
    gap: 7,
  },
  upgradeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  upgradeTitleCol: {
    flex: 1,
    gap: 2,
  },
  upgradeName: {
    color: '#ffcc00',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  upgradeSub: {
    color: '#8ca1b7',
    fontSize: 9,
    lineHeight: 13,
  },
  levelPips: {
    flexDirection: 'row',
    gap: 4,
  },
  pip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#090d13',
    borderWidth: 1,
    borderColor: '#2c3d50',
  },
  pipActive: {
    backgroundColor: '#ffcc00',
    borderColor: '#ffffff',
  },
  pipText: {
    color: '#6e8297',
    fontSize: 8,
    fontWeight: '900',
  },
  pipTextActive: {
    color: '#0b0e14',
  },
  upgradeFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e2c3b',
    paddingTop: 6,
  },
  benefitCol: {
    flex: 1,
    gap: 1,
  },
  currentBenefit: {
    color: '#eef6ff',
    fontSize: 10,
    fontWeight: '800',
  },
  nextBenefit: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: '700',
  },
  maxedBenefit: {
    color: '#00E699',
    fontSize: 9,
    fontWeight: '800',
  },
  buyBtn: {
    backgroundColor: '#d83800',
    borderWidth: 1.5,
    borderColor: '#ffcc00',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    gap: 2,
  },
  buyBtnTitle: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  costRow: {
    flexDirection: 'row',
    gap: 6,
  },
  costItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  costText: {
    fontSize: 9,
    fontWeight: '900',
  },
  maxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 230, 153, 0.1)',
    borderWidth: 1,
    borderColor: '#00E699',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5,
  },
  maxBadgeText: {
    color: '#00E699',
    fontSize: 9,
    fontWeight: '900',
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 230, 153, 0.12)',
    borderWidth: 1,
    borderColor: '#00E699',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountText: {
    color: '#00E699',
    fontSize: 8,
    fontWeight: '900',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingBottom: 8,
  },
  skillCard: {
    width: '48.5%',
    backgroundColor: '#101722',
    borderWidth: 1.5,
    borderColor: '#253547',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between',
    gap: 5,
  },
  skillCardEquipped: {
    borderColor: '#00E699',
    backgroundColor: '#112224',
  },
  skillCardLocked: {
    opacity: 0.65,
  },
  skillTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  skillName: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    flex: 1,
  },
  skillCostPill: {
    backgroundColor: '#090d13',
    borderWidth: 1,
    borderColor: '#00F0FF',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  skillCostText: {
    color: '#00F0FF',
    fontSize: 8,
    fontWeight: '900',
  },
  skillEffect: {
    color: '#95aac0',
    fontSize: 9,
    lineHeight: 12,
  },
  skillBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  skillOrigin: {
    color: '#768ca3',
    fontSize: 8,
    fontWeight: '800',
  },
  skillStateLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  skillStateLockedText: {
    color: '#7B8CA6',
    fontSize: 8,
    fontWeight: '900',
  },
  skillStateEquipped: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#00E699',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  skillStateEquippedText: {
    color: '#0b0e14',
    fontSize: 8,
    fontWeight: '900',
  },
  skillStateAvailable: {
    borderWidth: 1,
    borderColor: '#ffcc00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  skillStateAvailableText: {
    color: '#ffcc00',
    fontSize: 8,
    fontWeight: '900',
  },
});
