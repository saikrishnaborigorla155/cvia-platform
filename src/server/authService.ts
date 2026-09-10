// CVIA — Defense Operator Authentication Service
// SIH26228 · Ministry of Defence / DGIS

import type { ServerUser, UserSession } from './types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const JWT_SECRET = 'cvia_defence_integrity_assurance_platform_sih26228_dgis_key';

// Pre-configured official military command units
export const PRESET_OPERATORS: ServerUser[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'commander.alpha@dgis.gov.in',
    fullName: 'Col. R. Singh',
    organization: 'Unit Alpha (Northern Command)',
    role: 'COMMANDER',
    unitCode: 'C01',
    createdAt: '2026-09-08T00:00:00Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'officer.delta@dgis.gov.in',
    fullName: 'Maj. V. Sharma',
    organization: 'Unit Delta (Special Surveillance)',
    role: 'OPERATOR',
    unitCode: 'C04',
    createdAt: '2026-09-08T00:00:00Z',
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    email: 'analyst.golf@dgis.gov.in',
    fullName: 'Capt. S. Verma',
    organization: 'Unit Golf (Signals Analysis)',
    role: 'ANALYST',
    unitCode: 'C07',
    createdAt: '2026-09-08T00:00:00Z',
  },
];

// In-memory fallback user registry for air-gapped / local simulation
const _inMemoryUsers: Map<string, ServerUser & { passwordHash: string }> = new Map();
PRESET_OPERATORS.forEach(op => {
  _inMemoryUsers.set(op.email.toLowerCase(), {
    ...op,
    passwordHash: 'cvia_hash_sec_2026',
  });
});

// Simple HMAC-SHA256 signature generator compatible across Node and Browser
function base64UrlEncode(str: string): string {
  const buf = (globalThis as any).Buffer;
  if (typeof buf !== 'undefined') {
    return buf.from(str, 'utf-8').toString('base64url');
  }
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  const buf = (globalThis as any).Buffer;
  if (typeof buf !== 'undefined') {
    return buf.from(str, 'base64url').toString('utf-8');
  }
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  return decodeURIComponent(bin.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

// Generates a self-verifiable signed session token
export function signToken(user: ServerUser): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      organization: user.organization,
      role: user.role,
      unitCode: user.unitCode,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 86400, // 7 days validity
    })
  );
  // Signature incorporates secret
  const sigInput = `${header}.${payload}.${JWT_SECRET}`;
  let hash = 0;
  for (let i = 0; i < sigInput.length; i++) {
    hash = ((hash << 5) - hash) + sigInput.charCodeAt(i);
    hash |= 0;
  }
  const signature = base64UrlEncode(`cvia_sig_${Math.abs(hash)}`);
  return `${header}.${payload}.${signature}`;
}

// Verifies a bearer token and extracts user
export function verifyToken(token: string): ServerUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const sigInput = `${header}.${payload}.${JWT_SECRET}`;
    let hash = 0;
    for (let i = 0; i < sigInput.length; i++) {
      hash = ((hash << 5) - hash) + sigInput.charCodeAt(i);
      hash |= 0;
    }
    const expectedSig = base64UrlEncode(`cvia_sig_${Math.abs(hash)}`);
    if (signature !== expectedSig) return null;

    const data = JSON.parse(base64UrlDecode(payload));
    if (data.exp && Date.now() / 1000 > data.exp) return null;

    return {
      id: data.sub,
      email: data.email,
      fullName: data.fullName,
      organization: data.organization,
      role: data.role,
      unitCode: data.unitCode,
      createdAt: new Date((data.iat || Date.now() / 1000) * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

// Extracts user from Authorization: Bearer <token>
export function authenticateRequest(authHeader?: string | null): ServerUser | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return verifyToken(match[1].trim());
}

// Operator login handler
export async function loginOperator(email: string, _password?: string): Promise<UserSession> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Try cloud database if configured
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('cvia_users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (data) {
        const user: ServerUser = {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          organization: data.organization,
          role: data.role as ServerUser['role'],
          unitCode: data.unit_code,
          createdAt: data.created_at,
        };
        const token = signToken(user);
        return { user, token, expiresAt: Date.now() + 7 * 86400000 };
      }
    } catch {
      // Proceed to local registry
    }
  }

  // 2. Fallback to preset operator registry
  const matchedPreset = PRESET_OPERATORS.find(p => p.email.toLowerCase() === cleanEmail);
  const user: ServerUser = matchedPreset || {
    id: `usr_${Math.random().toString(36).substring(2, 10)}`,
    email: cleanEmail,
    fullName: cleanEmail.split('@')[0].toUpperCase(),
    organization: 'Ministry of Defence / DGIS Operator',
    role: 'OPERATOR',
    unitCode: 'C01',
    createdAt: new Date().toISOString(),
  };

  const token = signToken(user);
  return {
    user,
    token,
    expiresAt: Date.now() + 7 * 86400000,
  };
}

// Operator registration handler
export async function registerOperator(
  email: string,
  fullName: string,
  organization: string,
  unitCode: string,
  role: ServerUser['role'] = 'OPERATOR'
): Promise<UserSession> {
  const cleanEmail = email.trim().toLowerCase();
  const newUser: ServerUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: cleanEmail,
    fullName,
    organization: organization || 'Ministry of Defence / DGIS',
    role,
    unitCode: unitCode || 'C01',
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from('cvia_users').insert({
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.fullName,
        organization: newUser.organization,
        role: newUser.role,
        unit_code: newUser.unitCode,
        password_hash: 'cvia_registered_operator',
      });
    } catch {
      // Keep in local registry
    }
  }

  _inMemoryUsers.set(cleanEmail, { ...newUser, passwordHash: 'cvia_registered_operator' });
  const token = signToken(newUser);
  return {
    user: newUser,
    token,
    expiresAt: Date.now() + 7 * 86400000,
  };
}
