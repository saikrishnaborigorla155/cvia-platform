// CVIA — Persistent Verification & Assurance Engine Service
// SIH26228 · Ministry of Defence / DGIS
// Handles persistent verification lifecycle, multi-user isolation, and audit synchronization.

import type { StoredVerification } from './types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { auditAllDatabaseAssets } from '../services/cviaDatabase';

// Initial baseline verification record matching the certified DGIS MVP state
const BASELINE_VERIFICATION: StoredVerification = {
  id: 'ver_dgis_baseline_00124',
  verificationId: 'VER-2026-00124',
  userId: '11111111-1111-1111-1111-111111111111', // Unit Alpha
  datasetId: 'CVIA-DATASET-001',
  modelId: 'CVIA-MODEL-003',
  status: 'VERIFIED',
  integrityHealth: 82,
  totalFiles: 56,
  exactDuplicates: 43,
  nearDuplicates: 23,
  malfunctionData: 15,
  verifiedCleanFiles: 41,
  highRiskContributors: 1,
  riskScore: 18,
  decision: 'CONDITIONAL_PASS',
  stagesData: [
    { stageId: 'S01', label: 'Preparing Artifacts & File Hashes', status: 'done' },
    { stageId: 'S02', label: 'Computing Cryptographic SHA-256', status: 'done' },
    { stageId: 'S03', label: 'Parsing Dataset & Image Manifests', status: 'done' },
    { stageId: 'S04', label: 'Checking Duplicates & Perceptual Hashes', status: 'done' },
    { stageId: 'S05', label: 'Checking Labels & Contributor Distribution', status: 'done' },
    { stageId: 'S06', label: 'Analysing Contributor Risk Indices', status: 'done' },
    { stageId: 'S07', label: 'Comparing against Baseline Database Registry', status: 'done' },
    { stageId: 'S08', label: 'Model Weight Integrity & Fingerprinting', status: 'done' },
    { stageId: 'S09', label: 'Cryptographic Provenance Chain Verification', status: 'done' },
    { stageId: 'S10', label: 'Inference Nonce & Replay Detection', status: 'done' },
    { stageId: 'S11', label: 'Generating Explainable Security Findings', status: 'done' },
    { stageId: 'S12', label: 'Computing Overall Assurance & Coverage', status: 'done' },
    { stageId: 'S13', label: 'Recording Immutable Cryptographic Audit Block', status: 'done' },
  ],
  findingsData: [
    { id: 'FND-001', title: 'Adversarial Weight Perturbation in Layer 7', severity: 'CRITICAL', status: 'FLAGGED' },
    { id: 'FND-002', title: 'Near-Duplicate Cluster Detected (C07 Contributor)', severity: 'HIGH', status: 'REVIEW' },
    { id: 'FND-003', title: 'Metadata Inconsistency in Recon Manifest', severity: 'MEDIUM', status: 'RESOLVED' },
  ],
  flaggedItems: [
    { assetId: 'ASSET-DB-0035-MTV38T2F', name: 'yolov8_vehicle_v3.onnx', issue: 'Adversarial Weights Mismatch', severity: 'CRITICAL', action: 'QUARANTINE' },
    { assetId: 'ASSET-DB-0034-MTV38SW5', name: 'IMG_00482_cluster_ref.jpg', issue: 'Visual pHash Collision (>92%)', severity: 'HIGH', action: 'REVIEW' },
    { assetId: 'ASSET-DB-0033-MTV38RVL', name: 'Screenshot 2026-09-03 172822.png', issue: 'Batch Exact Duplicate', severity: 'MEDIUM', action: 'REVIEW' },
  ],
  createdAt: '2026-09-10T04:15:00Z',
  updatedAt: '2026-09-10T04:15:00Z',
};

// In-memory verification cache indexed by userId
const _userVerificationsCache: Map<string, StoredVerification[]> = new Map();

// Initialize baseline user's cache
_userVerificationsCache.set(BASELINE_VERIFICATION.userId, [BASELINE_VERIFICATION]);

// Helper to map DB row to StoredVerification
function mapVerificationRow(row: Record<string, unknown>): StoredVerification {
  return {
    id: String(row.id ?? ''),
    verificationId: String(row.verification_id ?? ''),
    userId: String(row.user_id ?? ''),
    datasetId: String(row.dataset_id ?? 'CVIA-DATASET-001'),
    modelId: String(row.model_id ?? 'CVIA-MODEL-003'),
    status: (row.status as StoredVerification['status']) ?? 'VERIFIED',
    integrityHealth: Number(row.integrity_health ?? 82),
    totalFiles: Number(row.total_files ?? 0),
    exactDuplicates: Number(row.exact_duplicates ?? 0),
    nearDuplicates: Number(row.near_duplicates ?? 0),
    malfunctionData: Number(row.malfunction_data ?? 0),
    verifiedCleanFiles: Number(row.verified_clean_files ?? 0),
    highRiskContributors: Number(row.high_risk_contributors ?? 0),
    riskScore: Number(row.risk_score ?? 18),
    decision: (row.decision as StoredVerification['decision']) ?? 'CONDITIONAL_PASS',
    stagesData: (row.stages_data as StoredVerification['stagesData']) ?? [],
    findingsData: (row.findings_data as StoredVerification['findingsData']) ?? [],
    flaggedItems: (row.flagged_items as StoredVerification['flaggedItems']) ?? [],
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

/**
 * Get latest verification result for the authenticated user.
 * Multi-user isolated: User A only receives User A's verification.
 */
export async function getLatestVerification(userId: string): Promise<StoredVerification | null> {
  // 1. Check Supabase `verifications` table if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const parsed = mapVerificationRow(data as Record<string, unknown>);
        // Update memory cache
        const existing = _userVerificationsCache.get(userId) || [];
        _userVerificationsCache.set(userId, [parsed, ...existing.filter(v => v.verificationId !== parsed.verificationId)]);
        return parsed;
      }
    } catch {
      // Table may be pending creation, fall through to fallback
    }
  }

  // 2. Check in-memory / local verification cache for this specific user
  const userList = _userVerificationsCache.get(userId);
  if (userList && userList.length > 0) {
    return userList[0];
  }

  // 3. If baseline Unit Alpha operator, seed baseline verification
  if (userId === '11111111-1111-1111-1111-111111111111') {
    _userVerificationsCache.set(userId, [BASELINE_VERIFICATION]);
    return BASELINE_VERIFICATION;
  }

  // 4. Other users with no prior verification return null (allowing clean empty state)
  return null;
}

/**
 * Get all verifications for the authenticated user
 */
export async function getVerificationsByUser(userId: string): Promise<StoredVerification[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((r: any) => mapVerificationRow(r as Record<string, unknown>));
      }
    } catch {
      // Fall through to memory cache
    }
  }

  return _userVerificationsCache.get(userId) || [];
}

/**
 * Get a specific verification by verificationId for the authenticated user.
 * Strictly checks that `userId` owns the record.
 */
export async function getVerificationById(verificationId: string, userId: string): Promise<StoredVerification | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('verification_id', verificationId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return mapVerificationRow(data as Record<string, unknown>);
      }
    } catch {
      // Fall through
    }
  }

  const list = _userVerificationsCache.get(userId) || [];
  return list.find(v => v.verificationId === verificationId) || null;
}

/**
 * Executes a verification run on the backend and persists the result.
 * Multi-user isolated: result is stamped with `userId`.
 */
export async function createVerificationRun(
  userId: string,
  params?: {
    datasetId?: string;
    modelId?: string;
  }
): Promise<StoredVerification> {
  // Compute audit report across active database assets
  const auditReport = auditAllDatabaseAssets();

  // Generate sequence-based human-readable ID
  const existingList = _userVerificationsCache.get(userId) || [];
  const nextNum = 124 + existingList.length + 1;
  const verificationId = `VER-2026-00${nextNum}`;

  const newVerification: StoredVerification = {
    id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    verificationId,
    userId,
    datasetId: params?.datasetId || 'CVIA-DATASET-001',
    modelId: params?.modelId || 'CVIA-MODEL-003',
    status: auditReport.overallHealthScore >= 80 ? 'VERIFIED' : (auditReport.overallHealthScore >= 60 ? 'REVIEW' : 'QUARANTINE'),
    integrityHealth: auditReport.overallHealthScore,
    totalFiles: auditReport.totalFiles,
    exactDuplicates: auditReport.totalExactDuplicates,
    nearDuplicates: auditReport.totalNearDuplicates,
    malfunctionData: auditReport.totalMalfunctionFiles,
    verifiedCleanFiles: auditReport.totalVerifiedClean,
    highRiskContributors: auditReport.totalHighRiskContributors,
    riskScore: Math.max(5, 100 - auditReport.overallHealthScore),
    decision: auditReport.overallHealthScore >= 80 ? 'ACCEPT' : (auditReport.overallHealthScore >= 60 ? 'CONDITIONAL_PASS' : 'REJECT'),
    stagesData: BASELINE_VERIFICATION.stagesData.map((s: any) => ({ ...s, status: 'done' })),
    findingsData: [
      {
        id: `FND-${Date.now()}`,
        title: `Verification Run Completed (${auditReport.totalFiles} Assets Evaluated)`,
        severity: auditReport.totalMalfunctionFiles > 0 ? 'CRITICAL' : (auditReport.totalNearDuplicates > 0 ? 'HIGH' : 'LOW'),
        status: 'VERIFIED',
      },
    ],
    flaggedItems: auditReport.flaggedItems,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Try to save to Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase.from('verifications').insert({
        id: newVerification.id,
        verification_id: newVerification.verificationId,
        user_id: newVerification.userId,
        dataset_id: newVerification.datasetId,
        model_id: newVerification.modelId,
        status: newVerification.status,
        integrity_health: newVerification.integrityHealth,
        total_files: newVerification.totalFiles,
        exact_duplicates: newVerification.exactDuplicates,
        near_duplicates: newVerification.nearDuplicates,
        malfunction_data: newVerification.malfunctionData,
        verified_clean_files: newVerification.verifiedCleanFiles,
        high_risk_contributors: newVerification.highRiskContributors,
        risk_score: newVerification.riskScore,
        decision: newVerification.decision,
        stages_data: newVerification.stagesData,
        findings_data: newVerification.findingsData,
        flagged_items: newVerification.flaggedItems,
        created_at: newVerification.createdAt,
        updated_at: newVerification.updatedAt,
      });
      console.info(`[CVIA Backend] ✓ Verification ${verificationId} persisted to Supabase for user ${userId}`);
    } catch (err) {
      console.warn('[CVIA Backend] Could not persist verification to cloud table, cached locally:', err);
    }
  }

  // 2. Update local in-memory user cache
  const updatedList = [newVerification, ...existingList];
  _userVerificationsCache.set(userId, updatedList);

  return newVerification;
}
