// Configuración del cliente. La URL se toma de la variable EXPO_PUBLIC_API_URL
// (archivo mobile/.env). Siempre HTTPS: Android e iOS bloquean http sin cifrar.

const DEFAULT_SERVER_URL = 'https://nexo.duckdns.org'; // TODO: cambiar por el subdominio real

/** Raíz del servidor, usada por Socket.io (wss://...) */
export const SERVER_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_SERVER_URL).replace(/\/$/, '');

/** Base de la API REST */
export const API_URL = `${SERVER_URL}/api`;
