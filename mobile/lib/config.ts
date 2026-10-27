// Configuración del cliente para conectar el Móvil y el Smartwatch a través del Backend NEXO.
// Detecta automáticamente la IP de la red local desde Expo Constants cuando corre en teléfono
// o usa http://localhost:3000 en Web (o EXPO_PUBLIC_API_URL si se define en .env).
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveDefaultServerUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:3000`;
    }
  }
  return 'http://192.168.33.4:3000';
}

/** Raíz del servidor, usada por Socket.io y REST */
export const SERVER_URL = resolveDefaultServerUrl();

/** Base de la API REST */
export const API_URL = `${SERVER_URL}/api`;
