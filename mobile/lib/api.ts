// Cliente de la API REST (sección 11). Agrega el token JWT a cada petición.
import axios, { AxiosError } from 'axios';
import { API_URL } from './config';
import { getToken } from './tokenStorage';
import type { ApiError } from './types';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Convierte cualquier error en { code, message } con un texto en español para mostrar. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof AxiosError) {
    const serverError = (err.response?.data as { error?: ApiError } | undefined)?.error;
    if (serverError) return serverError;
    if (!err.response) {
      return { code: 'NETWORK_ERROR', message: 'No se pudo conectar con el servidor' };
    }
  }
  return { code: 'UNKNOWN', message: 'Ocurrió un error inesperado' };
}

// ---------- Endpoints que usa el Integrante 1 ----------

export interface PlayerSummary {
  id: number;
  username: string;
  email: string;
  credits: number;
  energy: number;
  intel: number;
}

export interface AuthResponse {
  token: string;
  player: PlayerSummary;
}

export const authApi = {
  register: (username: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { username, email, password }).then((r) => r.data),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get('/me').then((r) => r.data),
};

export const pairingApi = {
  claim: (code: string) => api.post('/pairing/claim', { code }).then((r) => r.data),
};

export const sessionApi = {
  startSolo: (missionId: number) =>
    api.post<{ sessionId: string }>('/sessions/solo', { missionId }).then((r) => r.data),
  createCoopRoom: (missionId: number) =>
    api.post<{ sessionId: string; roomCode: string }>('/coop/rooms', { missionId }).then((r) => r.data),
  joinCoopRoom: (roomCode: string) =>
    api.post<{ sessionId: string }>(`/coop/rooms/${roomCode}/join`).then((r) => r.data),
};
