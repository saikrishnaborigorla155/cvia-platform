// API Controller — /api/verifications
// Manages persistent verification lifecycles with user data isolation

import { authenticateRequest } from '../src/server/authService.ts';
import {
  getLatestVerification,
  getVerificationsByUser,
  getVerificationById,
  createVerificationRun
} from '../src/server/verificationService.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  // Authenticate user via bearer token
  const authUser = authenticateRequest(req.headers?.authorization);
  if (!authUser) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Valid operator session required to access verification records',
    });
  }

  const url = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
  const idParam = url.searchParams.get('id');
  const latestParam = url.searchParams.get('latest');

  try {
    // 1. GET /api/verifications?latest=true
    if (req.method === 'GET' && latestParam === 'true') {
      const latest = await getLatestVerification(authUser.id);
      return res.status(200).json({ success: true, data: latest });
    }

    // 2. GET /api/verifications?id=...
    if (req.method === 'GET' && idParam) {
      const record = await getVerificationById(idParam, authUser.id);
      if (!record) {
        return res.status(404).json({ success: false, error: 'Verification record not found or access denied' });
      }
      return res.status(200).json({ success: true, data: record });
    }

    // 3. GET /api/verifications (list)
    if (req.method === 'GET') {
      const list = await getVerificationsByUser(authUser.id);
      return res.status(200).json({ success: true, data: list });
    }

    // 4. POST /api/verifications (create new verification)
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      } else if (!body) {
        body = {};
      }

      const newVer = await createVerificationRun(authUser.id, {
        datasetId: body.datasetId,
        modelId: body.modelId,
      });

      return res.status(201).json({
        success: true,
        data: newVer,
        message: `Verification ${newVer.verificationId} successfully evaluated and stored.`,
      });
    }

    return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
  } catch (err: any) {
    console.error('[API /api/verifications] Internal error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Verification processing error' });
  }
}
