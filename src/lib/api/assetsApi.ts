// CVIA — Frontend Assets API Client
// SIH26228 · Ministry of Defence / DGIS

import { apiFetch } from './client';
import type { StoredDatabaseAsset, DatabaseAuditReport } from '../../services/cviaDatabase';
import type { FileAnalysisResult } from '../../services/fileHasher';

export async function fetchUserAssetsApi(): Promise<StoredDatabaseAsset[]> {
  const res = await apiFetch<StoredDatabaseAsset[]>('/api/assets', {
    method: 'GET',
  });

  return res.data || [];
}

export async function enrollAssetApi(
  analysis: FileAnalysisResult,
  contributor: { id: string; name: string },
  previewUrl?: string
): Promise<StoredDatabaseAsset | null> {
  const res = await apiFetch<StoredDatabaseAsset>('/api/assets', {
    method: 'POST',
    body: JSON.stringify({ analysis, contributor, previewUrl }),
  });

  if (res.success && res.data) {
    return res.data;
  }
  return null;
}

export async function auditAssetsApi(): Promise<DatabaseAuditReport | null> {
  const res = await apiFetch<DatabaseAuditReport>('/api/assets?audit=true', {
    method: 'POST',
  });

  if (res.success && res.data) {
    return res.data;
  }
  return null;
}
