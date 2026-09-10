// CVIA — Supabase Client
// Initializes the shared cloud database connection
import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://puipneqpnowkvlwuebhd.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aXBuZXFwbm93a3Zsd3VlYmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NjQ1MjcsImV4cCI6MjEwNDU0MDUyN30.A0z1sMfXFnVspN1wwQr_r49G0LFDU-bHw_2Repbx4Sc';

const metaEnv = (import.meta as any)?.env || (globalThis as any).process?.env || {};
const rawUrl = (metaEnv.VITE_SUPABASE_URL as string | undefined)?.trim() || FALLBACK_SUPABASE_URL;
const rawKey = (metaEnv.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || FALLBACK_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(rawUrl && rawKey && rawUrl.startsWith('http'));

if (!isSupabaseConfigured) {
  console.info('[CVIA] Cloud database env vars not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Running in air-gapped local mode.');
}

// Ensure createClient is never invoked with empty string to avoid throwing 'supabaseUrl is required.'
const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://local-airgap.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'local-airgap-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate a stable session ID for this browser tab (not persisted across sessions)
export const SESSION_ID: string = (() => {
  try {
    let id = sessionStorage.getItem('CVIA_SESSION_ID');
    if (!id) {
      id = `sess_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
      sessionStorage.setItem('CVIA_SESSION_ID', id);
    }
    return id;
  } catch {
    return `sess_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
  }
})();

