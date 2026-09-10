// API Controller — /api/assets
// Handles asset storage, retrieval, and cryptographic audits for authenticated operators

import { authenticateRequest } from '../src/server/authService.ts';
import { getUserAssets, enrollUserAsset, runAssetAudit } from '../src/server/assetService.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  const authUser = authenticateRequest(req.headers?.authorization);
  if (!authUser) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Valid operator session required' });
  }

  const url = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
  const isAudit = url.searchParams.get('audit') === 'true';

  try {
    // 1. GET /api/assets
    if (req.method === 'GET') {
      const assets = await getUserAssets(authUser.id);
      return res.status(200).json({ success: true, data: assets });
    }

    // 2. POST /api/assets?audit=true
    if (req.method === 'POST' && isAudit) {
      const auditReport = runAssetAudit(authUser.id);
      return res.status(200).json({ success: true, data: auditReport });
    }

    // 3. POST /api/assets (store new asset)
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      } else if (!body) {
        body = {};
      }

      const { analysis, contributor, previewUrl } = body;
      if (!analysis || !analysis.sha256) {
        return res.status(400).json({ success: false, error: 'Missing analysis payload with SHA-256' });
      }

      const newAsset = await enrollUserAsset(
        analysis,
        contributor || { id: authUser.unitCode, name: authUser.fullName },
        authUser.id,
        previewUrl
      );

      return res.status(201).json({ success: true, data: newAsset });
    }

    return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
  } catch (err: any) {
    console.error('[API /api/assets] Internal error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Asset processing error' });
  }
}
