// CVIA — Backend Asset Service
// SIH26228 · Ministry of Defence / DGIS
// Handles persistent database asset registration and user-scoped queries.

import type { StoredDatabaseAsset } from '../services/cviaDatabase';
import { getLocalDatabase, storeAssetInDatabase, auditAllDatabaseAssets } from '../services/cviaDatabase';
import type { FileAnalysisResult } from '../services/fileHasher';

export async function getUserAssets(userId: string): Promise<StoredDatabaseAsset[]> {
  const allAssets = getLocalDatabase().assets;
  // Include assets owned by this user + baseline system assets (C01, DGIS-HQ)
  return allAssets.filter((a: StoredDatabaseAsset) => {
    // If asset has explicit user_id metadata or belongs to user
    const assetOwner = (a.metadata?.userId as string) || (a.contributorId === 'C01' ? '11111111-1111-1111-1111-111111111111' : undefined);
    if (!assetOwner) return true; // Baseline shared assets
    return assetOwner === userId;
  });
}

export async function enrollUserAsset(
  analysis: FileAnalysisResult,
  contributor: { id: string; name: string },
  _userId: string,
  customType?: StoredDatabaseAsset['type']
): Promise<StoredDatabaseAsset> {
  const newAsset = await storeAssetInDatabase(
    analysis,
    contributor,
    customType || 'OTHER',
    'VERIFIED'
  );
  return newAsset;
}

export function runAssetAudit(_userId: string) {
  return auditAllDatabaseAssets();
}
