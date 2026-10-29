// Pantalla del Taller Deck en formato Horizontal (Landscape) con diseno suave, limpio e intuitivo.
// Separa en 2 pestanas limpias ("Modulos del Reloj" y "Mejoras") y explica paso a paso
// como utilizar cada modulo dentro de la partida.
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Check,
  Lock,
  PlusCircle,
  Radio,
  Shield,
  User,
  Wrench,
} from 'lucide-react-native';
import { CommandHeader } from '../components/navigation/CommandHeader';
import { upgradesApi, type SkillCode, type UpgradeType } from '../lib/api';
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

const MODULE_HOW_TO_USE: Record<SkillCode, { whenToUse: string; howToTrigger: string }> = {
  SCANNER: {
    whenToUse: 'Usalo antes de entrar a un pasillo estrecho donde sospeches que hay minas ocultas.',
    howToTrigger:
      'Equipalo aqui y, durante la partida, presionalo en tu Smartwatch o en el panel derecho del movil. Revelara todas las minas cercanas sin activarlas.',
  },
  SABOTAGE: {
    whenToUse: 'Ideal cuando una camara vigila una Terminal o el unico paso hacia tu objetivo.',
    howToTrigger:
      'Acercate a la camara y pulsa Sabotaje en tu reloj o en la pantalla de juego. La camara mas cercana se apagara durante 4 turnos.',
  },
  CAMOUFLAGE: {
    whenToUse: 'Perfecto para cruzar frente a guardias o camaras cuando no puedes rodearlos.',
    howToTrigger:
      'Activalo antes de entrar al cono naranja o rojo. Durante 3 turnos los enemigos no podran verte ni sumaran alerta.',
  },
  OVERLOAD: {
    whenToUse: 'Cuando una mina laser te cierre el paso y necesites eliminarla definitivamente.',
    howToTrigger:
      'Pulsa Sobrecarga a menos de 4 casillas de la mina; quedara destruida al instante para que puedas caminar por esa casilla.',
  },
  RADAR: {
    whenToUse: 'Cuando no estes seguro de donde se encuentra la salida o el siguiente sector.',
    howToTrigger:
      'Al activarlo, la pantalla de tu Smartwatch mostrara una brujula con la direccion y distancia exacta hacia la meta.',
  },
  EMP: {
    whenToUse: 'Cuando un guardia o un dron rapido este a punto de alcanzarte en un corredor.',
    howToTrigger:
      'Pulsa Pulso PEM para congelar al enemigo mas cercano en su lugar y apagar su vision durante 4 turnos.',
  },
  THERMAL: {
    whenToUse: 'En niveles avanzados con muchas trampas repartidas por distintas salas.',
    howToTrigger:
      'Con un solo toque hace visibles absolutamente todas las minas laser de todo el sector actual.',
  },
  TIMEDILATE: {
    whenToUse: 'En situaciones criticas donde varios guardias y camaras vigilan la boveda final.',
    howToTrigger:
      'Al activarlo, detiene al mismo tiempo a todos los guardias, drones y camaras del mapa durante 2 turnos completos.',
  },
};

export default function WorkshopScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfileState>(DEFAULT_PROFILE_STATE);
  const [activeTab, setActiveTab] = useState<'MODULES' | 'UPGRADES'>('MODULES');
  const [selectedSkill, setSelectedSkill] = useState<SkillCode>('SCANNER');
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
      text: 'Se agregaron +500 Creditos, +150 Energia, +60 Intel y se desbloquearon todos los modulos.',
    });
  };

  const discount =
    profile.upgrades.efficiency === 3 ? 10 : profile.upgrades.efficiency === 2 ? 5 : 0;

  const currentSkillDef =
    SKILL_CATALOG.find((s) => s.code === selectedSkill) ?? SKILL_CATALOG[0];
  const isCurrentUnlocked = profile.unlockedSkills.includes(currentSkillDef.code);
  const isCurrentEquipped = profile.equippedSkills.includes(currentSkillDef.code);
  const currentFinalCost = Math.max(5, currentSkillDef.cost - discount);
  const guide = MODULE_HOW_TO_USE[currentSkillDef.code];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden />
      <CommandHeader
        title="Taller Deck"
        player={profile.player}
        watch={profile.watch}
        backTo="/?menu=1"
      />

      {/* Barra superior suave: Pestanas del Taller + Accesos a Mi Base y Perfil */}
      <View style={styles.topNavBar}>
        <View style={styles.tabsGroup}>
          <Pressable
            onPress={() => {
              setActiveTab('MODULES');
              setStatusMsg(null);
            }}
            style={[styles.tabBtn, activeTab === 'MODULES' && styles.tabBtnActive]}
          >
            <Radio size={14} color={activeTab === 'MODULES' ? '#090e16' : '#cbd5e1'} />
            <Text style={[styles.tabText, activeTab === 'MODULES' && styles.tabTextActive]}>
              Modulos del Reloj ({profile.equippedSkills.length}/4)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setActiveTab('UPGRADES');
              setStatusMsg(null);
            }}
            style={[styles.tabBtn, activeTab === 'UPGRADES' && styles.tabBtnActive]}
          >
            <Wrench size={14} color={activeTab === 'UPGRADES' ? '#090e16' : '#cbd5e1'} />
            <Text style={[styles.tabText, activeTab === 'UPGRADES' && styles.tabTextActive]}>
              Mejoras del Reloj
            </Text>
          </Pressable>
        </View>

        <View style={styles.quickLinksGroup}>
          <Pressable onPress={handleGrantDemoResources} style={styles.quickLinkBtn}>
            <PlusCircle size={13} color="#4cc9f0" />
            <Text style={[styles.quickLinkText, { color: '#4cc9f0' }]}>+Recursos</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/base')} style={styles.quickLinkBtn}>
            <Shield size={13} color="#06d6a0" />
            <Text style={[styles.quickLinkText, { color: '#06d6a0' }]}>Mi Base</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/profile')} style={styles.quickLinkBtn}>
            <User size={13} color="#ffd166" />
            <Text style={[styles.quickLinkText, { color: '#ffd166' }]}>Mi Perfil</Text>
          </Pressable>
        </View>
      </View>

      {statusMsg ? (
        <View style={[styles.banner, statusMsg.ok ? styles.bannerOk : styles.bannerErr]}>
          <Text style={[styles.bannerText, { color: statusMsg.ok ? '#06d6a0' : '#ff6b82' }]}>
            {statusMsg.text}
          </Text>
        </View>
      ) : null}

      {/* VISTA 1: MODULOS DEL RELOJ (LISTA LIMPIA A LA IZQUIERDA + EXPLICACION CLARA A LA DERECHA) */}
      {activeTab === 'MODULES' ? (
        <View style={styles.body}>
          <View style={styles.leftListCol}>
            <ScrollView contentContainerStyle={styles.modulesList}>
              {SKILL_CATALOG.map((skill) => {
                const isSelected = skill.code === selectedSkill;
                const unlocked = profile.unlockedSkills.includes(skill.code);
                const equipped = profile.equippedSkills.includes(skill.code);

                return (
                  <Pressable
                    key={skill.code}
                    onPress={() => {
                      setSelectedSkill(skill.code);
                      setStatusMsg(null);
                    }}
                    style={[
                      styles.moduleItem,
                      isSelected && styles.moduleItemSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.moduleItemName,
                        !unlocked && { color: '#64748b' },
                      ]}
                      numberOfLines={1}
                    >
                      {skill.name}
                    </Text>

                    {!unlocked ? (
                      <Lock size={14} color="#64748b" />
                    ) : equipped ? (
                      <View style={styles.equippedTag}>
                        <Check size={11} color="#090e16" />
                        <Text style={styles.equippedTagText}>Activo</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Panel derecho: Explicacion clara de que hace y como se usa el modulo seleccionado */}
          <View style={styles.rightDetailCard}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailName}>{currentSkillDef.name}</Text>
                <Text style={styles.detailCost}>
                  Consumo en partida: {currentFinalCost}% de bateria
                </Text>
              </View>

              {isCurrentEquipped ? (
                <View style={styles.statusEquippedBadge}>
                  <Text style={styles.statusEquippedText}>Equipado en tu Reloj</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.guideSection}>
              <Text style={styles.guideLabel}>¿Que hace este modulo?</Text>
              <Text style={styles.guideBody}>{currentSkillDef.effect}</Text>
            </View>

            <View style={styles.guideSection}>
              <Text style={styles.guideLabel}>¿Como y cuando utilizarlo?</Text>
              <Text style={styles.guideBody}>
                {guide.whenToUse} {guide.howToTrigger}
              </Text>
            </View>

            <View style={styles.detailFooter}>
              <Text style={styles.slotHint}>
                Puedes llevar hasta 4 modulos activos al mismo tiempo ({profile.equippedSkills.length}/4).
              </Text>

              {!isCurrentUnlocked ? (
                <Pressable onPress={handleGrantDemoResources} style={styles.unlockActionBtn}>
                  <Lock size={14} color="#ffd166" />
                  <Text style={styles.unlockActionText}>
                    Se desbloquea en Nivel {currentSkillDef.unlockedAtLevel} (Toca para habilitar)
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => handleToggleSkill(currentSkillDef.code)}
                  style={[
                    styles.equipActionBtn,
                    isCurrentEquipped && styles.unequipActionBtn,
                  ]}
                >
                  <Text style={styles.equipActionText}>
                    {isCurrentEquipped ? 'Quitar del Reloj' : 'Equipar en el Reloj'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      ) : (
        /* VISTA 2: MEJORAS DE HARDWARE (3 TARJETAS LIMPIAS Y CLARAS) */
        <ScrollView contentContainerStyle={styles.upgradesContainer}>
          {UPGRADE_CATALOG.map((item) => {
            const currentLv = profile.upgrades[item.type];
            const currentInfo = item.tiers[currentLv - 1];
            const nextInfo =
              currentLv === 1 ? item.tiers[1] : currentLv === 2 ? item.tiers[2] : null;

            return (
              <View key={item.type} style={styles.upgradeCard}>
                <View style={styles.upgradeLeft}>
                  <Text style={styles.upgradeTitle}>
                    {item.name} · Nivel {currentLv}/3
                  </Text>
                  <Text style={styles.upgradeDesc}>{item.subtitle}</Text>
                  <Text style={styles.upgradeEffect}>
                    Efecto actual: {currentInfo.label}
                    {nextInfo ? `  ->  Siguiente: ${nextInfo.label}` : ' (Nivel Maximo)'}
                  </Text>
                </View>

                {nextInfo ? (
                  <Pressable
                    onPress={() => handleBuyUpgrade(item.type)}
                    style={styles.buyUpgradeBtn}
                  >
                    <Text style={styles.buyUpgradeBtnTitle}>
                      Mejorar a Nivel {nextInfo.level}
                    </Text>
                    <Text style={styles.buyUpgradeBtnCost}>
                      {nextInfo.costCredits > 0 ? `${nextInfo.costCredits} CR  ` : ''}
                      {nextInfo.costEnergy > 0 ? `${nextInfo.costEnergy} EN  ` : ''}
                      {nextInfo.costIntel > 0 ? `${nextInfo.costIntel} IN` : ''}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.maxedPill}>
                    <Check size={14} color="#06d6a0" />
                    <Text style={styles.maxedPillText}>Completado</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#090e16',
  },
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 12,
  },
  tabsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#111926',
    borderWidth: 1,
    borderColor: '#233246',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#ffd166',
    borderColor: '#ffd166',
  },
  tabText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#090e16',
    fontWeight: '800',
  },
  quickLinksGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  quickLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111926',
    borderWidth: 1,
    borderColor: '#233246',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  quickLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  banner: {
    marginHorizontal: 18,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  bannerOk: {
    backgroundColor: 'rgba(6, 214, 160, 0.1)',
    borderColor: 'rgba(6, 214, 160, 0.4)',
  },
  bannerErr: {
    backgroundColor: 'rgba(255, 107, 130, 0.1)',
    borderColor: 'rgba(255, 107, 130, 0.4)',
  },
  bannerText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 18,
  },
  leftListCol: {
    width: '36%',
  },
  modulesList: {
    gap: 7,
    paddingBottom: 8,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111926',
    borderWidth: 1.5,
    borderColor: '#1e2b3c',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  moduleItemSelected: {
    borderColor: '#4cc9f0',
    backgroundColor: '#162336',
  },
  moduleItemName: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  equippedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#06d6a0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  equippedTagText: {
    color: '#090e16',
    fontSize: 10,
    fontWeight: '800',
  },
  rightDetailCard: {
    flex: 1,
    backgroundColor: '#111926',
    borderWidth: 1.5,
    borderColor: '#1e2b3c',
    borderRadius: 16,
    padding: 18,
    justifyContent: 'space-between',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  detailCost: {
    color: '#4cc9f0',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  statusEquippedBadge: {
    backgroundColor: 'rgba(6, 214, 160, 0.14)',
    borderWidth: 1,
    borderColor: '#06d6a0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusEquippedText: {
    color: '#06d6a0',
    fontSize: 11,
    fontWeight: '700',
  },
  guideSection: {
    backgroundColor: '#0c131d',
    borderWidth: 1,
    borderColor: '#1e2b3c',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  guideLabel: {
    color: '#ffd166',
    fontSize: 12,
    fontWeight: '800',
  },
  guideBody: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  detailFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e2b3c',
  },
  slotHint: {
    color: '#94a3b8',
    fontSize: 11.5,
    flex: 1,
  },
  equipActionBtn: {
    backgroundColor: '#06d6a0',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
  },
  unequipActionBtn: {
    backgroundColor: '#334155',
  },
  equipActionText: {
    color: '#090e16',
    fontSize: 13,
    fontWeight: '800',
  },
  unlockActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#182436',
    borderWidth: 1,
    borderColor: '#ffd166',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  unlockActionText: {
    color: '#ffd166',
    fontSize: 11.5,
    fontWeight: '700',
  },
  upgradesContainer: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 10,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111926',
    borderWidth: 1.5,
    borderColor: '#1e2b3c',
    borderRadius: 14,
    padding: 16,
    gap: 16,
  },
  upgradeLeft: {
    flex: 1,
    gap: 4,
  },
  upgradeTitle: {
    color: '#ffd166',
    fontSize: 15,
    fontWeight: '800',
  },
  upgradeDesc: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  upgradeEffect: {
    color: '#4cc9f0',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  buyUpgradeBtn: {
    backgroundColor: '#d83800',
    borderWidth: 1.5,
    borderColor: '#ffcc00',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  buyUpgradeBtnTitle: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  buyUpgradeBtnCost: {
    color: '#ffd166',
    fontSize: 11,
    fontWeight: '700',
  },
  maxedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(6, 214, 160, 0.12)',
    borderWidth: 1,
    borderColor: '#06d6a0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  maxedPillText: {
    color: '#06d6a0',
    fontSize: 12,
    fontWeight: '700',
  },
});
