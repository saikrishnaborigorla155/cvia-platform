// CVIA — Database Service (Supabase Cloud + In-Memory Cache)
// SIH26228 · Ministry of Defence / DGIS
// All data syncs to Supabase so every user shares the same database.

import type { FileAnalysisResult } from './fileHasher';
import { computeHammingDistance } from './fileHasher';
import { supabase, SESSION_ID, isSupabaseConfigured } from '../lib/supabaseClient';

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

export type ComparisonStatus =
  | 'VERIFIED_BASELINE_MATCH'
  | 'TAMPERED_HASH'
  | 'NEAR_DUPLICATE'
  | 'NEW_ASSET_UNREGISTERED'
  | 'FORMAT_ANOMALY';

export interface ComparisonResult {
  status: ComparisonStatus;
  matchedAssetId?: string;
  matchedAssetName?: string;
  matchedField?: string;
  baselineHash?: string;
  calculatedHash: string;
  similarityScore?: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  findingTitle: string;
  findingDetails: string;
  recommendedAction: 'ACCEPT' | 'REVIEW' | 'QUARANTINE';
}

export interface StoredDatabaseAsset {
  assetId: string;
  name: string;
  type: 'DATASET_IMAGE' | 'DATASET_MANIFEST' | 'MODEL_WEIGHTS' | 'INFERENCE_LOG' | 'OTHER';
  sha256: string;
  perceptualHash?: string;
  fileSize: number;
  storedAt: string;
  contributorId: string;
  contributorName: string;
  provenanceBlock: string;
  status: 'VERIFIED' | 'REVIEW' | 'QUARANTINE';
  metadata: Record<string, unknown>;
  previewUrl?: string;
}

export interface IngestedHistoryRecord {
  fileName: string;
  sha256: string;
  perceptualHash?: string;
  fileSize: number;
  timestamp: string;
}

export interface CVIADatabaseSchema {
  version: string;
  lastUpdated: string;
  assets: StoredDatabaseAsset[];
  baselineModels: {
    modelId: string;
    name: string;
    expectedSha256: string;
    architecture: string;
    format: string;
  }[];
  baselineDatasets: {
    datasetId: string;
    name: string;
    expectedSha256: string;
    sampleCount: number;
  }[];
}

// ─────────────────────────────────────────────────────────
// BASELINE (seed data — always present)
// ─────────────────────────────────────────────────────────

const BASELINE_MODELS: CVIADatabaseSchema['baselineModels'] = [
  {
    modelId: 'CVIA-MODEL-003',
    name: 'Vehicle Detection Model v3.2',
    expectedSha256: 'sha256:9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7',
    architecture: 'YOLOv8-Medium (adapted)',
    format: 'ONNX',
  },
  {
    modelId: 'CVIA-MODEL-002-CLEAN',
    name: 'Recon Target Classifier v2.1 (Baseline)',
    expectedSha256: 'sha256:4f8a2b6c1d9e3f7a5b0c8d4e2a6f1b9c7d3e5a8b0c2d4e6f8a1b3c5d7e9f0a2b',
    architecture: 'ResNet-50 CVIA-Hardened',
    format: 'PyTorch',
  },
];

const BASELINE_DATASETS: CVIADatabaseSchema['baselineDatasets'] = [
  {
    datasetId: 'CVIA-DATASET-001',
    name: 'Multi-Source CV Training Dataset — Batch 24',
    expectedSha256: 'sha256:7f3a9c2d8e1b4f6a0d3c7e9b2f5a8d1c4e7f0a3b6d9e2c5f8a1b4d7e0c3f6a9b2',
    sampleCount: 1300,
  },
];

const BASELINE_ASSETS: StoredDatabaseAsset[] = [
  {
    assetId: 'ASSET-REF-001',
    name: 'IMG_00341_baseline.jpg',
    type: 'DATASET_IMAGE',
    sha256: 'sha256:a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    perceptualHash: 'pHash:e1d2c3b4a5f60718',
    fileSize: 87432,
    storedAt: '2026-09-08T10:15:00Z',
    contributorId: 'C04',
    contributorName: 'Unit Delta',
    provenanceBlock: 'BLK-PROV-901',
    status: 'VERIFIED',
    metadata: { label: 'car', width: 640, height: 480 },
  },
  {
    assetId: 'ASSET-REF-002',
    name: 'IMG_00482_cluster_ref.jpg',
    type: 'DATASET_IMAGE',
    sha256: 'sha256:b1c2d3e4f5a6b7c8',
    perceptualHash: 'pHash:f0a1b2c3d4e5f6a7',
    fileSize: 91200,
    storedAt: '2026-09-08T11:20:00Z',
    contributorId: 'C07',
    contributorName: 'Unit Golf',
    provenanceBlock: 'BLK-PROV-902',
    status: 'REVIEW',
    metadata: { label: 'car', clusterId: 'NDC-001' },
  },
  {
    assetId: 'ASSET-REF-003',
    name: 'yolov8_vehicle_v3.onnx',
    type: 'MODEL_WEIGHTS',
    sha256: 'sha256:9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7',
    fileSize: 49682110,
    storedAt: '2026-09-09T08:00:00Z',
    contributorId: 'DGIS-HQ',
    contributorName: 'DGIS Model Registry',
    provenanceBlock: 'BLK-PROV-880',
    status: 'VERIFIED',
    metadata: { modelId: 'CVIA-MODEL-003', format: 'ONNX' },
  },
];

// ─────────────────────────────────────────────────────────
// IN-MEMORY CACHE (populated from Supabase on init)
// ─────────────────────────────────────────────────────────

let _assetsCache: StoredDatabaseAsset[] = [...BASELINE_ASSETS];
let _historyCache: IngestedHistoryRecord[] = [];
let _initialized = false;
let _initPromise: Promise<void> | null = null;

/** Listeners notified once the async Supabase init is complete */
const _readyListeners: Array<() => void> = [];

/**
 * Register a callback that fires exactly once when the database is ready
 * (or immediately if already initialized).
 * Returns an unsubscribe function.
 */
export function onDatabaseReady(cb: () => void): () => void {
  if (_initialized) {
    cb();
    return () => {};
  }
  _readyListeners.push(cb);
  return () => {
    const idx = _readyListeners.indexOf(cb);
    if (idx !== -1) _readyListeners.splice(idx, 1);
  };
}

/** Maps a Supabase row → StoredDatabaseAsset */
function mapRow(row: Record<string, unknown>): StoredDatabaseAsset {
  return {
    assetId:         String(row.asset_id  ?? ''),
    name:            String(row.name      ?? ''),
    type:            (row.type as StoredDatabaseAsset['type']) ?? 'OTHER',
    sha256:          String(row.sha256    ?? ''),
    perceptualHash:  row.perceptual_hash ? String(row.perceptual_hash) : undefined,
    fileSize:        Number(row.file_size ?? 0),
    storedAt:        String(row.stored_at ?? new Date().toISOString()),
    contributorId:   String(row.contributor_id   ?? 'unknown'),
    contributorName: String(row.contributor_name ?? 'Unknown'),
    provenanceBlock: String(row.provenance_block ?? ''),
    status:          (row.status as StoredDatabaseAsset['status']) ?? 'VERIFIED',
    metadata:        (row.metadata as Record<string, unknown>) ?? {},
    previewUrl:      row.preview_url ? String(row.preview_url) : undefined,
  };
}

/** Maps a Supabase ingest_history row → IngestedHistoryRecord */
function mapHistory(row: Record<string, unknown>): IngestedHistoryRecord {
  return {
    fileName:      String(row.file_name      ?? ''),
    sha256:        String(row.sha256         ?? ''),
    perceptualHash: row.perceptual_hash ? String(row.perceptual_hash) : undefined,
    fileSize:      Number(row.file_size      ?? 0),
    timestamp:     String(row.ingested_at   ?? new Date().toISOString()),
  };
}

/**
 * Initializes the in-memory cache from Supabase.
 * Safe to call multiple times — only runs once.
 */
export async function initializeDatabase(): Promise<void> {
  if (_initialized) return;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    if (!isSupabaseConfigured) {
      console.info('[CVIA DB] Supabase not configured. Operating in air-gapped baseline mode.');
      _initialized = true;
      _readyListeners.splice(0).forEach(cb => cb());
      return;
    }

    try {
      const [assetsResult, historyResult] = await Promise.all([
        supabase
          .from('database_assets')
          .select('*')
          .order('stored_at', { ascending: false })
          .limit(500),
        supabase
          .from('ingest_history')
          .select('*')
          .order('ingested_at', { ascending: false })
          .limit(500),
      ]);

      if (assetsResult.error) {
        console.warn('[CVIA DB] Could not load assets from Supabase:', assetsResult.error.message);
      } else {
        const cloudAssets = (assetsResult.data ?? []).map(mapRow);
        // Merge cloud assets with baseline, cloud assets take priority
        const baselineFiltered = BASELINE_ASSETS.filter(
          b => !cloudAssets.some(c => c.assetId === b.assetId)
        );
        _assetsCache = [...cloudAssets, ...baselineFiltered];
      }

      if (historyResult.error) {
        console.warn('[CVIA DB] Could not load history from Supabase:', historyResult.error.message);
      } else {
        _historyCache = (historyResult.data ?? []).map(mapHistory);
      }

      _initialized = true;
      // Notify all ready-listeners so UIs can refresh their state
      _readyListeners.splice(0).forEach(cb => cb());
      console.info(`[CVIA DB] ✓ Initialized — ${_assetsCache.length} assets, ${_historyCache.length} history records`);
    } catch (err) {
      console.error('[CVIA DB] Initialization failed, running offline:', err);
      _initialized = true;
      // Notify even on error so UIs aren't left waiting indefinitely
      _readyListeners.splice(0).forEach(cb => cb());
    }
  })();

  return _initPromise;
}

// ─────────────────────────────────────────────────────────
// REALTIME CHANNEL MULTIPLEXER (Singleton Channel)
// ─────────────────────────────────────────────────────────

const _assetChangeListeners: Array<(assets: StoredDatabaseAsset[]) => void> = [];
let _realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let _isChannelSubscribed = false;

function ensureRealtimeChannel() {
  if (!isSupabaseConfigured || _realtimeChannel) return;

  try {
    _realtimeChannel = supabase
      .channel('cvia_assets_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'database_assets' },
        (payload) => {
          try {
            const newAsset = mapRow(payload.new as Record<string, unknown>);
            // Only add if not already in cache
            if (!_assetsCache.some(a => a.assetId === newAsset.assetId)) {
              _assetsCache = [newAsset, ..._assetsCache];
              const snapshot = [..._assetsCache];
              _assetChangeListeners.forEach(cb => {
                try {
                  cb(snapshot);
                } catch (e) {
                  console.error('[CVIA DB] Error in asset change listener:', e);
                }
              });
            }
          } catch (err) {
            console.error('[CVIA DB] Error mapping realtime asset row:', err);
          }
        }
      );

    if (!_isChannelSubscribed) {
      _isChannelSubscribed = true;
      _realtimeChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info('[CVIA DB] ✓ Real-time postgres_changes channel connected');
        }
      });
    }
  } catch (err) {
    console.warn('[CVIA DB] Real-time subscription setup encountered error:', err);
  }
}

/**
 * Subscribe to real-time asset changes (updates cache live when other users enroll).
 * Multiplexed safely: components can subscribe/unsubscribe without throwing
 * "cannot add callbacks after subscribe" or removing the channel for other components.
 */
export function subscribeToAssetChanges(onUpdate: (assets: StoredDatabaseAsset[]) => void): () => void {
  _assetChangeListeners.push(onUpdate);
  ensureRealtimeChannel();

  return () => {
    const idx = _assetChangeListeners.indexOf(onUpdate);
    if (idx !== -1) {
      _assetChangeListeners.splice(idx, 1);
    }
  };
}


// ─────────────────────────────────────────────────────────
// SYNCHRONOUS READ FUNCTIONS (use in-memory cache)
// ─────────────────────────────────────────────────────────

export function normalizeHash(hash?: string): string {
  if (!hash) return '';
  return hash.trim().toLowerCase().replace(/^sha256:/i, '').replace(/^phash:/i, '');
}

export function getLocalDatabase(): CVIADatabaseSchema {
  return {
    version: '2.0.0',
    lastUpdated: new Date().toISOString(),
    assets: _assetsCache,
    baselineModels: BASELINE_MODELS,
    baselineDatasets: BASELINE_DATASETS,
  };
}

export function getIngestedHistory(): IngestedHistoryRecord[] {
  return _historyCache;
}

// ─────────────────────────────────────────────────────────
// COMPARISON ENGINE (fully synchronous — uses cache)
// ─────────────────────────────────────────────────────────

export function compareFileAgainstDatabase(
  analysis: FileAnalysisResult,
  _targetHint?: 'DATASET' | 'MODEL' | 'INFERENCE' | 'AUTO',
  otherBatchFiles?: FileAnalysisResult[]
): ComparisonResult {
  const cleanInputHash = normalizeHash(analysis.sha256);
  const lowerName = analysis.fileName.toLowerCase();

  // 1. Exact duplicate within same batch
  if (otherBatchFiles && otherBatchFiles.length > 0) {
    const batchExact = otherBatchFiles.find(
      o => o !== analysis && normalizeHash(o.sha256) === cleanInputHash
    );
    if (batchExact) {
      return {
        status: 'NEAR_DUPLICATE',
        matchedAssetName: batchExact.fileName,
        matchedField: 'Exact SHA-256 Collision (Duplicate in Batch)',
        baselineHash: batchExact.sha256,
        calculatedHash: analysis.sha256,
        similarityScore: 1.0,
        riskLevel: 'HIGH',
        findingTitle: 'Exact Duplicate Image Detected (100% SHA-256 Match)',
        findingDetails: `Identical bit-for-bit duplicate of "${batchExact.fileName}" in the current batch.`,
        recommendedAction: 'REVIEW',
      };
    }
    if (analysis.imageMeta?.perceptualHash) {
      const inputPHash = analysis.imageMeta.perceptualHash;
      const batchNear = otherBatchFiles.find(o => {
        if (o === analysis || !o.imageMeta?.perceptualHash) return false;
        return computeHammingDistance(inputPHash, o.imageMeta.perceptualHash) <= 6;
      });
      if (batchNear) {
        const dist = computeHammingDistance(inputPHash, batchNear.imageMeta!.perceptualHash);
        const pct = Math.round((1 - dist / 64) * 100);
        return {
          status: 'NEAR_DUPLICATE',
          matchedAssetName: batchNear.fileName,
          matchedField: 'Visual Perceptual Hash (pHash)',
          baselineHash: batchNear.imageMeta!.perceptualHash,
          calculatedHash: inputPHash,
          similarityScore: pct / 100,
          riskLevel: 'HIGH',
          findingTitle: `Near-Duplicate in Batch (${pct}% Visual Match)`,
          findingDetails: `Visual pHash matches "${batchNear.fileName}" in batch (Hamming ${dist}/64).`,
          recommendedAction: 'REVIEW',
        };
      }
    }
  }

  // 2. Exact SHA-256 match against stored cloud assets
  const exactAsset = _assetsCache.find(a => normalizeHash(a.sha256) === cleanInputHash);
  if (exactAsset) {
    return {
      status: 'NEAR_DUPLICATE',
      matchedAssetId: exactAsset.assetId,
      matchedAssetName: exactAsset.name,
      matchedField: 'Exact Asset SHA-256 Hash',
      baselineHash: exactAsset.sha256,
      calculatedHash: analysis.sha256,
      similarityScore: 1.0,
      riskLevel: 'HIGH',
      findingTitle: 'Exact Duplicate of Database Asset',
      findingDetails: `File is identical (SHA-256 match) to "${exactAsset.name}" [${exactAsset.assetId}] stored on ${new Date(exactAsset.storedAt).toLocaleDateString()}.`,
      recommendedAction: 'REVIEW',
    };
  }

  // 3. SHA-256 match against ingest history (cross-session duplicates)
  const priorIngest = _historyCache.find(h => normalizeHash(h.sha256) === cleanInputHash);
  if (priorIngest) {
    return {
      status: 'NEAR_DUPLICATE',
      matchedAssetName: priorIngest.fileName,
      matchedField: 'SHA-256 Hash (Previously Ingested by Any User)',
      baselineHash: priorIngest.sha256,
      calculatedHash: analysis.sha256,
      similarityScore: 1.0,
      riskLevel: 'HIGH',
      findingTitle: 'Duplicate of Previously Ingested File (Global History)',
      findingDetails: `This file was previously ingested on ${new Date(priorIngest.timestamp).toLocaleString()} by another session.`,
      recommendedAction: 'REVIEW',
    };
  }

  // 4. Baseline model match
  const matchedModel = BASELINE_MODELS.find(m => normalizeHash(m.expectedSha256) === cleanInputHash);
  if (matchedModel) {
    return {
      status: 'VERIFIED_BASELINE_MATCH',
      matchedAssetId: matchedModel.modelId,
      matchedAssetName: matchedModel.name,
      matchedField: 'Cryptographic Model SHA-256',
      baselineHash: matchedModel.expectedSha256,
      calculatedHash: analysis.sha256,
      similarityScore: 1.0,
      riskLevel: 'LOW',
      findingTitle: 'Cryptographic Model Weights Authenticated',
      findingDetails: `Hash matches registered baseline model ${matchedModel.name} (${matchedModel.modelId}).`,
      recommendedAction: 'ACCEPT',
    };
  }

  // 5. Baseline dataset match
  const matchedDataset = BASELINE_DATASETS.find(d => normalizeHash(d.expectedSha256) === cleanInputHash);
  if (matchedDataset) {
    return {
      status: 'VERIFIED_BASELINE_MATCH',
      matchedAssetId: matchedDataset.datasetId,
      matchedAssetName: matchedDataset.name,
      matchedField: 'Dataset Manifest SHA-256',
      baselineHash: matchedDataset.expectedSha256,
      calculatedHash: analysis.sha256,
      similarityScore: 1.0,
      riskLevel: 'LOW',
      findingTitle: 'Dataset Manifest Authenticated',
      findingDetails: `Hash matches verified baseline dataset ${matchedDataset.name}.`,
      recommendedAction: 'ACCEPT',
    };
  }

  // 6. Model tampering detection
  const isModelFile = /\.(onnx|pt|pth|bin|safetensors)$/.test(lowerName);
  if (isModelFile) {
    const candidateModel = BASELINE_MODELS.find(
      bm => lowerName.includes(bm.modelId.toLowerCase()) || lowerName.includes(bm.name.toLowerCase().slice(0, 7))
    ) || BASELINE_MODELS[0];
    if (candidateModel && normalizeHash(candidateModel.expectedSha256) !== cleanInputHash) {
      return {
        status: 'TAMPERED_HASH',
        matchedAssetId: candidateModel.modelId,
        matchedAssetName: candidateModel.name,
        matchedField: 'Model Weights SHA-256',
        baselineHash: candidateModel.expectedSha256,
        calculatedHash: analysis.sha256,
        similarityScore: 0.0,
        riskLevel: 'CRITICAL',
        findingTitle: 'Model Checkpoint Hash Mismatch / Substitution Detected',
        findingDetails: `SHA-256 does NOT match baseline for ${candidateModel.name}. Possible tampering or backdoor injection.`,
        recommendedAction: 'QUARANTINE',
      };
    }
  }

  // 7. Visual near-duplicate against database images
  if (analysis.imageMeta?.perceptualHash) {
    const inputPHash = analysis.imageMeta.perceptualHash;
    for (const stored of _assetsCache) {
      if (stored.perceptualHash) {
        const dist = computeHammingDistance(inputPHash, stored.perceptualHash);
        if (dist <= 6) {
          const pct = Math.round((1 - dist / 64) * 100);
          return {
            status: 'NEAR_DUPLICATE',
            matchedAssetId: stored.assetId,
            matchedAssetName: stored.name,
            matchedField: 'Visual Perceptual Hash (pHash)',
            baselineHash: stored.perceptualHash,
            calculatedHash: inputPHash,
            similarityScore: pct / 100,
            riskLevel: 'HIGH',
            findingTitle: `Near-Duplicate Image Detected (${pct}% Visual Match)`,
            findingDetails: `Visually matches "${stored.name}" [${stored.assetId}] with Hamming distance ${dist}/64 (${pct}% similarity).`,
            recommendedAction: 'REVIEW',
          };
        }
      }
    }
  }

  // 8. New unregistered asset
  return {
    status: 'NEW_ASSET_UNREGISTERED',
    matchedAssetName: analysis.fileName,
    calculatedHash: analysis.sha256,
    riskLevel: 'LOW',
    findingTitle: 'New Unregistered Asset Candidate',
    findingDetails: `No prior matching signature in global database. Safe for enrollment.`,
    recommendedAction: 'ACCEPT',
  };
}

// ─────────────────────────────────────────────────────────
// WRITE FUNCTIONS (async — push to Supabase + update cache)
// ─────────────────────────────────────────────────────────

/** Records an ingested file in global history (cross-user duplicate detection) */
export async function recordIngestedFile(analysis: FileAnalysisResult): Promise<void> {
  const cleanHash = normalizeHash(analysis.sha256);
  const alreadyInCache = _historyCache.some(h => normalizeHash(h.sha256) === cleanHash);
  if (alreadyInCache) return;

  const record: IngestedHistoryRecord = {
    fileName: analysis.fileName,
    sha256: analysis.sha256,
    perceptualHash: analysis.imageMeta?.perceptualHash,
    fileSize: analysis.fileSize,
    timestamp: new Date().toISOString(),
  };

  // Update local cache immediately
  _historyCache = [record, ..._historyCache.slice(0, 499)];

  // Push to Supabase in background
  if (isSupabaseConfigured) {
    supabase.from('ingest_history').insert({
      file_name:      record.fileName,
      sha256:         record.sha256,
      perceptual_hash: record.perceptualHash,
      file_size:      record.fileSize,
      ingested_at:    record.timestamp,
      session_id:     SESSION_ID,
    }).then(({ error }) => {
      if (error) console.warn('[CVIA DB] Failed to push ingest history:', error.message);
    });
  }
}

/** Enrolls a new asset into the cloud database */
export async function storeAssetInDatabase(
  analysis: FileAnalysisResult,
  contributor: { id: string; name: string },
  customType?: StoredDatabaseAsset['type'],
  status: StoredDatabaseAsset['status'] = 'VERIFIED'
): Promise<StoredDatabaseAsset> {
  const count = _assetsCache.length + 1;
  const assetId = `ASSET-DB-${String(count).padStart(4, '0')}-${Date.now().toString(36).toUpperCase()}`;
  const blockId = `BLK-PROV-${Math.floor(1000 + Math.random() * 9000)}`;

  let inferredType: StoredDatabaseAsset['type'] = customType || 'OTHER';
  if (!customType) {
    if (analysis.imageMeta) inferredType = 'DATASET_IMAGE';
    else if (/\.(onnx|pt|pth|bin|safetensors)$/.test(analysis.fileName.toLowerCase())) inferredType = 'MODEL_WEIGHTS';
    else if (/\.(json|csv|yaml|yml)$/.test(analysis.fileName.toLowerCase())) inferredType = 'DATASET_MANIFEST';
  }

  const newAsset: StoredDatabaseAsset = {
    assetId,
    name:            analysis.fileName,
    type:            inferredType,
    sha256:          analysis.sha256,
    perceptualHash:  analysis.imageMeta?.perceptualHash,
    fileSize:        analysis.fileSize,
    storedAt:        new Date().toISOString(),
    contributorId:   contributor.id || SESSION_ID,
    contributorName: contributor.name || 'Analyst Operator',
    provenanceBlock: blockId,
    status,
    previewUrl:      analysis.previewUrl,
    metadata: {
      fileType:    analysis.fileType,
      imageMeta:   analysis.imageMeta,
      lastModified: analysis.lastModified,
      enrolledBy:  'CVIA Verification Engine',
      sessionId:   SESSION_ID,
    },
  };

  // Update local cache immediately (optimistic update)
  _assetsCache = [newAsset, ..._assetsCache];

  // Push to Supabase if configured
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('database_assets').insert({
      asset_id:         newAsset.assetId,
      name:             newAsset.name,
      type:             newAsset.type,
      sha256:           newAsset.sha256,
      perceptual_hash:  newAsset.perceptualHash,
      file_size:        newAsset.fileSize,
      stored_at:        newAsset.storedAt,
      contributor_id:   newAsset.contributorId,
      contributor_name: newAsset.contributorName,
      provenance_block: newAsset.provenanceBlock,
      status:           newAsset.status,
      metadata:         newAsset.metadata,
      preview_url:      newAsset.previewUrl,
    });

    if (error) {
      console.error('[CVIA DB] Failed to store asset in Supabase:', error.message);
    } else {
      console.info(`[CVIA DB] ✓ Asset "${newAsset.name}" enrolled in cloud database`);
    }
  } else {
    console.info(`[CVIA DB] ✓ Asset "${newAsset.name}" enrolled in local air-gapped cache`);
  }

  // Also record in ingest history
  await recordIngestedFile(analysis);

  return newAsset;
}

// ─────────────────────────────────────────────────────────
// AUDIT REPORT (non-destructive, uses cache)
// ─────────────────────────────────────────────────────────

export interface DatabaseAuditReport {
  totalFiles: number;
  totalExactDuplicates: number;
  totalNearDuplicates: number;
  totalMalfunctionFiles: number;
  totalVerifiedClean: number;
  totalQuarantined: number;
  totalHighRiskContributors: number;
  overallHealthScore: number;
  auditedAt: string;
  flaggedItems: Array<{
    assetId: string;
    name: string;
    issue: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    action: string;
  }>;
}

export function auditAllDatabaseAssets(): DatabaseAuditReport {
  const assets = _assetsCache;
  const total = assets.length;

  // ── Exact duplicates ──────────────────────────────────────────────────────
  // Count how many UNIQUE FILES share an SHA-256 with at least one other file.
  // This guarantees totalExactDuplicates <= totalFiles.
  const hashCounts: Record<string, number> = {};
  assets.forEach(a => {
    const h = normalizeHash(a.sha256);
    hashCounts[h] = (hashCounts[h] || 0) + 1;
  });
  // totalExactDuplicates = files whose hash appears more than once
  let totalExactDuplicates = 0;
  const duplicatedHashes = new Set<string>();
  Object.entries(hashCounts).forEach(([h, c]) => {
    if (c > 1) {
      totalExactDuplicates += c; // count ALL copies, not just the surplus
      duplicatedHashes.add(h);
    }
  });
  // Cap to total files (safety guard)
  totalExactDuplicates = Math.min(totalExactDuplicates, total);

  // ── Near duplicates (pHash) ───────────────────────────────────────────────
  // Count the number of UNIQUE FILES involved in at least one near-duplicate
  // relationship. This is always <= totalFiles.
  const nearDupAssetIndices = new Set<number>();
  const pHashedAssets = assets
    .map((a, idx) => ({ a, idx }))
    .filter(({ a }) => !!a.perceptualHash);

  for (let i = 0; i < pHashedAssets.length; i++) {
    for (let j = i + 1; j < pHashedAssets.length; j++) {
      const dist = computeHammingDistance(
        pHashedAssets[i].a.perceptualHash!,
        pHashedAssets[j].a.perceptualHash!
      );
      if (dist <= 6) {
        nearDupAssetIndices.add(pHashedAssets[i].idx);
        nearDupAssetIndices.add(pHashedAssets[j].idx);
      }
    }
  }
  const totalNearDuplicates = nearDupAssetIndices.size;

  // ── Status-based classification ───────────────────────────────────────────
  const flaggedItems: DatabaseAuditReport['flaggedItems'] = [];
  let totalMalfunction = 0;
  let totalQuarantined = 0;
  let totalClean = 0;
  const highRisk = new Set<string>();

  assets.forEach(a => {
    if (a.status === 'QUARANTINE') {
      totalMalfunction++; totalQuarantined++;
      flaggedItems.push({ assetId: a.assetId, name: a.name, issue: 'Critical Malfunction / Tampered', severity: 'CRITICAL', action: 'QUARANTINE' });
    } else if (a.status === 'REVIEW') {
      totalMalfunction++;
      flaggedItems.push({ assetId: a.assetId, name: a.name, issue: 'Near-Duplicate / Anomaly', severity: 'HIGH', action: 'REVIEW' });
    } else {
      totalClean++;
    }
    if (['C07', 'C05'].includes(a.contributorId)) highRisk.add(a.contributorId);
  });

  // ── Health score ──────────────────────────────────────────────────────────
  // Normalise deductions against total so score is stable across DB sizes.
  const deductions = totalMalfunction * 20 + totalExactDuplicates * 10 + totalNearDuplicates * 12;
  const healthScore = total > 0 ? Math.max(15, Math.round(100 - deductions / Math.max(1, total))) : 100;

  return {
    totalFiles: total,
    totalExactDuplicates,
    totalNearDuplicates,
    totalMalfunctionFiles: totalMalfunction,
    totalVerifiedClean: totalClean,
    totalQuarantined,
    totalHighRiskContributors: highRisk.size,
    overallHealthScore: Math.min(100, healthScore),
    auditedAt: new Date().toISOString(),
    flaggedItems,
  };
}

/** @deprecated kept for backward compat - use initializeDatabase() instead */
export function saveLocalDatabase(_db: CVIADatabaseSchema): void {
  // No-op: data is managed via Supabase now
}

/** @deprecated kept for backward compat */
export function resetDatabaseToBaseline(): CVIADatabaseSchema {
  _assetsCache = [...BASELINE_ASSETS];
  _historyCache = [];
  return getLocalDatabase();
}
