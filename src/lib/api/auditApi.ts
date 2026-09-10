// CVIA — Frontend Audit Trail API Client
// SIH26228 · Ministry of Defence / DGIS

import { apiFetch } from './client';
import type { AuditEvent } from '../../types/cvia';

export async function fetchUserAuditTrailApi(): Promise<AuditEvent[]> {
  const res = await apiFetch<AuditEvent[]>('/api/audit', {
    method: 'GET',
  });

  return res.data || [];
}

export async function recordAuditEventApi(event: AuditEvent): Promise<AuditEvent | null> {
  const res = await apiFetch<AuditEvent>('/api/audit', {
    method: 'POST',
    body: JSON.stringify(event),
  });

  if (res.success && res.data) {
    return res.data;
  }
  return null;
}
