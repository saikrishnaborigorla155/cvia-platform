// CVIA — Frontend Verification API Client
// SIH26228 · Ministry of Defence / DGIS

import { apiFetch } from './client';
import type { StoredVerification } from '../../server/types';

export async function fetchLatestVerificationApi(): Promise<StoredVerification | null> {
  const res = await apiFetch<StoredVerification>('/api/verifications?latest=true', {
    method: 'GET',
  });

  if (res.success && res.data) {
    return res.data;
  }
  return null;
}

export async function fetchVerificationByIdApi(id: string): Promise<StoredVerification | null> {
  const res = await apiFetch<StoredVerification>(`/api/verifications?id=${encodeURIComponent(id)}`, {
    method: 'GET',
  });

  if (res.success && res.data) {
    return res.data;
  }
  return null;
}

export async function fetchVerificationsListApi(): Promise<StoredVerification[]> {
  const res = await apiFetch<StoredVerification[]>('/api/verifications', {
    method: 'GET',
  });

  return res.data || [];
}

export async function createVerificationRunApi(payload?: { datasetId?: string; modelId?: string }): Promise<StoredVerification | null> {
  const res = await apiFetch<StoredVerification>('/api/verifications', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });

  if (res.success && res.data) {
    return res.data;
  }
  return null;
}
