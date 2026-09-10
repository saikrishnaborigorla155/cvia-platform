// ============================================================
// CVIA — Core TypeScript Types
// Computer Vision Integrity Assurance Platform
// SIH26228 · Ministry of Defence / DGIS
// ============================================================

// --- ENUMERATIONS ---

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type Decision = 'ACCEPT' | 'REVIEW' | 'QUARANTINE' | 'UNKNOWN';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
export type AccessLevel = 'WHITE_BOX' | 'GREY_BOX' | 'BLACK_BOX';
export type ModelFormat = 'ONNX' | 'PYTORCH' | 'TORCHSCRIPT' | 'TENSORFLOW' | 'UNKNOWN';
export type DatasetFormat = 'COCO' | 'YOLO' | 'IMAGE_FOLDER' | 'ZIP' | 'MANIFEST' | 'UNKNOWN';
export type AttackType =
  | 'label_flip'
  | 'duplicate_flood'
  | 'systematic_mislabel'
  | 'ood_injection'
  | 'trigger_injection'
  | 'model_modification'
  | 'model_substitution'
  | 'inference_tamper'
  | 'replay_attack'
  | 'distribution_shift'
  | 'none';

export type ShiftClassification =
  | 'OPERATIONAL_DRIFT'
  | 'SUSPICIOUS_ANOMALY'
  | 'INSUFFICIENT_EVIDENCE'
  | 'BENIGN';

export type AuditAction =
  | 'DATASET_IMPORTED'
  | 'HASH_CALCULATED'
  | 'DATASET_ANALYSED'
  | 'FINDING_GENERATED'
  | 'MODEL_VERIFIED'
  | 'INFERENCE_VERIFIED'
  | 'DECISION_RECORDED'
  | 'REPORT_EXPORTED'
  | 'VERIFICATION_STARTED'
  | 'AUDIT_CHAIN_VERIFIED'
  | 'CONTRIBUTOR_ANALYSED'
  | 'DISTRIBUTION_ANALYSED';

export type RecommendedAction = 'ACCEPT' | 'REVIEW' | 'QUARANTINE';
export type CoverageStatus = 'SUPPORTED' | 'LIMITED' | 'NOT_SUPPORTED';
export type VerificationStatus =
  | 'idle'
  | 'running'
  | 'complete'
  | 'error';

export type StageStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped';

// --- EVIDENCE ---

export interface Evidence {
  evidenceId: string;
  type: string;
  description: string;
  value?: string | number;
  threshold?: number;
  detector: string;
  dataPoints?: number;
  confidence: number; // 0-1
}

// --- FINDINGS ---

export interface Finding {
  findingId: string;          // e.g. FND-0042
  title: string;
  affectedAsset: string;
  attackType: AttackType;
  reason: string;
  evidence: Evidence[];
  detector: string;
  severity: Severity;
  confidence: number;          // 0-1
  recommendedAction: RecommendedAction;
  limitations: string;
  timestamp: string;           // ISO 8601
  category: 'DATA' | 'MODEL' | 'PROVENANCE' | 'INFERENCE' | 'DISTRIBUTION';
}

// --- DATASET ---

export interface DatasetSample {
  sampleId: string;
  filename: string;
  contributorId: string;
  label: string;
  labelConfidence?: number;
  hash: string;               // SHA-256
  width?: number;
  height?: number;
  fileSize?: number;          // bytes
  brightness?: number;        // 0-255
  contrast?: number;
  isExactDuplicate?: boolean;
  duplicateGroupId?: string;
  isNearDuplicate?: boolean;
  nearDuplicateClusterId?: string;
  perceptualHash?: string;
  isOOD?: boolean;
  isSuspicious?: boolean;
  suspicionReasons?: string[];
  attackType?: AttackType;
  originalLabel?: string;     // for ground-truth scenarios
  isModified?: boolean;
}

export interface DuplicateGroup {
  groupId: string;
  hash: string;
  samples: DatasetSample[];
  contributorIds: string[];
  riskLevel: RiskLevel;
}

export interface NearDuplicateCluster {
  clusterId: string;
  samples: DatasetSample[];
  maxSimilarity: number;       // 0-1
  averageSimilarity: number;   // 0-1
  contributorIds: string[];
  riskLevel: RiskLevel;
}

export interface ClassDistribution {
  className: string;
  count: number;
  percentage: number;
  referencePercentage?: number;
  deviation?: number;
}

export interface Contributor {
  contributorId: string;
  name?: string;
  sampleCount: number;
  labelDistribution: ClassDistribution[];
  duplicateRate: number;       // 0-1
  nearDuplicateRate: number;   // 0-1
  labelAnomalyRate: number;    // 0-1
  oodRate: number;             // 0-1
  metadataAnomalyRate: number; // 0-1
  distributionDeviation: number; // 0-1
  riskScore: number;           // 0-100
  riskLevel: RiskLevel;
  riskFactors: string[];
  findingIds: string[];
}

export interface DatasetAsset {
  datasetId: string;
  name: string;
  format: DatasetFormat;
  totalSamples: number;
  validSamples: number;
  suspiciousSamples: number;
  hash: string;                // SHA-256 of manifest
  classes: string[];
  classDistribution: ClassDistribution[];
  contributors: Contributor[];
  duplicateGroups: DuplicateGroup[];
  nearDuplicateClusters: NearDuplicateCluster[];
  labelAnomalies: number;
  oodSamples: number;
  samples: DatasetSample[];
  timestamp: string;
}

// --- MODEL ---

export interface ModelBehaviouralTest {
  testId: string;
  description: string;
  inputDescription: string;
  expectedOutput: string;
  observedOutput: string;
  passed: boolean;
  deviation: number;          // 0-1
  notes?: string;
}

export interface ModelAsset {
  modelId: string;
  name: string;
  format: ModelFormat;
  hash: string;               // SHA-256
  referenceHash?: string;
  architecture?: string;
  parameterCount?: number;
  inputShape?: string;
  outputShape?: string;
  accessLevel: AccessLevel;
  integrityResult: 'PASS' | 'FAIL' | 'UNKNOWN';
  hashMatch: boolean;
  behaviouralAgreement?: number; // 0-1
  behaviouralTests: ModelBehaviouralTest[];
  parameterStats?: {
    mean: number;
    std: number;
    min: number;
    max: number;
    l2Norm: number;
  };
  limitations: string[];
  unavailableMethods: string[];
  timestamp: string;
}

// --- INFERENCE / PROVENANCE ---

export interface InferenceRecord {
  recordId: string;           // e.g. INF-000182
  inputHash: string;
  modelId: string;
  modelHash: string;
  preprocessingHash: string;
  inferenceConfigHash: string;
  outputHash: string;
  timestamp: string;
  sequence: number;
  nonce: string;
  previousRecordHash: string;
  currentHash: string;        // SHA-256 of all fields
  output?: Record<string, unknown>;

  // Verification results
  verified?: boolean;
  tamperDetected?: boolean;
  replayDetected?: boolean;
  sequenceViolation?: boolean;
  modelSubstitution?: boolean;
  hashMismatch?: boolean;
  verificationDetails?: string;
}

export interface ProvenanceNode {
  nodeId: string;
  nodeType: 'CONTRIBUTOR' | 'DATASET' | 'PREPROCESSING' | 'TRAINING' | 'MODEL' | 'INFERENCE' | 'OUTPUT';
  label: string;
  hash: string;
  timestamp: string;
  source: string;
  status: 'VERIFIED' | 'UNVERIFIED' | 'TAMPERED' | 'UNKNOWN';
  metadata?: Record<string, string | number | boolean>;
}

export interface ProvenanceChainResult {
  chainId: string;
  nodes: ProvenanceNode[];
  records: InferenceRecord[];
  chainValid: boolean;
  tamperingDetected: boolean;
  tamperingAt?: string[];
  replayDetected: boolean;
  firstTamperedRecord?: string;
  totalRecords: number;
  verifiedRecords: number;
  timestamp: string;
}

// --- DISTRIBUTION SHIFT ---

export interface DistributionMetric {
  metricName: string;
  referenceValue: number;
  observedValue: number;
  difference: number;
  normalizedDifference: number; // 0-1
  threshold: number;
  exceededThreshold: boolean;
  unit?: string;
}

export interface DistributionShiftResult {
  shiftId: string;
  referenceDatasetId: string;
  observedDatasetId: string;
  metrics: DistributionMetric[];
  jsDivergence: number;       // Jensen-Shannon, 0-1
  overallShiftScore: number;  // 0-1
  classification: ShiftClassification;
  riskLevel: RiskLevel;
  interpretation: string;
  timestamp: string;
}

// --- INTEGRITY SCORES ---

export interface CategoryScore {
  category: 'DATA' | 'MODEL' | 'PROVENANCE' | 'DISTRIBUTION' | 'INFERENCE';
  label: string;
  score: number;              // 0-100
  riskLevel: RiskLevel;
  deductions: Array<{ reason: string; points: number; findingId?: string }>;
  available: boolean;
}

export interface IntegrityResult {
  overallScore: number;       // 0-100
  overallRisk: RiskLevel;
  categoryScores: CategoryScore[];
  decision: Decision;
  decisionReasons: string[];
  verifiedItems: string[];
  timestamp: string;
}

// --- AUDIT TRAIL ---

export interface AuditEvent {
  eventId: string;
  timestamp: string;
  action: AuditAction;
  asset: string;
  assetId: string;
  previousHash: string;
  eventHash: string;          // SHA-256 of event content + previousHash
  status: 'OK' | 'TAMPERED' | 'UNVERIFIED';
  actor: string;
  details?: string;
}

// --- COVERAGE ---

export interface CoverageItem {
  capability: string;
  status: CoverageStatus;
  notes?: string;
}

export interface CoverageStatement {
  supported: CoverageItem[];
  limited: CoverageItem[];
  notSupported: CoverageItem[];
  generatedAt: string;
}

// --- VERIFICATION RUN ---

export interface VerificationStage {
  stageId: string;
  label: string;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface VerificationRun {
  verificationId: string;     // e.g. VER-2026-00124
  startedAt: string;
  completedAt?: string;
  status: VerificationStatus;
  stages: VerificationStage[];

  dataset?: DatasetAsset;
  model?: ModelAsset;
  provenance?: ProvenanceChainResult;
  distribution?: DistributionShiftResult;
  inferenceRecords?: InferenceRecord[];

  findings: Finding[];
  integrityResult?: IntegrityResult;
  auditTrail: AuditEvent[];
  coverage: CoverageStatement;

  scope: {
    dataIntegrity: boolean;
    modelIntegrity: boolean;
    provenance: boolean;
    distributionShift: boolean;
    inferenceIntegrity: boolean;
  };

  // Simulation flag — NEVER hide
  isSimulation: boolean;
  simulationLabel?: string;
}

// --- ASSURANCE REPORT ---

export interface AssuranceReport {
  reportId: string;
  verificationId: string;
  generatedAt: string;
  dataset?: DatasetAsset;
  model?: ModelAsset;
  inference?: {
    totalRecords: number;
    verifiedRecords: number;
    tamperingDetected: boolean;
  };
  integrityScores: IntegrityResult;
  findings: Finding[];
  provenance?: ProvenanceChainResult;
  distributionShift?: DistributionShiftResult;
  auditTrail: AuditEvent[];
  decision: Decision;
  limitations: string[];
  coverage: CoverageStatement;
}

// --- TEST SCENARIOS ---

export interface TestScenario {
  scenarioId: string;
  name: string;
  attackType: AttackType;
  description: string;
  expectedDetection: 'DETECTED' | 'PARTIALLY_DETECTED' | 'NOT_DETECTED' | 'NOT_SUPPORTED';
  dataPath: string;
}

// --- CONTEXT STATE ---

export interface CVIAState {
  activeVerification: VerificationRun | null;
  verificationHistory: VerificationRun[];
  auditTrail: AuditEvent[];
  isEngineAvailable: boolean;
  engineStatus: 'LOCAL_SIMULATION' | 'PYTHON_BACKEND' | 'UNAVAILABLE';
}
