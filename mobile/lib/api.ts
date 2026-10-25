// Cliente de la API REST (sección 11 de docs/NEXO_Contexto_IA.md).
// Agrega el token JWT a cada petición y expone todos los endpoints del contrato.
import axios, { AxiosError } from 'axios';
import { API_URL } from './config';
import { getToken } from './tokenStorage';
import type { ApiError } from './types';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 6000,
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
      return { code: 'NETWORK_ERROR', message: 'Modo local activo (servidor no disponible)' };
    }
  }
  return { code: 'UNKNOWN', message: 'Ocurrió un error inesperado' };
}

// ---------- Tipos de datos de los endpoints REST ----------

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

export type UpgradeType = 'battery' | 'cipher' | 'efficiency';

export type SkillCode =
  | 'SCANNER'
  | 'SABOTAGE'
  | 'CAMOUFLAGE'
  | 'OVERLOAD'
  | 'RADAR'
  | 'EMP'
  | 'THERMAL'
  | 'TIMEDILATE';

export interface WatchDeviceInfo {
  id: number;
  deviceName: string;
  linkedAt: string;
  lastSeenAt: string | null;
}

export interface MissionInfo {
  id: number;
  levelNumber: number;
  name: string;
  theme: 'BANK' | 'CRYPT' | 'LAB' | 'SERVERS' | 'ORBITAL';
  minigame: string;
  description: string;
  rewardCredits: number;
  rewardEnergy: number;
  rewardIntel: number;
  unlocksSkill: SkillCode;
  status: 'LOCKED' | 'AVAILABLE' | 'COMPLETED';
  bestTurns: number | null;
  timesPlayed: number;
}

export interface RaidTargetInfo {
  id: number;
  ownerUsername: string;
  baseName: string;
  vaultCredits: number;
  securityRating: string;
  timesRaided: number;
  timesDefended: number;
}

export interface RaidReportInfo {
  id: number;
  attackerUsername: string;
  success: boolean;
  creditsStolen: number;
  seenByDefender: boolean;
  createdAt: string;
}

export interface MissionHistoryEntry {
  id: string;
  missionName: string;
  type: 'SOLO' | 'COOP' | 'RAID';
  result: 'WON' | 'LOST';
  turns: number;
  maxAlert: number;
  creditsEarned: number;
  energyEarned: number;
  intelEarned: number;
  playedAt: string;
}

// ---------- Endpoints REST (Sección 11) ----------

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

export const missionsApi = {
  list: () => api.get<MissionInfo[]>('/missions').then((r) => r.data),
};

export const sessionApi = {
  startSolo: (missionId: number) =>
    api.post<{ sessionId: string }>('/sessions/solo', { missionId }).then((r) => r.data),
  createCoopRoom: (missionId: number) =>
    api.post<{ sessionId: string; roomCode: string }>('/coop/rooms', { missionId }).then((r) => r.data),
  joinCoopRoom: (roomCode: string) =>
    api.post<{ sessionId: string }>(`/coop/rooms/${roomCode}/join`).then((r) => r.data),
};

export const upgradesApi = {
  get: () => api.get('/upgrades').then((r) => r.data),
  buy: (type: UpgradeType) => api.post(`/upgrades/${type}/buy`).then((r) => r.data),
  equipSkills: (skills: SkillCode[]) => api.put('/skills/equip', { skills }).then((r) => r.data),
};

export const baseApi = {
  getOwn: () => api.get('/base').then((r) => r.data),
  saveDraft: (name: string, mapJson: unknown) =>
    api.put('/base', { name, mapJson }).then((r) => r.data),
  publish: () => api.post('/base/publish').then((r) => r.data),
};

export const raidsApi = {
  targets: () => api.get<RaidTargetInfo[]>('/raids/targets').then((r) => r.data),
  start: (baseId: number) =>
    api.post<{ sessionId: string }>('/raids/start', { baseId }).then((r) => r.data),
  reports: () => api.get<RaidReportInfo[]>('/raids/reports').then((r) => r.data),
};

export const historyApi = {
  list: () => api.get<MissionHistoryEntry[]>('/history').then((r) => r.data),
};
