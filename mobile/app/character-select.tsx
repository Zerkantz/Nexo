// Selector de Personaje en Horizontal (Landscape) estilo Metal Slug:
// Muestra únicamente las 4 tarjetas completas de los personajes lado a lado.
// Al seleccionar uno, su tarjeta sube unos píxeles hacia arriba, cambia a su pose seleccionada
// y ejecuta una transición de pantalla negra hacia el nivel.
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
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
  const [chosenId, setChosenId] = useState<CharacterId | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Animación de elevación (unos píxeles hacia arriba) para cada uno de los 4 personajes
  const liftAnims = useRef<Record<CharacterId, Animated.Value>>({
    jesus: new Animated.Value(0),
    vicente: new Animated.Value(0),
    francisco: new Animated.Value(0),
    alberto: new Animated.Value(0),
  }).current;

  // Animación de pantalla negra (fade-to-black)
  const blackFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Precargar el último personaje guardado sin disparar la transición aún
    getSelectedCharacter().then(() => {});
  }, []);

  const handlePickCharacter = async (id: CharacterId) => {
    if (isTransitioning) return;
    setChosenId(id);
    setIsTransitioning(true);
    await setSelectedCharacter(id);

    // 1. Elevar la tarjeta seleccionada unos píxeles hacia arriba (-18px) y bajar las demás a 0
    CHARACTER_LIST.forEach((c) => {
      Animated.timing(liftAnims[c.id], {
        toValue: c.id === id ? -18 : 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    // 2. Tras apreciar la pose seleccionada y la elevación, hacer transición a pantalla negra
    setTimeout(() => {
      Animated.timing(blackFadeAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        const destination = params.next || '/game/demo';
        router.replace(destination as any);
      });
    }, 520);
  };

  return (
    <View style={styles.root}>
      {/* Franja superior de advertencia Metal Slug */}
      <View style={styles.hazardTop} />

      <SafeAreaView style={styles.safeArea}>
        {/* Cabecera minimalista Arcade */}
        <View style={styles.header}>
          <Pressable
            onPress={() => !isTransitioning && router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft size={18} color="#ffcc00" />
          </Pressable>
          <Text style={styles.headerTitle}>PLAYER SELECT</Text>
          <View style={styles.creditBadge}>
            <Text style={styles.creditText}>CREDIT 01</Text>
          </View>
        </View>

        {/* Fila horizontal con las 4 tarjetas completas sin información extra debajo */}
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
                  disabled={isTransitioning}
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
      </SafeAreaView>

      {/* Cortina de transición con pantalla negra */}
      <Animated.View
        pointerEvents={isTransitioning ? 'auto' : 'none'}
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
    height: 7,
    backgroundColor: '#ffb800',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
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
  creditBadge: {
    backgroundColor: '#0c1f14',
    borderWidth: 1.5,
    borderColor: '#00ff88',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  creditText: {
    color: '#00ff88',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingTop: 14,
    paddingBottom: 4,
  },
  cardWrapper: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFrame: {
    height: '94%',
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
