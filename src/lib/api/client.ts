// CVIA — Standardized Frontend API Client
// SIH26228 · Ministry of Defence / DGIS

const TOKEN_KEY = 'CVIA_OPERATOR_TOKEN';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string, persist = true): void {
  try {
    if (persist) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore
  }
}

export interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (!options.skipAuth) {
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: json?.error || `Server responded with status ${res.status}: ${res.statusText}`,
      };
    }

    return json || { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network connection failed to CVIA Backend API',
    };
  }
}
