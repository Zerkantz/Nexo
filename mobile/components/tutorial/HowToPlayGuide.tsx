// Guía completa y actualizada "Cómo jugar":
// Incluye galería visual con los nuevos sprites de 16 bits (Guardias, Cámaras,
// Módulos de Energía, Terminales, Minas, Compuertas y Puertas Moradas entre cuartos)
// y diseño optimizado para lectura horizontal.
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowRightLeft, RotateCcw, Smartphone, Watch } from 'lucide-react-native';
import { colors, withAlpha } from '../../theme/colors';
import { CAMERA_SPRITES, GUARD_SPRITES, TILE_ASSETS } from '../../lib/environmentAssets';
import { GROUP_LABEL, TIPS, type TipGroup } from '../../tutorial/tips';
import { TipContent } from './TipContent';

interface Props {
  /** Si se pasa, aparece el botón "Repetir tutorial" */
  onResetTutorial?: () => void;
}

const GROUPS: TipGroup[] = ['intro', 'danger', 'map', 'advanced'];

const VISUAL_ELEMENTS = [
  {
    name: 'Guardia de Patrulla',
    desc: 'Avanza 1 casilla cada turno siguiendo su ruta. Su cono naranja suma +50 % de alerta.',
    img: GUARD_SPRITES.down[0],
    accent: '#FF8800',
  },
  {
    name: 'Cámara de Seguridad',
    desc: 'Vigila pasillos clave. Su cono rojo suma +35 % de alerta; puedes apagarla con Sabotaje.',
    img: CAMERA_SPRITES.down,
    accent: '#FF2E4C',
  },
  {
    name: 'Módulo de Energía',
    desc: 'Batería de 16 bits con símbolo de rayo. Pasa sobre ella para recargar +40 % de energía.',
    img: TILE_ASSETS.energy,
    accent: '#00E699',
  },
  {
    name: 'Terminal de Datos',
    desc: 'Písala (cuesta 25 % de energía) para desbloquear las compuertas del sector y apagar cámaras por 8 turnos.',
    img: TILE_ASSETS.terminal,
    accent: '#00D8FF',
  },
  {
    name: 'Compuerta Blindada',
    desc: 'Requiere haber hackeado la Terminal del sector y gastar 25 % de energía para abrirse.',
    img: TILE_ASSETS.doorClosed,
    accent: '#FF2E4C',
  },
  {
    name: 'Mina Láser',
    desc: 'Oculta hasta activar el Escáner del reloj. Pisarla aumenta +25 % el nivel de alerta.',
    img: TILE_ASSETS.trap,
    accent: '#FFB800',
  },
  {
    name: 'Punto de Extracción',
    desc: 'Objetivo final de la misión. Llega a esta plataforma tras cruzar los cuartos del sector.',
    img: TILE_ASSETS.extraction,
    accent: '#00E699',
  },
];

export function HowToPlayGuide({ onResetTutorial }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Idea central: dos dispositivos */}
      <View style={styles.devices}>
        <View style={styles.device}>
          <Smartphone size={24} color="#00E699" />
          <Text style={styles.deviceTitle}>MÓVIL · CAMPO TÁCTICO 12×12</Text>
          <Text style={styles.deviceText}>
            Mueve a tu agente por los pasillos, esquiva conos de visión y cruza puertas moradas hacia otros cuartos.
          </Text>
        </View>
        <ArrowRightLeft size={20} color="#ffcc00" />
        <View style={styles.device}>
          <Watch size={24} color="#00D8FF" />
          <Text style={styles.deviceTitle}>RELOJ · HACKER DECK</Text>
          <Text style={styles.deviceText}>
            Ejecuta Escáner, Sabotaje, Camuflaje y minijuegos de hackeo en tiempo real sin gastar turno.
          </Text>
        </View>
      </View>

      {/* Galería Visual de Elementos 16-Bit del Mapa */}
      <View style={styles.group}>
        <Text style={styles.groupTitle}>GUÍA VISUAL DE ELEMENTOS 16-BIT</Text>
        <View style={styles.visualGrid}>
          {VISUAL_ELEMENTS.map((item) => (
            <View
              key={item.name}
              style={[styles.visualCard, { borderColor: withAlpha(item.accent, 0.45) }]}
            >
              <View style={styles.spriteBox}>
                <Image source={item.img} style={styles.spriteImg} />
              </View>
              <View style={styles.visualInfo}>
                <Text style={[styles.visualTitle, { color: item.accent }]}>{item.name}</Text>
                <Text style={styles.visualDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}

          {/* Tarjeta visual para la Puerta Morada entre cuartos */}
          <View style={[styles.visualCard, { borderColor: withAlpha('#BD00FF', 0.55) }]}>
            <View style={[styles.spriteBox, styles.purplePortalPreview]}>
              <View style={styles.purplePortalEdge} />
            </View>
            <View style={styles.visualInfo}>
              <Text style={[styles.visualTitle, { color: '#D580FF' }]}>Puerta a Otro Cuarto</Text>
              <Text style={styles.visualDesc}>
                Borde pintado de morado en la orilla del tablero. Crúzalo para avanzar al siguiente cuarto.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Grupos detallados de mecánicas */}
      {GROUPS.map((group) => (
        <View key={group} style={styles.group}>
          <Text style={styles.groupTitle}>{GROUP_LABEL[group].toUpperCase()}</Text>
          <View style={styles.cardsGrid}>
            {TIPS.filter((t) => t.group === group).map((tip) => (
              <View key={tip.id} style={[styles.card, { borderColor: withAlpha(tip.color, 0.4) }]}>
                <TipContent tip={tip} compact />
              </View>
            ))}
          </View>
        </View>
      ))}

      {onResetTutorial && (
        <Pressable style={styles.reset} onPress={onResetTutorial}>
          <RotateCcw size={16} color="#ffcc00" />
          <Text style={styles.resetText}>Restablecer cartas de tutorial en la partida</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 14,
    gap: 18,
    paddingBottom: 32,
  },
  devices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  device: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2d3b4d',
    backgroundColor: '#131a23',
  },
  deviceTitle: {
    color: '#e8f0f8',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  deviceText: {
    color: '#9bb0c4',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  group: {
    gap: 10,
  },
  groupTitle: {
    color: '#ffcc00',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  visualGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  visualCard: {
    width: '48.8%',
    minWidth: 260,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#131a23',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
  },
  spriteBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#233040',
    borderWidth: 1,
    borderColor: '#38495e',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  spriteImg: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  purplePortalPreview: {
    backgroundColor: 'rgba(189, 0, 255, 0.22)',
    borderColor: '#7a2999',
  },
  purplePortalEdge: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#BD00FF',
  },
  visualInfo: {
    flex: 1,
    gap: 2,
  },
  visualTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  visualDesc: {
    color: '#b0c0d0',
    fontSize: 11,
    lineHeight: 14,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48.8%',
    minWidth: 260,
    flexGrow: 1,
    backgroundColor: '#131a23',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  reset: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ffcc00',
    backgroundColor: '#18202c',
  },
  resetText: {
    color: '#ffcc00',
    fontWeight: '800',
    fontSize: 12,
  },
});
