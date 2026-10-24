// Selector de Personaje en Horizontal (Landscape) estilo Metal Slug:
// - Muestra las 4 tarjetas completas de los personajes lado a lado.
// - El jugador puede tocar cualquier personaje y cambiar de elección libremente:
//   la tarjeta seleccionada sube unos píxeles hacia arriba y cambia a su pose de seleccionado.
// - En la esquina inferior derecha se ubica el botón "COMENZAR", el cual activa
//   la transición con pantalla negra hacia la partida.
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play } from 'lucide-react-native';
import {
  CHARACTER_LIST,
  getCharacterCards,
  getSelectedCharacter,
  setSelectedCharacter,
  type CharacterId,
} from '../lib/characters';

export default function CharacterSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const [chosenId, setChosenId] = useState<CharacterId>('jesus');
  const [isStarting, setIsStarting] = useState(false);

  // Animación de elevación (unos píxeles hacia arriba) para cada uno de los 4 personajes
  const liftAnims = useRef<Record<CharacterId, Animated.Value>>({
    jesus: new Animated.Value(-14),
    vicente: new Animated.Value(0),
    francisco: new Animated.Value(0),
    alberto: new Animated.Value(0),
  }).current;

  // Animación de pantalla negra (fade-to-black) al presionar COMENZAR
  const blackFadeAnim = useRef(new Animated.Value(0)).current;

  const animateCardsForSelection = (selectedId: CharacterId) => {
    CHARACTER_LIST.forEach((c) => {
      Animated.timing(liftAnims[c.id], {
        toValue: c.id === selectedId ? -14 : 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    getSelectedCharacter().then((savedId) => {
      setChosenId(savedId);
      animateCardsForSelection(savedId);
    });
  }, []);

  const handlePickCharacter = async (id: CharacterId) => {
    if (isStarting) return;
    setChosenId(id);
    animateCardsForSelection(id);
    await setSelectedCharacter(id);
  };

  const handleConfirmStart = async () => {
    if (isStarting || !chosenId) return;
    setIsStarting(true);
    await setSelectedCharacter(chosenId);

    Animated.timing(blackFadeAnim, {
      toValue: 1,
      duration: 420,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      const destination = params.next || '/game/demo';
      router.replace(destination as any);
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      {/* Franja superior de advertencia Metal Slug */}
      <View style={styles.hazardTop} />

      <SafeAreaView style={styles.safeArea}>
        {/* Cabecera minimalista Arcade */}
        <View style={styles.header}>
          <Pressable
            onPress={() => !isStarting && router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft size={18} color="#ffcc00" />
          </Pressable>
          <Text style={styles.headerTitle}>PLAYER SELECT</Text>
          <View style={styles.headerRightSpacer} />
        </View>

        {/* Fila horizontal con las 4 tarjetas completas */}
        <View style={styles.cardsRow}>
          {CHARACTER_LIST.map((char) => {
            const isSelected = chosenId === char.id;
            const cards = getCharacterCards(char.id);
            const imgSource = isSelected ? cards.selected : cards.relaxed;

            return (
              <Animated.View
                key={char.id}
                style={[
                  styles.cardWrapper,
                  {
                    transform: [{ translateY: liftAnims[char.id] }],
                  },
                ]}
              >
                <Pressable
                  disabled={isStarting}
                  onPress={() => handlePickCharacter(char.id)}
                  style={[
                    styles.cardFrame,
                    isSelected && styles.cardFrameSelected,
                  ]}
                >
                  {isSelected && (
                    <View style={styles.p1Tag}>
                      <Text style={styles.p1TagText}>1P</Text>
                    </View>
                  )}
                  <Image source={imgSource} style={styles.cardImage} />
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Botón de COMENZAR flotante en la esquina inferior derecha */}
        <View style={styles.bottomRightCorner}>
          <Pressable
            disabled={isStarting}
            onPress={handleConfirmStart}
            style={({ pressed }) => [
              styles.startCornerBtn,
              pressed && styles.startCornerBtnPressed,
            ]}
          >
            <Text style={styles.startCornerBtnText}>COMENZAR</Text>
            <Play size={16} color="#ffffff" fill="#ffffff" />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Cortina de transición con pantalla negra */}
      <Animated.View
        pointerEvents={isStarting ? 'auto' : 'none'}
        style={[
          styles.blackScreenOverlay,
          { opacity: blackFadeAnim },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07090c',
  },
  hazardTop: {
    height: 6,
    backgroundColor: '#ffb800',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1a2028',
    borderWidth: 1.5,
    borderColor: '#3a4654',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffcc00',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
  },
  headerRightSpacer: {
    width: 36,
  },
  cardsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 14,
    paddingBottom: 6,
    paddingRight: 115,
  },
  cardWrapper: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFrame: {
    height: '92%',
    aspectRatio: 440 / 980,
    backgroundColor: '#12161b',
    borderWidth: 3,
    borderColor: '#2d3742',
    borderRadius: 8,
    padding: 3,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 8,
  },
  cardFrameSelected: {
    borderColor: '#ffcc00',
    backgroundColor: '#242b22',
    shadowColor: '#ffcc00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 14,
  },
  p1Tag: {
    position: 'absolute',
    top: -10,
    left: 10,
    backgroundColor: '#e01b1b',
    borderWidth: 1.5,
    borderColor: '#ffcc00',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 3,
    zIndex: 10,
  },
  p1TagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 4,
    backgroundColor: '#050608',
  },
  bottomRightCorner: {
    position: 'absolute',
    right: 20,
    bottom: 14,
    zIndex: 30,
  },
  startCornerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#d83800',
    borderWidth: 2.5,
    borderColor: '#ffcc00',
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 10,
  },
  startCornerBtnPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: '#b82e00',
  },
  startCornerBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  blackScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 999,
  },
});
