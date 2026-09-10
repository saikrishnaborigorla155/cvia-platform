// ============================================================
// CVIA — Realistic Demo Data
// SIH26228 — Not everything passes. Results are explainable.
// ============================================================

import type {
  DatasetAsset, ModelAsset, InferenceRecord, ProvenanceChainResult,
  DistributionShiftResult, Finding, AuditEvent, VerificationRun,
  Contributor, DuplicateGroup, NearDuplicateCluster,
  ClassDistribution, IntegrityResult, CoverageStatement,
} from '../types/cvia';

// --- CLASS DISTRIBUTIONS ---

const referenceClassDist: ClassDistribution[] = [
  { className: 'car', count: 384, percentage: 32.0, referencePercentage: 32.0, deviation: 0 },
  { className: 'truck', count: 372, percentage: 31.0, referencePercentage: 31.0, deviation: 0 },
  { className: 'person', count: 444, percentage: 37.0, referencePercentage: 37.0, deviation: 0 },
];

// --- CONTRIBUTORS ---

export const demoContributors: Contributor[] = [
  {
    contributorId: 'C01', name: 'Unit Alpha', sampleCount: 250,
    labelDistribution: [
      { className: 'car', count: 80, percentage: 32.0, referencePercentage: 32.0, deviation: 0.0 },
      { className: 'truck', count: 75, percentage: 30.0, referencePercentage: 31.0, deviation: 1.0 },
      { className: 'person', count: 95, percentage: 38.0, referencePercentage: 37.0, deviation: 1.0 },
    ],
    duplicateRate: 0.004, nearDuplicateRate: 0.012, labelAnomalyRate: 0.008,
    oodRate: 0.000, metadataAnomalyRate: 0.004, distributionDeviation: 0.01,
    riskScore: 12, riskLevel: 'LOW', riskFactors: ['Minor metadata irregularity'],
    findingIds: [],
  },
  {
    contributorId: 'C02', name: 'Unit Bravo', sampleCount: 190,
    labelDistribution: [
      { className: 'car', count: 58, percentage: 30.5, referencePercentage: 32.0, deviation: 1.5 },
      { className: 'truck', count: 61, percentage: 32.1, referencePercentage: 31.0, deviation: 1.1 },
      { className: 'person', count: 71, percentage: 37.4, referencePercentage: 37.0, deviation: 0.4 },
    ],
    duplicateRate: 0.000, nearDuplicateRate: 0.021, labelAnomalyRate: 0.016,
    oodRate: 0.005, metadataAnomalyRate: 0.000, distributionDeviation: 0.02,
    riskScore: 18, riskLevel: 'LOW', riskFactors: ['Slight near-duplicate elevation', 'Minor label anomaly rate'],
    findingIds: [],
  },
  {
    contributorId: 'C03', name: 'Unit Charlie', sampleCount: 240,
    labelDistribution: [
      { className: 'car', count: 77, percentage: 32.1, referencePercentage: 32.0, deviation: 0.1 },
      { className: 'truck', count: 74, percentage: 30.8, referencePercentage: 31.0, deviation: 0.2 },
      { className: 'person', count: 89, percentage: 37.1, referencePercentage: 37.0, deviation: 0.1 },
    ],
    duplicateRate: 0.000, nearDuplicateRate: 0.008, labelAnomalyRate: 0.004,
    oodRate: 0.000, metadataAnomalyRate: 0.000, distributionDeviation: 0.00,
    riskScore: 8, riskLevel: 'LOW', riskFactors: [],
    findingIds: [],
  },
  {
    contributorId: 'C04', name: 'Unit Delta', sampleCount: 180,
    labelDistribution: [
      { className: 'car', count: 58, percentage: 32.2, referencePercentage: 32.0, deviation: 0.2 },
      { className: 'truck', count: 56, percentage: 31.1, referencePercentage: 31.0, deviation: 0.1 },
      { className: 'person', count: 66, percentage: 36.7, referencePercentage: 37.0, deviation: 0.3 },
    ],
    duplicateRate: 0.006, nearDuplicateRate: 0.000, labelAnomalyRate: 0.006,
    oodRate: 0.000, metadataAnomalyRate: 0.006, distributionDeviation: 0.01,
    riskScore: 14, riskLevel: 'LOW', riskFactors: ['Isolated duplicate pair'],
    findingIds: ['FND-0001'],
  },
  {
    contributorId: 'C05', name: 'Unit Echo', sampleCount: 95,
    labelDistribution: [
      { className: 'car', count: 30, percentage: 31.6, referencePercentage: 32.0, deviation: 0.4 },
      { className: 'truck', count: 28, percentage: 29.5, referencePercentage: 31.0, deviation: 1.5 },
      { className: 'person', count: 37, percentage: 38.9, referencePercentage: 37.0, deviation: 1.9 },
    ],
    duplicateRate: 0.021, nearDuplicateRate: 0.042, labelAnomalyRate: 0.021,
    oodRate: 0.011, metadataAnomalyRate: 0.000, distributionDeviation: 0.03,
    riskScore: 34, riskLevel: 'MEDIUM',
    riskFactors: ['Elevated duplicate rate', 'Near-duplicate clustering observed', 'OOD sample detected'],
    findingIds: ['FND-0002', 'FND-0003'],
  },
  {
    contributorId: 'C06', name: 'Unit Foxtrot', sampleCount: 145,
    labelDistribution: [
      { className: 'car', count: 44, percentage: 30.3, referencePercentage: 32.0, deviation: 1.7 },
      { className: 'truck', count: 47, percentage: 32.4, referencePercentage: 31.0, deviation: 1.4 },
      { className: 'person', count: 54, percentage: 37.3, referencePercentage: 37.0, deviation: 0.3 },
    ],
    duplicateRate: 0.000, nearDuplicateRate: 0.014, labelAnomalyRate: 0.014,
    oodRate: 0.000, metadataAnomalyRate: 0.007, distributionDeviation: 0.02,
    riskScore: 22, riskLevel: 'LOW',
    riskFactors: ['Minor label anomaly rate', 'Small metadata irregularity'],
    findingIds: [],
  },
  {
    contributorId: 'C07', name: 'Unit Golf', sampleCount: 135,
    labelDistribution: [
      { className: 'car', count: 113, percentage: 83.7, referencePercentage: 32.0, deviation: 51.7 },
      { className: 'truck', count: 3, percentage: 2.2, referencePercentage: 31.0, deviation: 28.8 },
      { className: 'person', count: 19, percentage: 14.1, referencePercentage: 37.0, deviation: 22.9 },
    ],
    duplicateRate: 0.000, nearDuplicateRate: 0.126, labelAnomalyRate: 0.215,
    oodRate: 0.015, metadataAnomalyRate: 0.000, distributionDeviation: 0.51,
    riskScore: 87, riskLevel: 'HIGH',
    riskFactors: [
      'Severe label distribution deviation: car 83.7% vs reference 32%',
      'truck severely under-represented: 2.2% vs reference 31%',
      'Near-duplicate cluster rate 12.6%',
      'Systematic label anomaly pattern detected',
      'Possible label flipping: truck→car systematic swap',
    ],
    findingIds: ['FND-0004', 'FND-0005', 'FND-0006'],
  },
  {
    contributorId: 'C08', name: 'Unit Hotel', sampleCount: 65,
    labelDistribution: [
      { className: 'car', count: 21, percentage: 32.3, referencePercentage: 32.0, deviation: 0.3 },
      { className: 'truck', count: 20, percentage: 30.8, referencePercentage: 31.0, deviation: 0.2 },
      { className: 'person', count: 24, percentage: 36.9, referencePercentage: 37.0, deviation: 0.1 },
    ],
    duplicateRate: 0.000, nearDuplicateRate: 0.000, labelAnomalyRate: 0.015,
    oodRate: 0.000, metadataAnomalyRate: 0.000, distributionDeviation: 0.00,
    riskScore: 10, riskLevel: 'LOW', riskFactors: ['Minor label anomaly rate'],
    findingIds: [],
  },
];

// --- DUPLICATE GROUPS ---

const demoDuplicateGroups: DuplicateGroup[] = [
  {
    groupId: 'DUP-001',
    hash: 'sha256:a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    samples: [
      { sampleId: 'IMG-00341', filename: 'IMG_00341.jpg', contributorId: 'C04', label: 'car',
        hash: 'sha256:a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
        isExactDuplicate: true, duplicateGroupId: 'DUP-001', width: 640, height: 480, fileSize: 87432 },
      { sampleId: 'IMG-00874', filename: 'IMG_00874.jpg', contributorId: 'C04', label: 'car',
        hash: 'sha256:a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
        isExactDuplicate: true, duplicateGroupId: 'DUP-001', width: 640, height: 480, fileSize: 87432 },
    ],
    contributorIds: ['C04'], riskLevel: 'LOW',
  },
];

// --- NEAR-DUPLICATE CLUSTERS ---

const demoNearDuplicateClusters: NearDuplicateCluster[] = [
  {
    clusterId: 'NDC-001', maxSimilarity: 0.97, averageSimilarity: 0.94,
    contributorIds: ['C07', 'C07', 'C07'],
    riskLevel: 'HIGH',
    samples: [
      { sampleId: 'IMG-00482', filename: 'IMG_00482.jpg', contributorId: 'C07', label: 'car',
        hash: 'sha256:b1c2d3e4f5a6b7c8', isNearDuplicate: true, nearDuplicateClusterId: 'NDC-001',
        perceptualHash: 'pHash:f0a1b2c3d4e5f6a7', width: 640, height: 480, fileSize: 91200 },
      { sampleId: 'IMG-00483', filename: 'IMG_00483.jpg', contributorId: 'C07', label: 'car',
        hash: 'sha256:b1c2d3e4f5a6b7c9', isNearDuplicate: true, nearDuplicateClusterId: 'NDC-001',
        perceptualHash: 'pHash:f0a1b2c3d4e5f6a8', width: 640, height: 480, fileSize: 91850 },
      { sampleId: 'IMG-00484', filename: 'IMG_00484.jpg', contributorId: 'C07', label: 'car',
        hash: 'sha256:b1c2d3e4f5a6b7ca', isNearDuplicate: true, nearDuplicateClusterId: 'NDC-001',
        perceptualHash: 'pHash:f0a1b2c3d4e5f6a9', width: 640, height: 480, fileSize: 90100 },
    ],
  },
  {
    clusterId: 'NDC-002', maxSimilarity: 0.93, averageSimilarity: 0.91,
    contributorIds: ['C05', 'C05'],
    riskLevel: 'MEDIUM',
    samples: [
      { sampleId: 'IMG-00712', filename: 'IMG_00712.jpg', contributorId: 'C05', label: 'truck',
        hash: 'sha256:c2d3e4f5a6b7c8d9', isNearDuplicate: true, nearDuplicateClusterId: 'NDC-002',
        perceptualHash: 'pHash:a1b2c3d4e5f6a7b8', width: 720, height: 540, fileSize: 112400 },
      { sampleId: 'IMG-00718', filename: 'IMG_00718.jpg', contributorId: 'C05', label: 'truck',
        hash: 'sha256:c2d3e4f5a6b7c8da', isNearDuplicate: true, nearDuplicateClusterId: 'NDC-002',
        perceptualHash: 'pHash:a1b2c3d4e5f6a7b9', width: 720, height: 540, fileSize: 113200 },
    ],
  },
];

// --- DATASET ASSET ---

export const demoDataset: DatasetAsset = {
  datasetId: 'CVIA-DATASET-001',
  name: 'Multi-Source CV Training Dataset — Batch 24',
  format: 'COCO',
  totalSamples: 1300,
  validSamples: 1200,
  suspiciousSamples: 41,
  hash: 'sha256:7f3a9c2d8e1b4f6a0d3c7e9b2f5a8d1c4e7f0a3b6d9e2c5f8a1b4d7e0c3f6a9b2',
  classes: ['car', 'truck', 'person'],
  classDistribution: referenceClassDist,
  contributors: demoContributors,
  duplicateGroups: demoDuplicateGroups,
  nearDuplicateClusters: demoNearDuplicateClusters,
  labelAnomalies: 29,
  oodSamples: 3,
  samples: [], // Populated lazily in services
  timestamp: '2026-09-09T12:00:00Z',
};

// --- MODEL ASSET ---

export const demoModel: ModelAsset = {
  modelId: 'CVIA-MODEL-003',
  name: 'Vehicle Detection Model v3.2',
  format: 'ONNX',
  hash: 'sha256:9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7',
  referenceHash: 'sha256:9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7',
  architecture: 'YOLOv8-Medium (adapted)',
  parameterCount: 47300000,
  inputShape: '[1, 3, 640, 640]',
  outputShape: '[1, 84, 8400]',
  accessLevel: 'BLACK_BOX',
  integrityResult: 'PASS',
  hashMatch: true,
  behaviouralAgreement: 0.96,
  behaviouralTests: [
    {
      testId: 'BT-001', description: 'Standard vehicle detection battery',
      inputDescription: '20 reference images (car/truck/person)', expectedOutput: 'Agreement ≥ 0.90',
      observedOutput: 'Agreement: 0.96', passed: true, deviation: 0.04,
    },
    {
      testId: 'BT-002', description: 'Confidence distribution check',
      inputDescription: '20 reference images', expectedOutput: 'Mean confidence 0.78–0.90',
      observedOutput: 'Mean confidence: 0.84', passed: true, deviation: 0.02,
    },
    {
      testId: 'BT-003', description: 'Class distribution on test battery',
      inputDescription: '20 reference images', expectedOutput: 'Class dist within 5% of reference',
      observedOutput: 'Within 3%', passed: true, deviation: 0.03,
    },
    {
      testId: 'BT-004', description: 'Prototype trigger screening (PROTOTYPE)',
      inputDescription: 'Trigger-pattern test inputs', expectedOutput: 'No anomalous activation spike',
      observedOutput: 'No anomalous spike detected', passed: true, deviation: 0.01,
      notes: 'PROTOTYPE — Does not constitute definitive proof of absence of backdoor',
    },
  ],
  limitations: [
    'ACCESS LEVEL: BLACK BOX — internal weights not inspectable',
    'Activation analysis unavailable',
    'Parameter-level comparison unavailable',
    'Trigger screening is prototype-level only',
    'Behavioural agreement does not prove absence of backdoor',
  ],
  unavailableMethods: [
    'Activation analysis', 'Parameter-level comparison',
    'Gradient-based trigger search', 'Weight statistics comparison',
  ],
  timestamp: '2026-09-09T12:30:00Z',
};

// --- INFERENCE RECORDS ---

export const demoInferenceRecords: InferenceRecord[] = [
  {
    recordId: 'INF-000180',
    inputHash: 'sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3',
    modelId: 'CVIA-MODEL-003',
    modelHash: 'sha256:9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7',
    preprocessingHash: 'sha256:2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4',
    inferenceConfigHash: 'sha256:3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
    outputHash: 'sha256:4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6',
    timestamp: '2026-09-09T08:00:00Z', sequence: 180, nonce: 'n7f3a9c2d',
    previousRecordHash: 'sha256:0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    currentHash: 'sha256:5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
    verified: true, tamperDetected: false, replayDetected: false,
  },
  {
    recordId: 'INF-000181',
    inputHash: 'sha256:2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4',
    modelId: 'CVIA-MODEL-003',
    modelHash: 'sha256:9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7',
    preprocessingHash: 'sha256:2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4',
    inferenceConfigHash: 'sha256:3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
    outputHash: 'sha256:5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
    timestamp: '2026-09-09T08:01:23Z', sequence: 181, nonce: 'n8g4b0d3e',
    previousRecordHash: 'sha256:5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
    currentHash: 'sha256:6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8',
    verified: true, tamperDetected: false, replayDetected: false,
  },
  {
    recordId: 'INF-000182',
    inputHash: 'sha256:3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
    modelId: 'CVIA-MODEL-003',
    modelHash: 'sha256:9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7',
    preprocessingHash: 'sha256:2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4',
    inferenceConfigHash: 'sha256:3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
    outputHash: 'sha256:MODIFIED_HASH_7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
    timestamp: '2026-09-09T08:02:47Z', sequence: 182, nonce: 'n9h5c1e4f',
    previousRecordHash: 'sha256:6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8',
    currentHash: 'sha256:7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9',
    verified: false, tamperDetected: true, replayDetected: false,
    hashMismatch: true,
    verificationDetails: 'Output hash mismatch — record may have been modified after creation',
  },
  {
    recordId: 'INF-000183',
    inputHash: 'sha256:4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6',
    modelId: 'CVIA-MODEL-003',
    modelHash: 'sha256:9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7',
    preprocessingHash: 'sha256:2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4',
    inferenceConfigHash: 'sha256:3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
    outputHash: 'sha256:8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0',
    timestamp: '2026-09-09T08:04:01Z', sequence: 183, nonce: 'n0i6d2f5a',
    previousRecordHash: 'sha256:TAMPERED_CHAIN_PROPAGATION_FAILURE',
    currentHash: 'sha256:8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0',
    verified: false, tamperDetected: true, replayDetected: false,
    verificationDetails: 'Chain validation failed — previous record hash mismatch (cascade from INF-000182)',
  },
];

// --- PROVENANCE CHAIN ---

export const demoProvenance: ProvenanceChainResult = {
  chainId: 'CHAIN-VER-2026-00124',
  nodes: [
    {
      nodeId: 'PRV-001', nodeType: 'CONTRIBUTOR', label: 'Multi-Source Dataset Collection',
      hash: 'sha256:1111aabbccdd2222eeff3344556677889900aabbccddee',
      timestamp: '2026-08-15T09:00:00Z', source: '8 military units',
      status: 'VERIFIED',
      metadata: { unitCount: 8, totalSamples: 1300 },
    },
    {
      nodeId: 'PRV-002', nodeType: 'DATASET', label: 'CVIA-DATASET-001 (Merged)',
      hash: 'sha256:7f3a9c2d8e1b4f6a0d3c7e9b2f5a8d1c4e7f0a3b6d9e2c5f8a1b4d7e0c3f6a9b2',
      timestamp: '2026-08-20T14:00:00Z', source: 'Dataset Registry',
      status: 'VERIFIED',
      metadata: { format: 'COCO', samples: 1300 },
    },
    {
      nodeId: 'PRV-003', nodeType: 'PREPROCESSING', label: 'Image Preprocessing Pipeline v2.1',
      hash: 'sha256:2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4',
      timestamp: '2026-08-21T08:30:00Z', source: 'Pipeline Registry',
      status: 'VERIFIED',
      metadata: { resize: '640x640', normalize: 'true', augment: 'false' },
    },
    {
      nodeId: 'PRV-004', nodeType: 'TRAINING', label: 'Training Run TR-2026-084',
      hash: 'sha256:3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
      timestamp: '2026-08-25T16:00:00Z', source: 'Training Cluster TC-02',
      status: 'VERIFIED',
      metadata: { epochs: 120, batchSize: 32, optimizer: 'AdamW' },
    },
    {
      nodeId: 'PRV-005', nodeType: 'MODEL', label: 'CVIA-MODEL-003',
      hash: 'sha256:9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7',
      timestamp: '2026-09-01T10:00:00Z', source: 'Model Registry',
      status: 'VERIFIED',
      metadata: { format: 'ONNX', parameters: 47300000 },
    },
    {
      nodeId: 'PRV-006', nodeType: 'INFERENCE', label: 'Inference Session IS-2026-00124',
      hash: 'sha256:4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6',
      timestamp: '2026-09-09T08:00:00Z', source: 'Inference Engine v1.4',
      status: 'VERIFIED',
      metadata: { recordCount: 200, batchSize: 1 },
    },
    {
      nodeId: 'PRV-007', nodeType: 'OUTPUT', label: 'Detection Outputs (200 records)',
      hash: 'sha256:5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
      timestamp: '2026-09-09T09:15:00Z', source: 'Output Registry',
      status: 'VERIFIED',
      metadata: { totalOutputs: 200, format: 'JSON' },
    },
  ],
  records: demoInferenceRecords,
  chainValid: true,
  tamperingDetected: true,
  tamperingAt: ['INF-000182', 'INF-000183'],
  replayDetected: false,
  firstTamperedRecord: 'INF-000182',
  totalRecords: 200,
  verifiedRecords: 198,
  timestamp: '2026-09-09T13:00:00Z',
};

// --- DISTRIBUTION SHIFT ---

export const demoDistributionShift: DistributionShiftResult = {
  shiftId: 'DSR-VER-2026-00124',
  referenceDatasetId: 'CVIA-DATASET-BASELINE',
  observedDatasetId: 'CVIA-DATASET-001',
  metrics: [
    {
      metricName: 'Brightness (Mean)', referenceValue: 127.4, observedValue: 119.8,
      difference: -7.6, normalizedDifference: 0.030, threshold: 0.050, exceededThreshold: false, unit: 'luma',
    },
    {
      metricName: 'Contrast (Std Dev)', referenceValue: 58.2, observedValue: 74.1,
      difference: 15.9, normalizedDifference: 0.062, threshold: 0.060, exceededThreshold: true, unit: 'luma',
    },
    {
      metricName: 'Resolution (Mean Pixels)', referenceValue: 921600, observedValue: 884736,
      difference: -36864, normalizedDifference: 0.040, threshold: 0.100, exceededThreshold: false, unit: 'px',
    },
    {
      metricName: 'Aspect Ratio (Mean)', referenceValue: 1.333, observedValue: 1.328,
      difference: -0.005, normalizedDifference: 0.004, threshold: 0.050, exceededThreshold: false, unit: 'ratio',
    },
    {
      metricName: 'Class Distribution (JS Divergence)', referenceValue: 0.000, observedValue: 0.183,
      difference: 0.183, normalizedDifference: 0.183, threshold: 0.100, exceededThreshold: true, unit: 'JS-div',
    },
    {
      metricName: 'Contributor Distribution (Gini)', referenceValue: 0.12, observedValue: 0.28,
      difference: 0.16, normalizedDifference: 0.16, threshold: 0.15, exceededThreshold: true, unit: 'Gini',
    },
  ],
  jsDivergence: 0.183,
  overallShiftScore: 0.26,
  classification: 'SUSPICIOUS_ANOMALY',
  riskLevel: 'MEDIUM',
  interpretation: 'Statistically significant class distribution shift detected. Contributor C07\'s skewed label distribution is a primary driver. Contrast shift is elevated but may reflect genuine operational variation. Further investigation recommended.',
  timestamp: '2026-09-09T12:45:00Z',
};

// --- FINDINGS ---

export const demoFindings: Finding[] = [
  {
    findingId: 'FND-0001',
    title: 'Exact Duplicate Image Pair',
    affectedAsset: 'CVIA-DATASET-001',
    attackType: 'duplicate_flood',
    reason: 'Two images from Contributor C04 (IMG-00341, IMG-00874) share an identical SHA-256 hash, indicating exact file duplication.',
    evidence: [
      {
        evidenceId: 'EVD-0001-01', type: 'HASH_COLLISION',
        description: 'SHA-256 hash identical for IMG-00341 and IMG-00874',
        value: 'sha256:a3f8b2c1...', detector: 'duplicateDetector', confidence: 1.0, dataPoints: 2,
      },
    ],
    detector: 'duplicateDetector v1.0',
    severity: 'LOW',
    confidence: 1.0,
    recommendedAction: 'REVIEW',
    limitations: 'Exact hash collision identifies duplicate files. It does not determine whether duplication was intentional or accidental.',
    timestamp: '2026-09-09T12:01:00Z',
    category: 'DATA',
  },
  {
    findingId: 'FND-0002',
    title: 'Near-Duplicate Cluster — Contributor C05',
    affectedAsset: 'CVIA-DATASET-001',
    attackType: 'duplicate_flood',
    reason: 'Two images from Contributor C05 (IMG-00712, IMG-00718) show perceptual similarity of 0.93, exceeding the 0.90 threshold.',
    evidence: [
      {
        evidenceId: 'EVD-0002-01', type: 'PERCEPTUAL_HASH',
        description: 'Perceptual hash Hamming distance 3/64 (similarity 0.953)',
        value: 0.953, threshold: 0.90, detector: 'nearDuplicateDetector', confidence: 0.87, dataPoints: 2,
      },
    ],
    detector: 'nearDuplicateDetector v1.0',
    severity: 'MEDIUM',
    confidence: 0.87,
    recommendedAction: 'REVIEW',
    limitations: 'Perceptual hash similarity indicates visual similarity but cannot prove intentional flooding. Near-identical images from the same scene may be legitimate.',
    timestamp: '2026-09-09T12:02:00Z',
    category: 'DATA',
  },
  {
    findingId: 'FND-0003',
    title: 'Out-of-Distribution Sample Detected — C05',
    affectedAsset: 'CVIA-DATASET-001',
    attackType: 'ood_injection',
    reason: 'Sample IMG-00723 from Contributor C05 exhibits statistical properties significantly diverging from the dataset distribution (brightness z-score 3.4).',
    evidence: [
      {
        evidenceId: 'EVD-0003-01', type: 'STATISTICAL_ANOMALY',
        description: 'Brightness z-score 3.4 (threshold: 3.0). Image significantly darker than dataset mean.',
        value: 3.4, threshold: 3.0, detector: 'oodDetector', confidence: 0.72, dataPoints: 1,
      },
    ],
    detector: 'oodDetector v1.0',
    severity: 'MEDIUM',
    confidence: 0.72,
    recommendedAction: 'REVIEW',
    limitations: 'Statistical OOD detection flags distributional outliers. It does not prove malicious injection. The sample may be a legitimate edge case from a different operational environment.',
    timestamp: '2026-09-09T12:03:00Z',
    category: 'DATA',
  },
  {
    findingId: 'FND-0004',
    title: 'Severe Label Distribution Deviation — Contributor C07',
    affectedAsset: 'CVIA-DATASET-001',
    attackType: 'label_flip',
    reason: 'Contributor C07 labels 83.7% of samples as "car" vs 32% in reference. The "truck" class is severely under-represented at 2.2% vs 31% reference. This systematic pattern is inconsistent with random error.',
    evidence: [
      {
        evidenceId: 'EVD-0004-01', type: 'CLASS_DISTRIBUTION_ANOMALY',
        description: 'car: 83.7% (ref: 32.0%), deviation: +51.7 percentage points',
        value: 51.7, threshold: 10.0, detector: 'labelIntegrity', confidence: 0.91, dataPoints: 135,
      },
      {
        evidenceId: 'EVD-0004-02', type: 'CLASS_DISTRIBUTION_ANOMALY',
        description: 'truck: 2.2% (ref: 31.0%), deviation: -28.8 percentage points',
        value: 28.8, threshold: 10.0, detector: 'labelIntegrity', confidence: 0.91, dataPoints: 135,
      },
    ],
    detector: 'labelIntegrity v1.0',
    severity: 'HIGH',
    confidence: 0.91,
    recommendedAction: 'QUARANTINE',
    limitations: 'Automated statistical analysis identifies distributional anomalies. It cannot semantically verify individual label correctness without a reference vision model. The finding indicates a systematic pattern requiring human review.',
    timestamp: '2026-09-09T12:04:00Z',
    category: 'DATA',
  },
  {
    findingId: 'FND-0005',
    title: 'Systematic Label Pattern — Possible truck→car Flip',
    affectedAsset: 'CVIA-DATASET-001',
    attackType: 'label_flip',
    reason: 'The complementary magnitude of car over-representation (+51.7%) and truck under-representation (-28.8%) in C07 data suggests systematic label substitution. If all "truck" samples were relabelled as "car", the resulting distribution would match the observed pattern.',
    evidence: [
      {
        evidenceId: 'EVD-0005-01', type: 'SYSTEMATIC_PATTERN',
        description: 'Complementary deviation: car surplus (+68.8 samples) ≈ truck deficit (-38.9 samples) suggests class-to-class label swap pattern',
        value: 0.84, detector: 'labelIntegrity', confidence: 0.84, dataPoints: 135,
      },
    ],
    detector: 'labelIntegrity v1.0',
    severity: 'HIGH',
    confidence: 0.84,
    recommendedAction: 'QUARANTINE',
    limitations: 'Automated statistical analysis cannot prove deliberate label flipping. It identifies a suspicious systematic pattern. Semantic validation requires human expert review or a reference vision model.',
    timestamp: '2026-09-09T12:05:00Z',
    category: 'DATA',
  },
  {
    findingId: 'FND-0006',
    title: 'Near-Duplicate Cluster Concentration — Contributor C07',
    affectedAsset: 'CVIA-DATASET-001',
    attackType: 'duplicate_flood',
    reason: 'Contributor C07 shows a near-duplicate rate of 12.6% (17 samples in NDC-001 and related clusters). Multiple clusters originate exclusively from C07, suggesting possible data flooding or repeated sampling.',
    evidence: [
      {
        evidenceId: 'EVD-0006-01', type: 'NEAR_DUPLICATE_CONCENTRATION',
        description: '17 samples in near-duplicate clusters, all from Contributor C07. Cluster NDC-001: 3 samples, similarity 0.94–0.97.',
        value: 0.126, threshold: 0.05, detector: 'nearDuplicateDetector', confidence: 0.82, dataPoints: 17,
      },
    ],
    detector: 'nearDuplicateDetector v1.0',
    severity: 'MEDIUM',
    confidence: 0.82,
    recommendedAction: 'REVIEW',
    limitations: 'Near-duplicate detection is based on perceptual hash similarity. Sequential frames from video sources can legitimately produce near-identical images.',
    timestamp: '2026-09-09T12:06:00Z',
    category: 'DATA',
  },
  {
    findingId: 'FND-0007',
    title: 'Inference Record Output Hash Mismatch — INF-000182',
    affectedAsset: 'VER-2026-00124',
    attackType: 'inference_tamper',
    reason: 'The output hash in inference record INF-000182 does not match the expected value derived from the recorded output. The record may have been modified after creation.',
    evidence: [
      {
        evidenceId: 'EVD-0007-01', type: 'HASH_MISMATCH',
        description: 'Recorded output hash: MODIFIED_HASH_7a8b... does not match computed hash of stored output',
        detector: 'inferenceIntegrity', confidence: 1.0, dataPoints: 1,
      },
    ],
    detector: 'inferenceIntegrity v1.0',
    severity: 'HIGH',
    confidence: 1.0,
    recommendedAction: 'QUARANTINE',
    limitations: 'Hash mismatch definitively indicates record modification but cannot determine the content of the modification or whether it was malicious.',
    timestamp: '2026-09-09T12:07:00Z',
    category: 'INFERENCE',
  },
  {
    findingId: 'FND-0008',
    title: 'Class Distribution Shift — JS Divergence Exceeds Threshold',
    affectedAsset: 'CVIA-DATASET-001',
    attackType: 'distribution_shift',
    reason: 'Jensen-Shannon divergence between reference and observed class distributions is 0.183, exceeding the 0.100 threshold. This is primarily driven by Contributor C07\'s skewed label distribution.',
    evidence: [
      {
        evidenceId: 'EVD-0008-01', type: 'DISTRIBUTION_DIVERGENCE',
        description: 'Jensen-Shannon divergence: 0.183 (threshold: 0.100)',
        value: 0.183, threshold: 0.100, detector: 'distributionAnalyzer', confidence: 0.88, dataPoints: 1200,
      },
    ],
    detector: 'distributionAnalyzer v1.0',
    severity: 'MEDIUM',
    confidence: 0.88,
    recommendedAction: 'REVIEW',
    limitations: 'Distribution shift analysis cannot distinguish between legitimate operational variation and adversarial data poisoning without additional contextual evidence.',
    timestamp: '2026-09-09T12:08:00Z',
    category: 'DISTRIBUTION',
  },
];

// --- INTEGRITY RESULT ---

export const demoIntegrityResult: IntegrityResult = {
  overallScore: 74,
  overallRisk: 'MEDIUM',
  categoryScores: [
    {
      category: 'DATA', label: 'Data Integrity', score: 61, riskLevel: 'MEDIUM', available: true,
      deductions: [
        { reason: 'HIGH: Severe label distribution deviation (C07)', points: 20, findingId: 'FND-0004' },
        { reason: 'HIGH: Systematic label swap pattern (C07)', points: 20, findingId: 'FND-0005' },
        { reason: 'MEDIUM: Near-duplicate concentration (C07)', points: 10, findingId: 'FND-0006' },
        { reason: 'MEDIUM: Near-duplicate cluster (C05)', points: 10, findingId: 'FND-0002' },
        { reason: 'MEDIUM: OOD sample detected (C05)', points: 10, findingId: 'FND-0003' },
        { reason: 'LOW: Exact duplicate pair (C04)', points: 5, findingId: 'FND-0001' },
      ],
    },
    {
      category: 'MODEL', label: 'Model Integrity', score: 88, riskLevel: 'LOW', available: true,
      deductions: [
        { reason: 'LIMITED: Black-box access — activation analysis unavailable', points: 12 },
      ],
    },
    {
      category: 'PROVENANCE', label: 'Provenance', score: 100, riskLevel: 'LOW', available: true,
      deductions: [],
    },
    {
      category: 'DISTRIBUTION', label: 'Distribution Shift', score: 74, riskLevel: 'MEDIUM', available: true,
      deductions: [
        { reason: 'MEDIUM: JS divergence 0.183 exceeds threshold', points: 10, findingId: 'FND-0008' },
        { reason: 'MEDIUM: Contributor distribution imbalance (Gini 0.28)', points: 10 },
        { reason: 'MEDIUM: Contrast shift exceeds threshold', points: 6 },
      ],
    },
    {
      category: 'INFERENCE', label: 'Inference Integrity', score: 91, riskLevel: 'LOW', available: true,
      deductions: [
        { reason: 'HIGH: Output hash mismatch on INF-000182', points: 20, findingId: 'FND-0007' },
      ],
    },
  ],
  decision: 'REVIEW',
  decisionReasons: [
    '17 near-duplicate samples concentrated in Contributor C07',
    'Contributor C07 shows HIGH risk — severe label distribution deviation',
    'Possible systematic truck→car label flipping pattern',
    'Inference record INF-000182 output hash mismatch detected',
    'Class distribution JS divergence 0.183 exceeds threshold',
    'Contrast distribution shift elevated above threshold',
  ],
  verifiedItems: [
    'Model hash matches reference (CVIA-MODEL-003)',
    'Provenance chain integrity verified (7 nodes)',
    '198 of 200 inference records verified',
    'No replay attacks detected',
    'Model behavioural agreement 96% (20-test battery)',
  ],
  timestamp: '2026-09-09T13:00:00Z',
};

// --- AUDIT TRAIL ---

export const demoAuditTrail: AuditEvent[] = [
  {
    eventId: 'AUD-001', timestamp: '2026-09-09T12:00:00Z',
    action: 'VERIFICATION_STARTED', asset: 'VER-2026-00124', assetId: 'VER-2026-00124',
    previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
    eventHash: 'sha256:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    status: 'OK', actor: 'SYSTEM',
    details: 'Verification run VER-2026-00124 initiated. Scope: Dataset + Model + Provenance + Distribution + Inference',
  },
  {
    eventId: 'AUD-002', timestamp: '2026-09-09T12:00:05Z',
    action: 'DATASET_IMPORTED', asset: 'CVIA-DATASET-001', assetId: 'CVIA-DATASET-001',
    previousHash: 'sha256:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    eventHash: 'sha256:b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
    status: 'OK', actor: 'SYSTEM',
    details: 'Dataset CVIA-DATASET-001 imported. Format: COCO. Samples: 1300.',
  },
  {
    eventId: 'AUD-003', timestamp: '2026-09-09T12:00:10Z',
    action: 'HASH_CALCULATED', asset: 'CVIA-DATASET-001', assetId: 'CVIA-DATASET-001',
    previousHash: 'sha256:b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
    eventHash: 'sha256:c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    status: 'OK', actor: 'SYSTEM',
    details: 'SHA-256 computed for CVIA-DATASET-001 manifest: 7f3a9c2d...',
  },
  {
    eventId: 'AUD-004', timestamp: '2026-09-09T12:01:00Z',
    action: 'DATASET_ANALYSED', asset: 'CVIA-DATASET-001', assetId: 'CVIA-DATASET-001',
    previousHash: 'sha256:c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    eventHash: 'sha256:d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    status: 'OK', actor: 'SYSTEM',
    details: 'Dataset analysis complete. Duplicates: 2. Near-duplicates: 20. Label anomalies: 29. OOD: 3.',
  },
  {
    eventId: 'AUD-005', timestamp: '2026-09-09T12:05:00Z',
    action: 'CONTRIBUTOR_ANALYSED', asset: 'C07', assetId: 'C07',
    previousHash: 'sha256:d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    eventHash: 'sha256:e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
    status: 'OK', actor: 'SYSTEM',
    details: 'Contributor C07 risk assessed: HIGH (score: 87). Label deviation and near-duplicate concentration identified.',
  },
  {
    eventId: 'AUD-006', timestamp: '2026-09-09T12:07:00Z',
    action: 'FINDING_GENERATED', asset: 'FND-0004', assetId: 'FND-0004',
    previousHash: 'sha256:e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
    eventHash: 'sha256:f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
    status: 'OK', actor: 'SYSTEM',
    details: 'Finding FND-0004 generated: Severe Label Distribution Deviation (C07). Severity: HIGH.',
  },
  {
    eventId: 'AUD-007', timestamp: '2026-09-09T12:30:00Z',
    action: 'MODEL_VERIFIED', asset: 'CVIA-MODEL-003', assetId: 'CVIA-MODEL-003',
    previousHash: 'sha256:f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
    eventHash: 'sha256:a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    status: 'OK', actor: 'SYSTEM',
    details: 'Model CVIA-MODEL-003 hash verified: MATCH. Behavioural agreement: 96%. Access: BLACK_BOX.',
  },
  {
    eventId: 'AUD-008', timestamp: '2026-09-09T12:45:00Z',
    action: 'DISTRIBUTION_ANALYSED', asset: 'CVIA-DATASET-001', assetId: 'CVIA-DATASET-001',
    previousHash: 'sha256:a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    eventHash: 'sha256:b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
    status: 'OK', actor: 'SYSTEM',
    details: 'Distribution analysis complete. JS divergence: 0.183. Classification: SUSPICIOUS_ANOMALY.',
  },
  {
    eventId: 'AUD-009', timestamp: '2026-09-09T13:00:00Z',
    action: 'INFERENCE_VERIFIED', asset: 'VER-2026-00124', assetId: 'VER-2026-00124',
    previousHash: 'sha256:b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
    eventHash: 'sha256:c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0',
    status: 'OK', actor: 'SYSTEM',
    details: 'Inference verification complete. 198/200 records verified. Hash mismatch on INF-000182.',
  },
  {
    eventId: 'AUD-010', timestamp: '2026-09-09T13:05:00Z',
    action: 'DECISION_RECORDED', asset: 'VER-2026-00124', assetId: 'VER-2026-00124',
    previousHash: 'sha256:c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0',
    eventHash: 'sha256:d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1',
    status: 'OK', actor: 'SYSTEM',
    details: 'Assurance decision recorded: REVIEW. Overall score: 74. 8 findings generated.',
  },
];

// --- COVERAGE STATEMENT ---

export const demoCoverage: CoverageStatement = {
  supported: [
    { capability: 'Exact duplicate detection (SHA-256)', status: 'SUPPORTED' },
    { capability: 'Near-duplicate detection (perceptual hash)', status: 'SUPPORTED' },
    { capability: 'Label distribution anomaly analysis', status: 'SUPPORTED' },
    { capability: 'Contributor-level risk scoring', status: 'SUPPORTED' },
    { capability: 'OOD screening (statistical)', status: 'SUPPORTED' },
    { capability: 'Model hash verification (SHA-256)', status: 'SUPPORTED' },
    { capability: 'Behavioural fingerprint comparison', status: 'SUPPORTED' },
    { capability: 'Inference output hash verification', status: 'SUPPORTED' },
    { capability: 'Replay detection (nonce + sequence)', status: 'SUPPORTED' },
    { capability: 'Distribution analysis (brightness, contrast, resolution, class)', status: 'SUPPORTED' },
    { capability: 'Tamper-evident audit chain', status: 'SUPPORTED' },
    { capability: 'Cryptographic provenance chain', status: 'SUPPORTED' },
    { capability: 'Deterministic assurance scoring', status: 'SUPPORTED' },
    { capability: 'JSON assurance report export', status: 'SUPPORTED' },
  ],
  limited: [
    { capability: 'Trigger/backdoor screening (PROTOTYPE — not definitive)', status: 'LIMITED', notes: 'Behavioural anomaly screening only. Does not constitute proof of backdoor presence or absence.' },
    { capability: 'Semantic label validation (statistical only)', status: 'LIMITED', notes: 'Cannot verify individual label semantic correctness without a reference vision model.' },
    { capability: 'White-box model analysis (requires model weights)', status: 'LIMITED', notes: 'Falls back to hash verification and behavioural comparison when weights are inaccessible.' },
    { capability: 'OOD detection (metadata-level)', status: 'LIMITED', notes: 'Full OOD detection requires deep feature extraction; current implementation uses statistical metadata.' },
  ],
  notSupported: [
    { capability: 'Detection of novel/unknown attack classes not in taxonomy', status: 'NOT_SUPPORTED' },
    { capability: 'Proof of malicious intent', status: 'NOT_SUPPORTED' },
    { capability: 'Definitive detection of all possible backdoor patterns', status: 'NOT_SUPPORTED' },
    { capability: 'Semantic image content verification without reference model', status: 'NOT_SUPPORTED' },
    { capability: 'Real-time streaming inference monitoring', status: 'NOT_SUPPORTED' },
  ],
  generatedAt: '2026-09-09T13:05:00Z',
};

// --- COMPLETE VERIFICATION RUN ---

export const demoVerificationRun: VerificationRun = {
  verificationId: 'VER-2026-00124',
  startedAt: '2026-09-09T12:00:00Z',
  completedAt: '2026-09-09T13:05:00Z',
  status: 'complete',
  isSimulation: true,
  simulationLabel: 'DEMO / LOCAL SIMULATION',
  stages: [
    { stageId: 'S01', label: 'Preparing Artifacts', status: 'done', startedAt: '2026-09-09T12:00:00Z', completedAt: '2026-09-09T12:00:03Z' },
    { stageId: 'S02', label: 'Computing Hashes', status: 'done', startedAt: '2026-09-09T12:00:03Z', completedAt: '2026-09-09T12:00:10Z' },
    { stageId: 'S03', label: 'Parsing Dataset', status: 'done', startedAt: '2026-09-09T12:00:10Z', completedAt: '2026-09-09T12:00:25Z' },
    { stageId: 'S04', label: 'Checking Duplicates', status: 'done', startedAt: '2026-09-09T12:00:25Z', completedAt: '2026-09-09T12:01:00Z' },
    { stageId: 'S05', label: 'Checking Labels', status: 'done', startedAt: '2026-09-09T12:01:00Z', completedAt: '2026-09-09T12:05:00Z' },
    { stageId: 'S06', label: 'Analysing Contributors', status: 'done', startedAt: '2026-09-09T12:05:00Z', completedAt: '2026-09-09T12:10:00Z' },
    { stageId: 'S07', label: 'Analysing Distribution', status: 'done', startedAt: '2026-09-09T12:10:00Z', completedAt: '2026-09-09T12:45:00Z' },
    { stageId: 'S08', label: 'Checking Model', status: 'done', startedAt: '2026-09-09T12:30:00Z', completedAt: '2026-09-09T12:40:00Z' },
    { stageId: 'S09', label: 'Checking Provenance', status: 'done', startedAt: '2026-09-09T12:40:00Z', completedAt: '2026-09-09T12:50:00Z' },
    { stageId: 'S10', label: 'Checking Inference', status: 'done', startedAt: '2026-09-09T12:50:00Z', completedAt: '2026-09-09T13:00:00Z' },
    { stageId: 'S11', label: 'Generating Findings', status: 'done', startedAt: '2026-09-09T13:00:00Z', completedAt: '2026-09-09T13:02:00Z' },
    { stageId: 'S12', label: 'Calculating Assurance', status: 'done', startedAt: '2026-09-09T13:02:00Z', completedAt: '2026-09-09T13:04:00Z' },
    { stageId: 'S13', label: 'Creating Audit Record', status: 'done', startedAt: '2026-09-09T13:04:00Z', completedAt: '2026-09-09T13:05:00Z' },
  ],
  dataset: demoDataset,
  model: demoModel,
  provenance: demoProvenance,
  distribution: demoDistributionShift,
  inferenceRecords: demoInferenceRecords,
  findings: demoFindings,
  integrityResult: demoIntegrityResult,
  auditTrail: demoAuditTrail,
  coverage: demoCoverage,
  scope: {
    dataIntegrity: true, modelIntegrity: true,
    provenance: true, distributionShift: true, inferenceIntegrity: true,
  },
};
