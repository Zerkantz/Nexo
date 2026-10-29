// Redirección limpia al menú de misiones tácticas offline
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

export default function OnlineScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/missions');
  }, [router]);

  return <View style={{ flex: 1, backgroundColor: '#090d14' }} />;
}
