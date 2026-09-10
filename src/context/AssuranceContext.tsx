// ============================================================
// CVIA — AssuranceContext
// Global state management — offline, with persistent database integration
// ============================================================

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type {
  CVIAState, VerificationRun, AuditEvent, Finding, ProvenanceNode,
  DuplicateGroup, RiskLevel, Decision
} from '../types/cvia';
import { demoVerificationRun, demoAuditTrail } from '../data/demoData';
import type { StoredDatabaseAsset } from '../services/cviaDatabase';
import { initializeDatabase, subscribeToAssetChanges } from '../services/cviaDatabase';

// --- ACTION TYPES ---

type Action =
  | { type: 'SET_VERIFICATION'; payload: VerificationRun }
  | { type: 'UPDATE_VERIFICATION'; payload: Partial<VerificationRun> }
  | { type: 'ADD_AUDIT_EVENT'; payload: AuditEvent }
  | { type: 'CLEAR_VERIFICATION' }
  | { type: 'SET_ENGINE_STATUS'; payload: CVIAState['engineStatus'] }
  | { type: 'ENROLL_STORED_ASSET'; payload: StoredDatabaseAsset };

// --- INITIAL STATE ---

const initialState: CVIAState = {
  activeVerification: demoVerificationRun,
  verificationHistory: [demoVerificationRun],
  auditTrail: demoAuditTrail,
  isEngineAvailable: true,
  engineStatus: 'LOCAL_SIMULATION',
};

// --- REDUCER ---

function reducer(state: CVIAState, action: Action): CVIAState {
  switch (action.type) {
    case 'SET_VERIFICATION':
      return {
        ...state,
        activeVerification: action.payload,
        verificationHistory: [action.payload, ...state.verificationHistory.filter(h => h.verificationId !== action.payload.verificationId).slice(0, 9)],
      };
    case 'UPDATE_VERIFICATION':
      if (!state.activeVerification) return state;
      return {
        ...state,
        activeVerification: { ...state.activeVerification, ...action.payload },
      };
    case 'ADD_AUDIT_EVENT':
      return {
        ...state,
        auditTrail: [...state.auditTrail, action.payload],
        activeVerification: state.activeVerification
          ? {
              ...state.activeVerification,
              auditTrail: [...state.activeVerification.auditTrail, action.payload],
            }
          : null,
      };
    case 'ENROLL_STORED_ASSET': {
      const asset = action.payload;
      const lastAudit = state.auditTrail[state.auditTrail.length - 1];
      const prevHash = lastAudit?.eventHash || 'sha256:0000000000000000000000000000000000000000000000000000000000000000';
      const eventHash = `sha256:${asset.sha256.substring(7, 23)}${asset.assetId.slice(-8)}`;

      const shortId = asset.assetId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).padStart(4, '0');
      const newAudit: AuditEvent = {
        eventId: `AUD-${shortId}`,
        timestamp: asset.storedAt,
        action: asset.type === 'MODEL_WEIGHTS' ? 'MODEL_VERIFIED' : 'DATASET_IMPORTED',
        asset: `${asset.type}: ${asset.name}`,
        assetId: asset.assetId,
        previousHash: prevHash,
        eventHash,
        status: asset.status === 'QUARANTINE' ? 'TAMPERED' : 'OK',
        actor: `${asset.contributorName} (${asset.contributorId})`,
        details: `Enrolled into database registry. SHA-256: ${asset.sha256.substring(0, 18)}... Provenance block: ${asset.provenanceBlock}`,
      };

      const updatedAuditTrail = [...state.auditTrail, newAudit];
      let updatedVerification = state.activeVerification ? { ...state.activeVerification } : null;

      if (updatedVerification) {
        const newFindings: Finding[] = [...updatedVerification.findings];

        // 1. UPDATE DATASET
        if (updatedVerification.dataset && (asset.type === 'DATASET_IMAGE' || asset.type === 'DATASET_MANIFEST')) {
          const isDup = asset.status === 'REVIEW' || asset.status === 'QUARANTINE';
          const newDupGroups: DuplicateGroup[] = [...updatedVerification.dataset.duplicateGroups];

          if (isDup) {
            newDupGroups.push({
              groupId: `DUP-${String(newDupGroups.length + 1).padStart(3, '0')}`,
              hash: asset.sha256,
              samples: [
                {
                  sampleId: `IMG-${shortId}`,
                  filename: asset.name,
                  contributorId: asset.contributorId,
                  label: 'vehicle / target',
                  hash: asset.sha256,
                  isExactDuplicate: true,
                  fileSize: asset.fileSize,
                }
              ],
              contributorIds: [asset.contributorId],
              riskLevel: 'HIGH',
            });

            // Append duplicate finding
            newFindings.unshift({
              findingId: `FND-${shortId}`,
              title: `Duplicate Dataset Image Enrolled: ${asset.name}`,
              affectedAsset: asset.name,
              attackType: 'duplicate_flood',
              reason: `Uploaded image shares identical SHA-256 / perceptual hash with pre-existing records. Risk of duplicate flooding or synthetic inflation.`,
              evidence: [
                {
                  evidenceId: `EV-${shortId}`,
                  type: 'HASH_COLLISION',
                  description: 'Exact SHA-256 hash collision with registered sample',
                  value: asset.sha256,
                  detector: 'Cryptographic Duplicate Detector',
                  confidence: 0.99,
                }
              ],
              detector: 'Duplicate & Perceptual Hash Detector',
              severity: 'HIGH',
              confidence: 0.96,
              recommendedAction: 'REVIEW',
              limitations: 'Exact and perceptual hash inspection',
              timestamp: asset.storedAt,
              category: 'DATA',
            });
          }

          updatedVerification = {
            ...updatedVerification,
            dataset: {
              ...updatedVerification.dataset,
              totalSamples: updatedVerification.dataset.totalSamples + 1,
              validSamples: asset.status === 'VERIFIED' ? updatedVerification.dataset.validSamples + 1 : updatedVerification.dataset.validSamples,
              suspiciousSamples: isDup ? updatedVerification.dataset.suspiciousSamples + 1 : updatedVerification.dataset.suspiciousSamples,
              duplicateGroups: newDupGroups,
            },
          };
        }

        // 2. UPDATE MODEL
        if (asset.type === 'MODEL_WEIGHTS' && updatedVerification.model) {
          const isPassed = asset.status === 'VERIFIED';
          const modelId = asset.name.replace(/\.[^/.]+$/, '').toUpperCase() || 'CVIA-MODEL-003';

          if (!isPassed) {
            newFindings.unshift({
              findingId: `FND-M${shortId}`,
              title: `Model Checkpoint Integrity Failure (${asset.name})`,
              affectedAsset: asset.name,
              attackType: 'model_modification',
              reason: `SHA-256 checksum (${asset.sha256.substring(0, 18)}...) does not match certified baseline registry. Possible weight tampering, backdoor injection, or unauthorized replacement.`,
              evidence: [
                {
                  evidenceId: `EV-M${shortId}`,
                  type: 'HASH_MISMATCH',
                  description: 'SHA-256 mismatch against certified baseline checkpoint',
                  value: asset.sha256,
                  detector: 'Cryptographic Model Integrity Verifier',
                  confidence: 0.99,
                }
              ],
              detector: 'Model Hash Verifier',
              severity: 'CRITICAL',
              confidence: 0.99,
              recommendedAction: 'QUARANTINE',
              limitations: 'Black-box analysis',
              timestamp: asset.storedAt,
              category: 'MODEL',
            });
          }

          updatedVerification = {
            ...updatedVerification,
            model: {
              ...updatedVerification.model,
              modelId,
              name: asset.name,
              hash: asset.sha256,
              hashMatch: isPassed,
              integrityResult: isPassed ? 'PASS' : 'FAIL',
              behaviouralAgreement: isPassed ? 0.96 : 0.38,
              behaviouralTests: updatedVerification.model.behaviouralTests.map((t, idx) => {
                if (idx === 0) return { ...t, passed: isPassed, observedOutput: isPassed ? 'Agreement: 0.96' : 'Agreement: 0.38 (Mismatch)' };
                if (idx === 3) return { ...t, passed: isPassed, observedOutput: isPassed ? 'No anomalous spike detected' : 'Backdoor trigger activation spike detected at layer 7' };
                return t;
              }),
            },
          };
        }

        // 3. UPDATE PROVENANCE NODES
        if (updatedVerification.provenance) {
          const newNode: ProvenanceNode = {
            nodeId: asset.provenanceBlock,
            nodeType: asset.type === 'MODEL_WEIGHTS' ? 'MODEL' : 'DATASET',
            label: asset.name,
            hash: asset.sha256,
            timestamp: asset.storedAt,
            source: `${asset.contributorName} (${asset.contributorId})`,
            status: asset.status === 'VERIFIED' ? 'VERIFIED' : 'TAMPERED',
          };

          const newNodes = [newNode, ...updatedVerification.provenance.nodes];
          const hasTampering = newNodes.some(n => n.status === 'TAMPERED');

          updatedVerification = {
            ...updatedVerification,
            provenance: {
              ...updatedVerification.provenance,
              nodes: newNodes,
              totalRecords: updatedVerification.provenance.totalRecords + 1,
              verifiedRecords: asset.status === 'VERIFIED' ? updatedVerification.provenance.verifiedRecords + 1 : updatedVerification.provenance.verifiedRecords,
              tamperingDetected: hasTampering,
              chainValid: !hasTampering,
            },
          };
        }

        // 4. RECALCULATE OVERALL ASSURANCE SCORE & GOVERNANCE DECISION
        const criticalCount = newFindings.filter(f => f.severity === 'CRITICAL').length;
        const highCount = newFindings.filter(f => f.severity === 'HIGH').length;
        const deductions = (criticalCount * 22) + (highCount * 10);
        const overallScore = Math.max(12, Math.min(100, 100 - deductions));

        const overallRisk: RiskLevel = overallScore >= 80 ? 'LOW' : (overallScore >= 60 ? 'MEDIUM' : (overallScore >= 40 ? 'HIGH' : 'CRITICAL'));
        const decision: Decision = criticalCount > 0 ? 'QUARANTINE' : (overallScore >= 80 ? 'ACCEPT' : 'REVIEW');

        updatedVerification = {
          ...updatedVerification,
          findings: newFindings,
          integrityResult: {
            ...updatedVerification.integrityResult!,
            overallScore,
            overallRisk,
            decision,
            timestamp: asset.storedAt,
          },
          auditTrail: [...updatedVerification.auditTrail, newAudit],
        };
      }

      return {
        ...state,
        auditTrail: updatedAuditTrail,
        activeVerification: updatedVerification,
      };
    }
    case 'CLEAR_VERIFICATION':
      return { ...state, activeVerification: null };
    case 'SET_ENGINE_STATUS':
      return {
        ...state,
        engineStatus: action.payload,
        isEngineAvailable: action.payload !== 'UNAVAILABLE',
      };
    default:
      return state;
  }
}

// --- CONTEXT ---

interface CVIAContextValue {
  state: CVIAState;
  setVerification: (run: VerificationRun) => void;
  updateVerification: (partial: Partial<VerificationRun>) => void;
  addAuditEvent: (event: AuditEvent) => void;
  enrollStoredAsset: (asset: StoredDatabaseAsset) => void;
  clearVerification: () => void;
  loadDemo: () => void;
}

const CVIAContext = createContext<CVIAContextValue | null>(null);

// --- PROVIDER ---

export function AssuranceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Initialize cloud database and subscribe to real-time updates on mount
  useEffect(() => {
    initializeDatabase();
    // Subscribe so this client's cache refreshes when other users enroll assets
    const unsubscribe = subscribeToAssetChanges((_updatedAssets) => {
      // Cache is updated inside subscribeToAssetChanges; no dispatch needed
      // (comparison functions read directly from the module-level cache)
      console.info('[CVIA] Real-time asset update received from another session');
    });
    return unsubscribe;
  }, []);

  const setVerification = useCallback((run: VerificationRun) => {
    dispatch({ type: 'SET_VERIFICATION', payload: run });
  }, []);

  const updateVerification = useCallback((partial: Partial<VerificationRun>) => {
    dispatch({ type: 'UPDATE_VERIFICATION', payload: partial });
  }, []);

  const addAuditEvent = useCallback((event: AuditEvent) => {
    dispatch({ type: 'ADD_AUDIT_EVENT', payload: event });
  }, []);

  const enrollStoredAsset = useCallback((asset: StoredDatabaseAsset) => {
    dispatch({ type: 'ENROLL_STORED_ASSET', payload: asset });
  }, []);

  const clearVerification = useCallback(() => {
    dispatch({ type: 'CLEAR_VERIFICATION' });
  }, []);

  const loadDemo = useCallback(() => {
    dispatch({ type: 'SET_VERIFICATION', payload: demoVerificationRun });
  }, []);

  return (
    <CVIAContext.Provider value={{
      state, setVerification, updateVerification,
      addAuditEvent, enrollStoredAsset, clearVerification, loadDemo,
    }}>
      {children}
    </CVIAContext.Provider>
  );
}

// --- HOOK ---

export function useAssurance(): CVIAContextValue {
  const ctx = useContext(CVIAContext);
  if (!ctx) throw new Error('useAssurance must be used within AssuranceProvider');
  return ctx;
}
