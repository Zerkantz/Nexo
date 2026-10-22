// Pantalla "Cómo jugar" (accesible desde el inicio).
import { router } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { HowToPlayGuide } from '../components/tutorial/HowToPlayGuide';
import { resetTutorialProgress } from '../hooks/useTutorial';
import { colors } from '../theme/colors';

export default function HowToPlayScreen() {
  const onReset = async () => {
    await resetTutorialProgress();
    const msg = 'El tutorial se mostrará de nuevo en tu próxima partida.';
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Tutorial reiniciado', msg);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>CÓMO JUGAR</Text>
        <View style={{ width: 24 }} />
      </View>
      <HowToPlayGuide onResetTutorial={onReset} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    color: colors.stealth,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 3,
  },
});
