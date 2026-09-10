// CVIA — Supabase Client
// Initializes the shared cloud database connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[CVIA] Supabase env vars not configured. Running in offline mode.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Generate a stable session ID for this browser tab (not persisted across sessions)
export const SESSION_ID: string = (() => {
  let id = sessionStorage.getItem('CVIA_SESSION_ID');
  if (!id) {
    id = `sess_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    sessionStorage.setItem('CVIA_SESSION_ID', id);
  }
  return id;
})();
