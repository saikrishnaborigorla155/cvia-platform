// CVIA — Server Types
// SIH26228 · Ministry of Defence / DGIS

export interface ServerUser {
  id: string;
  email: string;
  fullName: string;
  organization: string;
  role: 'COMMANDER' | 'OPERATOR' | 'ANALYST';
  unitCode: string;
  createdAt: string;
}

export interface UserSession {
  user: ServerUser;
  token: string;
  expiresAt: number;
}

export interface StoredVerification {
  id: string;
  verificationId: string;
  userId: string;
  datasetId: string;
  modelId: string;
  status: 'VERIFIED' | 'REVIEW' | 'QUARANTINE';
  integrityHealth: number;
  totalFiles: number;
  exactDuplicates: number;
  nearDuplicates: number;
  malfunctionData: number;
  verifiedCleanFiles: number;
  highRiskContributors: number;
  riskScore: number;
  decision: 'ACCEPT' | 'CONDITIONAL_PASS' | 'REJECT';
  stagesData: Array<{ stageId: string; label: string; status: string }>;
  findingsData: Array<Record<string, unknown>>;
  flaggedItems: Array<{
    assetId: string;
    name: string;
    issue: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    action: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
