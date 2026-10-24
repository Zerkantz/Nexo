// Pantalla "Cómo jugar" (accesible desde el botón ? del inicio).
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { HowToPlayGuide } from '../components/tutorial/HowToPlayGuide';
import { resetTutorialProgress } from '../hooks/useTutorial';

export default function HowToPlayScreen() {
  const onReset = async () => {
    await resetTutorialProgress();
    const msg = 'El tutorial se mostrará de nuevo en tu próxima partida.';
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Tutorial reiniciado', msg);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      <View style={styles.topBar}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color="#ffcc00" />
        </Pressable>
        <Text style={styles.title}>MANUAL TÁCTICO // CÓMO JUGAR</Text>
        <View style={{ width: 36 }} />
      </View>
      <HowToPlayGuide onResetTutorial={onReset} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090c11',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2a38',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#151d27',
    borderWidth: 1.5,
    borderColor: '#3a4a5e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#ffcc00',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
