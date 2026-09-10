// API Controller — /api/auth
// Handles operator login, registration, and session identity

import { authenticateRequest, loginOperator, registerOperator, PRESET_OPERATORS } from '../src/server/authService.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  const url = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
  const action = url.searchParams.get('action') || (req.method === 'GET' ? 'me' : 'login');

  try {
    // 1. GET /api/auth?action=me
    if (req.method === 'GET' && action === 'me') {
      const user = authenticateRequest(req.headers?.authorization);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized: invalid or missing session token' });
      }
      return res.status(200).json({ success: true, data: { user } });
    }

    // 2. GET /api/auth?action=presets (returns available command units for quick switching in demo)
    if (req.method === 'GET' && action === 'presets') {
      return res.status(200).json({ success: true, data: PRESET_OPERATORS });
    }

    // Parse body if needed
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    } else if (!body) {
      body = {};
    }

    // 3. POST /api/auth?action=login
    if (req.method === 'POST' && (action === 'login' || !action)) {
      const { email, password } = body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
      }
      const session = await loginOperator(email, password);
      return res.status(200).json({ success: true, data: session });
    }

    // 4. POST /api/auth?action=register
    if (req.method === 'POST' && action === 'register') {
      const { email, fullName, organization, unitCode, role } = body;
      if (!email || !fullName) {
        return res.status(400).json({ success: false, error: 'Email and full name are required' });
      }
      const session = await registerOperator(email, fullName, organization, unitCode, role);
      return res.status(201).json({ success: true, data: session });
    }

    return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
  } catch (err: any) {
    console.error('[API /api/auth] Internal error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Authentication error' });
  }
}
