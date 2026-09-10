// CVIA — Backend Audit Trail Service
// SIH26228 · Ministry of Defence / DGIS

import type { AuditEvent } from '../types/cvia';
import { demoAuditTrail } from '../data/demoData';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const _userAuditTrails: Map<string, AuditEvent[]> = new Map();

// Seed baseline user with demoAuditTrail
_userAuditTrails.set('11111111-1111-1111-1111-111111111111', [...demoAuditTrail]);

export async function getUserAuditTrail(userId: string): Promise<AuditEvent[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('audit_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          eventId: r.event_id,
          timestamp: r.created_at,
          action: r.event_type as AuditEvent['action'],
          asset: String(r.payload?.asset ?? 'System Asset'),
          assetId: String(r.payload?.assetId ?? 'ASSET-REF-001'),
          previousHash: r.hash_chain || 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
          eventHash: String(r.payload?.eventHash ?? 'sha256:audit_hash'),
          status: (r.payload?.status as AuditEvent['status']) ?? 'OK',
          actor: r.actor,
          details: r.description || '',
        }));
      }
    } catch {
      // Fall through
    }
  }

  return _userAuditTrails.get(userId) || [];
}

export async function appendAuditEvent(userId: string, event: AuditEvent): Promise<AuditEvent> {
  const currentTrail = _userAuditTrails.get(userId) || [];
  const updatedTrail = [...currentTrail, event];
  _userAuditTrails.set(userId, updatedTrail);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('audit_events').insert({
        event_id: event.eventId,
        event_type: event.action,
        actor: event.actor,
        description: event.details,
        hash_chain: event.previousHash,
        payload: {
          asset: event.asset,
          assetId: event.assetId,
          eventHash: event.eventHash,
          status: event.status,
        },
        user_id: userId,
      });
    } catch {
      // Retained in memory
    }
  }

  return event;
}
