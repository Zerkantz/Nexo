// Editor de Base PvP (Cuadrícula 10x10) en formato Horizontal (Landscape).
// Permite colocar Muros, Puertas, Cámaras, Guardias, Trampas, Entrada y Bóveda,
// ejecuta validación BFS en vivo (Sección 8.2) y permite publicar o probar la base.
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Save,
  UploadCloud,
} from 'lucide-react-native';
import { CommandHeader } from '../components/navigation/CommandHeader';
import { CAMERA_SPRITES, GUARD_SPRITES, TILE_ASSETS } from '../lib/environmentAssets';
import {
  DEFAULT_PROFILE_STATE,
  loadPlayerProfile,
  saveAndPublishBase,
  validateBaseBFS,
  type BaseEntityPlacement,
  type PlayerBaseConfig,
  type PlayerProfileState,
} from '../lib/playerStore';

type ToolType =
  | 'FLOOR'
  | 'WALL'
  | 'DOOR'
  | 'CAMERA'
  | 'GUARD'
  | 'TRAP'
  | 'START'
  | 'VAULT';

interface ToolItem {
  id: ToolType;
  label: string;
  cost: string;
  color: string;
}

const TOOLS: ToolItem[] = [
  { id: 'FLOOR', label: 'Piso Libre', cost: '0 CR', color: '#4f657d' },
  { id: 'WALL', label: 'Muro Blindado', cost: '10 CR', color: '#8fa5bc' },
  { id: 'DOOR', label: 'Puerta Hack', cost: '35 CR', color: '#ffcc00' },
  { id: 'CAMERA', label: 'Cámara Óptica', cost: '50 CR', color: '#ff2e4c' },
  { id: 'GUARD', label: 'Guardia Patrulla', cost: '75 CR', color: '#ff8800' },
  { id: 'TRAP', label: 'Trampa Láser', cost: '40 CR', color: '#bd00ff' },
  { id: 'START', label: 'Entrada (Única)', cost: 'FIJO', color: '#00F0FF' },
  { id: 'VAULT', label: 'Bóveda (Única)', cost: 'FIJO', color: '#00E699' },
];

export default function BaseEditorScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [profile, setProfile] = useState<PlayerProfileState>(DEFAULT_PROFILE_STATE);
  const [baseConfig, setBaseConfig] = useState<PlayerBaseConfig>(DEFAULT_PROFILE_STATE.base);
  const [selectedTool, setSelectedTool] = useState<ToolType>('WALL');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    loadPlayerProfile().then((loaded) => {
      setProfile(loaded);
      setBaseConfig(loaded.base);
    });
  }, []);

  const bfsStatus = validateBaseBFS(baseConfig.tiles);
  const cellSize = Math.max(20, Math.min(28, Math.floor((height - 96) / 10)));

  const handleCellPress = (x: number, y: number) => {
    const nextTiles = baseConfig.tiles.map((row) => [...row]);
    let nextEntities = baseConfig.entities.filter((e) => !(e.x === x && e.y === y));

    if (selectedTool === 'FLOOR') {
      nextTiles[y][x] = 0;
    } else if (selectedTool === 'WALL') {
      nextTiles[y][x] = 1;
    } else if (selectedTool === 'DOOR') {
      nextTiles[y][x] = 2;
      nextEntities.push({ id: `DOOR_${x}_${y}`, type: 'door', x, y });
    } else if (selectedTool === 'CAMERA') {
      nextTiles[y][x] = 0;
      nextEntities.push({ id: `CAM_${x}_${y}`, type: 'camera', x, y, dir: 'down' });
    } else if (selectedTool === 'GUARD') {
      nextTiles[y][x] = 0;
      nextEntities.push({ id: `GRD_${x}_${y}`, type: 'guard', x, y, dir: 'right' });
    } else if (selectedTool === 'TRAP') {
      nextTiles[y][x] = 0;
      nextEntities.push({ id: `TRP_${x}_${y}`, type: 'trap', x, y });
    } else if (selectedTool === 'START') {
      // Asegurar una sola Entrada (6)
      for (let ry = 0; ry < nextTiles.length; ry++) {
        for (let rx = 0; rx < nextTiles[ry].length; rx++) {
          if (nextTiles[ry][rx] === 6) nextTiles[ry][rx] = 0;
        }
      }
      nextTiles[y][x] = 6;
    } else if (selectedTool === 'VAULT') {
      // Asegurar una sola Bóveda (5)
      for (let ry = 0; ry < nextTiles.length; ry++) {
        for (let rx = 0; rx < nextTiles[ry].length; rx++) {
          if (nextTiles[ry][rx] === 5) nextTiles[ry][rx] = 0;
        }
      }
      nextTiles[y][x] = 5;
    }

    setBaseConfig({
      ...baseConfig,
      tiles: nextTiles,
      entities: nextEntities,
    });
    setFeedback(null);
  };

  const handleSave = async (publish: boolean) => {
    const res = await saveAndPublishBase(baseConfig, publish);
    setProfile(res.profile);
    setBaseConfig(res.profile.base);
    setFeedback({ ok: res.ok, text: res.message });
  };

  const handleTestBase = async () => {
    const check = validateBaseBFS(baseConfig.tiles);
    if (!check.valid) {
      setFeedback({ ok: false, text: check.reason });
      return;
    }
    await saveAndPublishBase(baseConfig, false);
    router.push('/character-select?next=/game/test-base' as any);
  };

  const handleResetDefault = () => {
    setBaseConfig(DEFAULT_PROFILE_STATE.base);
    setFeedback({ ok: true, text: 'Diseño restaurado a la plantilla base de fábrica.' });
  };

  const countByType = (t: BaseEntityPlacement['type']) =>
    baseConfig.entities.filter((e) => e.type === t).length;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden />
      <CommandHeader
        title="MI BASE PvP // EDITOR 10x10"
        subtitle="ACCESO DESDE TALLER DECK · VALIDA EL CAMINO CON BFS"
        player={profile.player}
        watch={profile.watch}
        backTo="/workshop"
      />

      <View style={styles.body}>
        {/* Columna Izquierda: Herramientas de colocación */}
        <View style={styles.leftPanel}>
          <View style={styles.nameCard}>
            <Text style={styles.smallLabel}>NOMBRE DE LA FORTALEZA</Text>
            <TextInput
              value={baseConfig.name}
              onChangeText={(name) => setBaseConfig({ ...baseConfig, name })}
              style={styles.nameInput}
              placeholder="FORTALEZA NEXO"
              placeholderTextColor="#5a6e82"
            />
          </View>

          <Text style={styles.smallLabel}>PALETA DE CONSTRUCCIÓN (TOCA Y PINTA)</Text>
          <View style={styles.toolsGrid}>
            {TOOLS.map((tool) => {
              const active = selectedTool === tool.id;
              return (
                <Pressable
                  key={tool.id}
                  onPress={() => setSelectedTool(tool.id)}
                  style={[
                    styles.toolBtn,
                    active && { borderColor: tool.color, backgroundColor: '#192534' },
                  ]}
                >
                  <View style={[styles.toolDot, { backgroundColor: tool.color }]} />
                  <View style={styles.toolTextCol}>
                    <Text style={styles.toolName} numberOfLines={1}>
                      {tool.label}
                    </Text>
                    <Text style={styles.toolCost}>{tool.cost}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Columna Central: Cuadrícula interactiva 10x10 */}
        <View style={styles.centerBoard}>
          <View
            style={[
              styles.gridFrame,
              {
                width: cellSize * 10 + 6,
                height: cellSize * 10 + 6,
              },
            ]}
          >
            {baseConfig.tiles.map((row, y) => (
              <View key={y} style={styles.gridRow}>
                {row.map((tile, x) => {
                  const ent = baseConfig.entities.find((e) => e.x === x && e.y === y);
                  const isWall = tile === 1;
                  const isStart = tile === 6;
                  const isVault = tile === 5;
                  const isDoor = tile === 2 || ent?.type === 'door';

                  return (
                    <Pressable
                      key={`${x}-${y}`}
                      onPress={() => handleCellPress(x, y)}
                      style={[
                        styles.gridCell,
                        {
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: isWall ? '#0d1219' : '#253344',
                        },
                        isStart && styles.cellStart,
                        isVault && styles.cellVault,
                      ]}
                    >
                      {isVault ? (
                        <Image
                          source={TILE_ASSETS.extraction}
                          style={{ width: cellSize * 0.8, height: cellSize * 0.8 }}
                        />
                      ) : null}
                      {isDoor ? (
                        <Image
                          source={TILE_ASSETS.doorClosed}
                          style={{ width: cellSize * 0.82, height: cellSize * 0.82 }}
                        />
                      ) : null}
                      {ent?.type === 'camera' ? (
                        <Image
                          source={CAMERA_SPRITES.down}
                          style={{ width: cellSize * 0.82, height: cellSize * 0.82 }}
                        />
                      ) : null}
                      {ent?.type === 'guard' ? (
                        <Image
                          source={GUARD_SPRITES.down[0]}
                          style={{ width: cellSize * 0.85, height: cellSize * 0.85 }}
                        />
                      ) : null}
                      {ent?.type === 'trap' ? (
                        <Image
                          source={TILE_ASSETS.trap}
                          style={{ width: cellSize * 0.8, height: cellSize * 0.8 }}
                        />
                      ) : null}
                      {isStart ? <Text style={styles.startTag}>IN</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Columna Derecha: Validador BFS y Acciones de Publicación */}
        <View style={styles.rightPanel}>
          <View
            style={[
              styles.bfsCard,
              bfsStatus.valid ? styles.bfsCardValid : styles.bfsCardInvalid,
            ]}
          >
            <View style={styles.bfsHeader}>
              {bfsStatus.valid ? (
                <CheckCircle2 size={15} color="#00E699" />
              ) : (
                <AlertTriangle size={15} color="#ff4d6d" />
              )}
              <Text
                style={[
                  styles.bfsTitle,
                  { color: bfsStatus.valid ? '#00E699' : '#ff4d6d' },
                ]}
              >
                {bfsStatus.valid ? 'VALIDACIÓN BFS: APROBADA' : 'VALIDACIÓN BFS: FALLIDA'}
              </Text>
            </View>
            <Text style={styles.bfsReason}>{bfsStatus.reason}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.smallLabel}>DEFENSAS INSTALADAS</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryItem}>Cámaras: {countByType('camera')}</Text>
              <Text style={styles.summaryItem}>Guardias: {countByType('guard')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryItem}>Trampas: {countByType('trap')}</Text>
              <Text style={styles.summaryItem}>Puertas: {countByType('door')}</Text>
            </View>
            <Text style={styles.vaultNote}>
              Bóveda resguardada: {baseConfig.vaultCredits} CR · Estado:{' '}
              {baseConfig.isPublished ? 'PUBLICADA' : 'BORRADOR'}
            </Text>
          </View>

          {feedback ? (
            <Text
              style={[
                styles.feedbackText,
                { color: feedback.ok ? '#00E699' : '#ff4d6d' },
              ]}
              numberOfLines={2}
            >
              {feedback.text}
            </Text>
          ) : null}

          <View style={styles.actionsStack}>
            <Pressable onPress={() => handleSave(true)} style={styles.publishBtn}>
              <UploadCloud size={14} color="#ffffff" />
              <Text style={styles.publishBtnText}>VALIDAR BFS Y PUBLICAR</Text>
            </Pressable>

            <View style={styles.secondaryRow}>
              <Pressable onPress={() => handleSave(false)} style={styles.secBtn}>
                <Save size={13} color="#00F0FF" />
                <Text style={styles.secBtnText}>GUARDAR</Text>
              </Pressable>

              <Pressable onPress={handleTestBase} style={styles.secBtn}>
                <Play size={13} color="#ffcc00" />
                <Text style={[styles.secBtnText, { color: '#ffcc00' }]}>PROBAR</Text>
              </Pressable>

              <Pressable onPress={handleResetDefault} style={styles.secBtnIcon}>
                <RotateCcw size={13} color="#95aac0" />
              </Pressable>
            </View>
          </View>
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 12,
    alignItems: 'center',
  },
  leftPanel: {
    width: '32%',
    height: '100%',
    justifyContent: 'space-between',
    gap: 6,
  },
  nameCard: {
    backgroundColor: '#101722',
    borderWidth: 1.5,
    borderColor: '#273749',
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  smallLabel: {
    color: '#8ca1b7',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  nameInput: {
    backgroundColor: '#090d13',
    borderWidth: 1,
    borderColor: '#2d3f54',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  toolsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    alignContent: 'space-between',
  },
  toolBtn: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#101722',
    borderWidth: 1.5,
    borderColor: '#243446',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  toolDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  toolTextCol: {
    flex: 1,
  },
  toolName: {
    color: '#eef6ff',
    fontSize: 9,
    fontWeight: '900',
  },
  toolCost: {
    color: '#7d93a9',
    fontSize: 8,
    fontWeight: '700',
  },
  centerBoard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridFrame: {
    backgroundColor: '#090d13',
    borderWidth: 3,
    borderColor: '#36485e',
    borderRadius: 6,
    overflow: 'hidden',
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    borderWidth: 0.5,
    borderColor: 'rgba(130, 160, 195, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellStart: {
    backgroundColor: 'rgba(0, 240, 255, 0.25)',
    borderColor: '#00F0FF',
    borderWidth: 1.5,
  },
  cellVault: {
    backgroundColor: 'rgba(0, 230, 153, 0.22)',
    borderColor: '#00E699',
    borderWidth: 1.5,
  },
  startTag: {
    color: '#00F0FF',
    fontSize: 8,
    fontWeight: '900',
  },
  rightPanel: {
    flex: 1,
    height: '100%',
    justifyContent: 'space-between',
    gap: 6,
  },
  bfsCard: {
    backgroundColor: '#101722',
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 9,
    gap: 4,
  },
  bfsCardValid: {
    borderColor: '#00E699',
  },
  bfsCardInvalid: {
    borderColor: '#ff4d6d',
  },
  bfsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bfsTitle: {
    fontSize: 10,
    fontWeight: '900',
  },
  bfsReason: {
    color: '#b0c3d6',
    fontSize: 9,
    lineHeight: 13,
  },
  summaryCard: {
    backgroundColor: '#101722',
    borderWidth: 1.5,
    borderColor: '#273749',
    borderRadius: 8,
    padding: 9,
    gap: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    color: '#eef6ff',
    fontSize: 10,
    fontWeight: '800',
  },
  vaultNote: {
    color: '#ffcc00',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  feedbackText: {
    fontSize: 9,
    fontWeight: '800',
  },
  actionsStack: {
    gap: 6,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#d83800',
    borderWidth: 2,
    borderColor: '#ffcc00',
    borderRadius: 7,
    paddingVertical: 9,
  },
  publishBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 6,
  },
  secBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#141e2b',
    borderWidth: 1,
    borderColor: '#314459',
    borderRadius: 6,
    paddingVertical: 7,
  },
  secBtnText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: '900',
  },
  secBtnIcon: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141e2b',
    borderWidth: 1,
    borderColor: '#314459',
    borderRadius: 6,
  },
});
