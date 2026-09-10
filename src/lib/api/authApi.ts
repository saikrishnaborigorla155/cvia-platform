// CVIA — Frontend Authentication API Client
// SIH26228 · Ministry of Defence / DGIS

import { apiFetch, setStoredToken, clearStoredToken } from './client';
import type { ServerUser, UserSession } from '../../server/types';

export async function loginOperatorApi(email: string, password?: string): Promise<ServerUser | null> {
  const res = await apiFetch<UserSession>('/api/auth?action=login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });

  if (res.success && res.data?.token) {
    setStoredToken(res.data.token, true);
    return res.data.user;
  }
  return null;
}

export async function registerOperatorApi(
  email: string,
  fullName: string,
  organization: string,
  unitCode: string
): Promise<ServerUser | null> {
  const res = await apiFetch<UserSession>('/api/auth?action=register', {
    method: 'POST',
    body: JSON.stringify({ email, fullName, organization, unitCode }),
    skipAuth: true,
  });

  if (res.success && res.data?.token) {
    setStoredToken(res.data.token, true);
    return res.data.user;
  }
  return null;
}

export async function getCurrentUserApi(): Promise<ServerUser | null> {
  const res = await apiFetch<{ user: ServerUser }>('/api/auth?action=me', {
    method: 'GET',
  });

  if (res.success && res.data?.user) {
    return res.data.user;
  }
  return null;
}

export async function getPresetOperatorsApi(): Promise<ServerUser[]> {
  const res = await apiFetch<ServerUser[]>('/api/auth?action=presets', {
    method: 'GET',
    skipAuth: true,
  });

  return res.data || [];
}

export function logoutOperatorApi(): void {
  clearStoredToken();
}
