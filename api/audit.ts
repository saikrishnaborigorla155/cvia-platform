// API Controller — /api/audit
// Returns user-isolated immutable audit logs and hash chains

import { authenticateRequest } from '../src/server/authService';
import { getUserAuditTrail, appendAuditEvent } from '../src/server/auditService';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  const authUser = authenticateRequest(req.headers?.authorization);
  if (!authUser) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Valid operator session required' });
  }

  try {
    // 1. GET /api/audit
    if (req.method === 'GET') {
      const trail = await getUserAuditTrail(authUser.id);
      return res.status(200).json({ success: true, data: trail });
    }

    // 2. POST /api/audit
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      } else if (!body) {
        body = {};
      }

      const event = await appendAuditEvent(authUser.id, body);
      return res.status(201).json({ success: true, data: event });
    }

    return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
  } catch (err: any) {
    console.error('[API /api/audit] Internal error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Audit trail error' });
  }
}
