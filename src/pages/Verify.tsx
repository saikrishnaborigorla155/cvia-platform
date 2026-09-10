// CVIA — Verify Page (File Manager, Baseline Comparison & Database Storage)
// SIH26228 · Ministry of Defence / DGIS

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload, ShieldCheck, Database, Cpu,
  CheckCircle2, Circle, Loader, AlertTriangle, ArrowRight,
  FileText, Image as ImageIcon, Save, RefreshCw, Layers, HardDrive,
  Download, Trash2, Check, XCircle, Search, AlertOctagon,
  ChevronUp, ChevronDown, X, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAssurance } from '../context/AssuranceContext';
import { demoVerificationRun } from '../data/demoData';
import {
  Button, Card, CardHeader, CardBody, DemoBanner,
  SectionHeader, Badge, RiskBadge, MetricCard, HashDisplay
} from '../components/ui/index';
import type { StageStatus, VerificationStage, VerificationRun } from '../types/cvia';
import type { StoredVerification } from '../server/types';
import type { FileAnalysisResult } from '../services/fileHasher';
import {
  analyzeInputFile, formatFileSize
} from '../services/fileHasher';
import type {
  ComparisonResult, StoredDatabaseAsset, CVIADatabaseSchema, DatabaseAuditReport
} from '../services/cviaDatabase';
import {
  compareFileAgainstDatabase, storeAssetInDatabase,
  getLocalDatabase, resetDatabaseToBaseline, auditAllDatabaseAssets,
  recordIngestedFile, onDatabaseReady, subscribeToAssetChanges
} from '../services/cviaDatabase';
import { useAuth } from '../context/AuthContext';
import { fetchLatestVerificationApi, createVerificationRunApi } from '../lib/api/verificationApi';
import { enrollAssetApi } from '../lib/api/assetsApi';

const STAGES: VerificationStage[] = [
  { stageId: 'S01', label: 'Preparing Artifacts & File Hashes', status: 'pending' },
  { stageId: 'S02', label: 'Computing Cryptographic SHA-256', status: 'pending' },
  { stageId: 'S03', label: 'Parsing Dataset & Image Manifests', status: 'pending' },
  { stageId: 'S04', label: 'Checking Duplicates & Perceptual Hashes', status: 'pending' },
  { stageId: 'S05', label: 'Checking Labels & Contributor Distribution', status: 'pending' },
  { stageId: 'S06', label: 'Analysing Contributor Risk Indices', status: 'pending' },
  { stageId: 'S07', label: 'Comparing against Baseline Database Registry', status: 'pending' },
  { stageId: 'S08', label: 'Model Weight Integrity & Fingerprinting', status: 'pending' },
  { stageId: 'S09', label: 'Cryptographic Provenance Chain Verification', status: 'pending' },
  { stageId: 'S10', label: 'Inference Nonce & Replay Detection', status: 'pending' },
  { stageId: 'S11', label: 'Generating Explainable Security Findings', status: 'pending' },
  { stageId: 'S12', label: 'Computing Overall Assurance & Coverage', status: 'pending' },
  { stageId: 'S13', label: 'Recording Immutable Cryptographic Audit Block', status: 'pending' },
];

function StageIcon({ status }: { status: StageStatus }) {
  if (status === 'done') return <CheckCircle2 size={16} style={{ color: 'var(--color-pass-icon)' }} />;
  if (status === 'running') return <Loader size={16} style={{ color: 'var(--color-brand-primary)', animation: 'spin 0.7s linear infinite' }} />;
  if (status === 'error') return <AlertTriangle size={16} style={{ color: 'var(--color-critical-icon)' }} />;
  return <Circle size={16} style={{ color: 'var(--color-border-strong)' }} />;
}

interface AnalyzedItem {
  fileMeta: FileAnalysisResult;
  comparison: ComparisonResult;
  storedAsset?: StoredDatabaseAsset;
  isSavedToDb: boolean;
}

type ViewCategory = 'EXACT_DUPLICATES' | 'NEAR_DUPLICATES' | 'MALFUNCTION' | 'CLEAN' | 'CONTRIBUTORS' | 'SINGLE_FILE';

export function Verify() {
  const { setVerification, enrollStoredAsset } = useAssurance();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload_compare' | 'pipeline' | 'database'>('upload_compare');
  const [analyzedFiles, setAnalyzedFiles] = useState<AnalyzedItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dbState, setDbState] = useState<CVIADatabaseSchema>(getLocalDatabase());
  const [dragActive, setDragActive] = useState(false);

  // Dedicated Database Audit Report State
  const [auditReport, setAuditReport] = useState<DatabaseAuditReport | null>(null);
  const [isAuditingDb, setIsAuditingDb] = useState(false);
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showFlaggedDetails, setShowFlaggedDetails] = useState(true);

  // Deep View-Level Inspection Modal State
  const [selectedViewCategory, setSelectedViewCategory] = useState<ViewCategory | null>(null);
  const [selectedFileForInspect, setSelectedFileForInspect] = useState<StoredDatabaseAsset | AnalyzedItem | null>(null);

  // Pipeline execution state
  const hasDataset = true;
  const hasModel = true;
  const hasInference = true;
  const [scope, setScope] = useState({
    dataIntegrity: true, modelIntegrity: true,
    provenance: true, distributionShift: true, inferenceIntegrity: true,
  });
  const [stages, setStages] = useState<VerificationStage[]>(STAGES);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);

  // Contributor selection for saving
  const [selectedContributor, setSelectedContributor] = useState({ id: 'C01', name: 'Unit Alpha' });

  const refreshDb = () => {
    setDbState(getLocalDatabase());
  };

  const syncToContext = useCallback((v: StoredVerification) => {
    const mappedRun: VerificationRun = {
      ...demoVerificationRun,
      verificationId: v.verificationId,
      startedAt: v.createdAt,
      completedAt: v.updatedAt,
      status: v.status as any,
      integrityResult: {
        ...demoVerificationRun.integrityResult!,
        overallScore: v.integrityHealth,
        overallRisk: v.integrityHealth >= 80 ? 'LOW' : (v.integrityHealth >= 60 ? 'MEDIUM' : 'CRITICAL'),
        decision: v.decision as any,
        timestamp: v.updatedAt,
      },
      dataset: demoVerificationRun.dataset ? {
        ...demoVerificationRun.dataset,
        totalSamples: v.totalFiles,
        validSamples: v.verifiedCleanFiles,
        suspiciousSamples: v.exactDuplicates + v.nearDuplicates + v.malfunctionData,
      } : undefined,
      findings: v.findingsData && v.findingsData.length > 0 ? (v.findingsData as any) : demoVerificationRun.findings,
    };
    setVerification(mappedRun);
  }, [setVerification]);

  // Fetch persistent stored verification for the authenticated operator
  const loadStoredVerification = useCallback(async () => {
    setIsLoadingLatest(true);
    setApiError(null);
    try {
      const latest = await fetchLatestVerificationApi();
      if (latest) {
        setAuditReport({
          totalFiles: latest.totalFiles,
          totalExactDuplicates: latest.exactDuplicates,
          totalNearDuplicates: latest.nearDuplicates,
          totalMalfunctionFiles: latest.malfunctionData,
          totalVerifiedClean: latest.verifiedCleanFiles,
          totalQuarantined: latest.malfunctionData,
          totalHighRiskContributors: latest.highRiskContributors,
          overallHealthScore: latest.integrityHealth,
          auditedAt: latest.updatedAt,
          flaggedItems: latest.flaggedItems,
        });
        syncToContext(latest);
      } else {
        // Operator has no prior verifications: calculate clean initial state
        const initialReport = auditAllDatabaseAssets();
        setAuditReport(initialReport);
      }
    } catch (err: any) {
      console.error('[CVIA Frontend] Error loading stored verification:', err);
      setApiError(err?.message || 'Unable to retrieve verification records');
    } finally {
      setIsLoadingLatest(false);
    }
  }, [syncToContext]);

  useEffect(() => {
    loadStoredVerification();
  }, [user, loadStoredVerification]);

  // Sync dbState with Supabase: refresh once init finishes AND on real-time updates
  useEffect(() => {
    const unsubReady = onDatabaseReady(refreshDb);
    const unsubLive = subscribeToAssetChanges(() => refreshDb());
    return () => {
      unsubReady();
      unsubLive();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run audit and create persistent verification on backend
  const handleAuditDatabase = async () => {
    setIsAuditingDb(true);
    setApiError(null);
    try {
      const newVer = await createVerificationRunApi();
      if (newVer) {
        setAuditReport({
          totalFiles: newVer.totalFiles,
          totalExactDuplicates: newVer.exactDuplicates,
          totalNearDuplicates: newVer.nearDuplicates,
          totalMalfunctionFiles: newVer.malfunctionData,
          totalVerifiedClean: newVer.verifiedCleanFiles,
          totalQuarantined: newVer.malfunctionData,
          totalHighRiskContributors: newVer.highRiskContributors,
          overallHealthScore: newVer.integrityHealth,
          auditedAt: newVer.updatedAt,
          flaggedItems: newVer.flaggedItems,
        });
        syncToContext(newVer);
        refreshDb();
      }
    } catch (err: any) {
      console.error('[CVIA Frontend] Audit execution error:', err);
      setApiError(err?.message || 'Verification audit could not be completed');
    } finally {
      setIsAuditingDb(false);
    }
  };

  // Handle actual file manager input with batch-level duplicate awareness
  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsAnalyzing(true);
    const incomingAnalyses: FileAnalysisResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const analysis = await analyzeInputFile(file);
        incomingAnalyses.push(analysis);
      } catch (err) {
        console.error('Failed to analyze file:', file.name, err);
      }
    }

    // Combine newly incoming files with existing analyzed files
    const allMetas = [...incomingAnalyses, ...analyzedFiles.map(it => it.fileMeta)];

    // Re-evaluate comparisons across the complete batch collection + history
    const updatedAnalyzedFiles: AnalyzedItem[] = allMetas.map((meta, index) => {
      const otherMetas = allMetas.filter((_, idx) => idx !== index);
      const comparison = compareFileAgainstDatabase(meta, undefined, otherMetas);
      const existing = analyzedFiles.find(a => a.fileMeta.sha256 === meta.sha256 && a.fileMeta.fileName === meta.fileName);
      return {
        fileMeta: meta,
        comparison,
        storedAsset: existing?.storedAsset,
        isSavedToDb: existing?.isSavedToDb || false,
      };
    });

    // Record incoming files into workspace ingest history
    incomingAnalyses.forEach(analysis => {
      recordIngestedFile(analysis);
    });

    setAnalyzedFiles(updatedAnalyzedFiles);
    setIsAnalyzing(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Quick Attack / Sample Generator for Demonstrations
  const loadQuickScenario = async (scenarioType: 'CLEAN_RECON' | 'ALTERED_MODEL' | 'DUPLICATE_SAMPLE' | 'MANIFEST_JSON') => {
    setIsAnalyzing(true);
    let sampleBlob: Blob;
    let fileName: string;

    if (scenarioType === 'CLEAN_RECON') {
      fileName = 'recon_drone_alpha_092.png';
      sampleBlob = new Blob(['MOCK_RAW_PIXELS_CAR_DETECTION_PASS_092'], { type: 'image/png' });
    } else if (scenarioType === 'ALTERED_MODEL') {
      fileName = 'yolov8_vehicle_v3.onnx';
      sampleBlob = new Blob(['TAMPERED_MODEL_WEIGHTS_ADVERSARIAL_BACKDOOR_INJECTION_CORRUPTED_LAYER_7'], { type: 'application/octet-stream' });
    } else if (scenarioType === 'DUPLICATE_SAMPLE') {
      fileName = 'IMG_00482_cluster_ref.jpg';
      sampleBlob = new Blob(['IDENTICAL_BYTES_IMG_00482_NEAR_DUPLICATE_CLUSTER'], { type: 'image/jpeg' });
    } else {
      fileName = 'cvia_batch_manifest_2026.json';
      sampleBlob = new Blob([JSON.stringify({ datasetId: 'CVIA-DATASET-001', batch: 24, samples: 1300, author: 'DGIS-HQ' }, null, 2)], { type: 'application/json' });
    }

    const file = new File([sampleBlob], fileName, { type: sampleBlob.type, lastModified: Date.now() });
    await processFiles([file]);
  };

  // Save an analyzed item into the persistent database
  const handleSaveToDatabase = async (index: number) => {
    const item = analyzedFiles[index];
    if (!item || item.isSavedToDb) return;

    const storedStatus = item.comparison.riskLevel === 'CRITICAL' ? 'QUARANTINE' : (item.comparison.riskLevel === 'HIGH' ? 'REVIEW' : 'VERIFIED');
    const stored = await storeAssetInDatabase(item.fileMeta, selectedContributor, undefined, storedStatus);

    try {
      await enrollAssetApi(item.fileMeta, selectedContributor);
    } catch (e) {
      console.warn('[CVIA Frontend] Backend enroll asset sync:', e);
    }

    // Enroll into global AssuranceContext and audit log
    enrollStoredAsset(stored);

    // Update item status in local UI state
    setAnalyzedFiles(prev => prev.map((it, idx) => idx === index ? { ...it, storedAsset: stored, isSavedToDb: true } : it));
    refreshDb();
  };

  const handleSaveAllToDatabase = async () => {
    for (let idx = 0; idx < analyzedFiles.length; idx++) {
      await handleSaveToDatabase(idx);
    }
  };

  const handleResetDb = () => {
    if (confirm('Reset database to baseline records? All newly saved files will be cleared.')) {
      resetDatabaseToBaseline();
      refreshDb();
      setAuditReport(null);
    }
  };

  const exportDatabaseJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dbState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cvia_database_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const updateStage = (idx: number, status: StageStatus) => {
    setStages(prev => prev.map((s, i) => i === idx ? { ...s, status } : s));
  };

  const runVerification = useCallback(async () => {
    setRunning(true);
    setComplete(false);
    setStages(STAGES.map(s => ({ ...s, status: 'pending' })));

    for (let i = 0; i < STAGES.length; i++) {
      updateStage(i, 'running');
      await new Promise(r => setTimeout(r, 280 + Math.random() * 220));
      updateStage(i, 'done');
    }

    try {
      const newVer = await createVerificationRunApi();
      if (newVer) {
        syncToContext(newVer);
        setAuditReport({
          totalFiles: newVer.totalFiles,
          totalExactDuplicates: newVer.exactDuplicates,
          totalNearDuplicates: newVer.nearDuplicates,
          totalMalfunctionFiles: newVer.malfunctionData,
          totalVerifiedClean: newVer.verifiedCleanFiles,
          totalQuarantined: newVer.malfunctionData,
          totalHighRiskContributors: newVer.highRiskContributors,
          overallHealthScore: newVer.integrityHealth,
          auditedAt: newVer.updatedAt,
          flaggedItems: newVer.flaggedItems,
        });
      } else {
        setVerification(demoVerificationRun);
      }
    } catch (err) {
      console.warn('[CVIA Frontend] Verification run API error, using baseline fallback:', err);
      setVerification(demoVerificationRun);
    }

    setRunning(false);
    setComplete(true);
  }, [setVerification, syncToContext]);

  // Simulated visual canvas for duplicate/near-duplicate image rendering
  const renderSimulatedImage = (title: string, tag: string, color: string, customImgUrl?: string) => (
    <div style={{
      width: '100%', height: 180, borderRadius: 6, background: '#090d16',
      border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 10
    }}>
      {customImgUrl ? (
        <img
          src={customImgUrl}
          alt={title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#020617' }}
        />
      ) : (
        /* Wireframe fallback */
        <div style={{
          position: 'absolute', top: '25%', left: '20%', width: '60%', height: '50%',
          border: `2px dashed ${color}`, borderRadius: 4, background: 'rgba(255,255,255,0.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: color, fontFamily: 'var(--font-mono)' }}>
            [TARGET: MIL-VEHICLE 98.4%]
          </span>
          <span style={{ fontSize: 9, color: '#64748b' }}>BBox: x=140, y=96, w=320, h=180</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: 4, color: '#e2e8f0' }}>
          CAM_RECON_FEED
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, background: color, color: '#fff', padding: '2px 6px', borderRadius: 4 }}>
          {tag}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2, background: 'rgba(0,0,0,0.65)', padding: '4px 8px', borderRadius: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0' }}>{title}</span>
        <span style={{ fontSize: 9, color: '#94a3b8' }}>RGB · Analyzed</span>
      </div>
    </div>
  );

  return (
    <div className="section-grid">
      <DemoBanner />

      <SectionHeader
        title="Verification & File Manager"
        description="Load files from your file manager, perform real-time cryptographic comparison against baseline registry, and store verified assets in database."
        badge={
          <div style={{ display: 'flex', gap: 6 }}>
            <Badge variant="pass">Air-Gapped Local Storage</Badge>
            <Badge variant="neutral">{dbState.assets.length} DB Assets</Badge>
          </div>
        }
      />

      {/* ERROR FALLBACK BANNER */}
      {apiError && (
        <Card style={{ border: '1px solid var(--color-critical-border)', background: 'rgba(239, 68, 68, 0.08)', marginBottom: 16 }}>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={20} style={{ color: 'var(--color-critical)' }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-critical)', fontSize: 14 }}>
                    Verification could not be completed
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {apiError}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="secondary" size="sm" onClick={() => loadStoredVerification()}>
                  Retry Verification
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* TELEMETRY LOADING STATE */}
      {isLoadingLatest && !auditReport && (
        <div style={{
          padding: '16px 20px',
          borderRadius: 8,
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16
        }}>
          <Loader size={18} style={{ color: 'var(--color-brand-primary)', animation: 'spin 0.7s linear infinite' }} />
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Retrieving persistent verification records from secure database for {user?.unitCode || user?.organization || 'Operator'}…
          </span>
        </div>
      )}

      {/* DEDICATED VERIFICATION & AUDIT BUTTON STATION */}
      <Card style={{ border: '1px solid var(--color-brand-primary)', background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.05) 0%, rgba(15, 23, 42, 0.4) 100%)' }}>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 6,
                background: 'var(--color-brand-primary)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}>
                <Search size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)' }}>
                  Database Integrity & Stored Files Verification Hub
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Audits all stored database records for duplicates, malfunctions, altered hashes & contributor risks without affecting data structure.
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={isAuditingDb ? <Loader size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <ShieldCheck size={16} />}
              onClick={handleAuditDatabase}
              loading={isAuditingDb}
            >
              {isAuditingDb ? 'Auditing Database Files…' : 'VERIFY & AUDIT ALL DATABASE FILES'}
            </Button>
          </div>
        </CardHeader>

        {/* OVERALL AUDIT REPORT INFORMATION */}
        {auditReport && (
          <CardBody style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Database Integrity Intelligence Summary
                </span>
                <Badge variant={auditReport.overallHealthScore >= 80 ? 'pass' : (auditReport.overallHealthScore >= 60 ? 'review' : 'critical')}>
                  {auditReport.overallHealthScore}% Integrity Health
                </Badge>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--color-brand-primary)', fontWeight: 600 }}>
                  💡 Click any card below to view & inspect images/files
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Audited: {new Date(auditReport.auditedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Overall Interactive Metrics Grid */}
            <div className="metric-grid" style={{ marginBottom: 16 }}>
              <div className="interactive-metric-card" onClick={() => setSelectedViewCategory('CLEAN')}>
                <MetricCard
                  label="Total Files Evaluated"
                  value={auditReport.totalFiles}
                  sub="Click to view all registry files"
                  icon={<HardDrive size={15} />}
                />
              </div>

              <div className="interactive-metric-card" onClick={() => setSelectedViewCategory('EXACT_DUPLICATES')}>
                <MetricCard
                  label="Exact Duplicates"
                  value={auditReport.totalExactDuplicates}
                  sub={auditReport.totalExactDuplicates > 0 ? "Click to view duplicate images 🔍" : "No collisions"}
                  variant={auditReport.totalExactDuplicates > 0 ? 'review' : 'pass'}
                  icon={<RefreshCw size={15} />}
                />
              </div>

              <div className="interactive-metric-card" onClick={() => setSelectedViewCategory('NEAR_DUPLICATES')}>
                <MetricCard
                  label="Near-Duplicate Clusters"
                  value={auditReport.totalNearDuplicates}
                  sub={auditReport.totalNearDuplicates > 0 ? "Click to view visual clusters 🔍" : "0 clusters"}
                  variant={auditReport.totalNearDuplicates > 0 ? 'high' : 'pass'}
                  icon={<ImageIcon size={15} />}
                />
              </div>

              <div className="interactive-metric-card" onClick={() => setSelectedViewCategory('MALFUNCTION')}>
                <MetricCard
                  label="Total Malfunction Data"
                  value={auditReport.totalMalfunctionFiles}
                  sub={auditReport.totalMalfunctionFiles > 0 ? "Click to inspect tampered data ⚠️" : "0 tampered"}
                  variant={auditReport.totalMalfunctionFiles > 0 ? 'critical' : 'pass'}
                  icon={<AlertOctagon size={15} />}
                />
              </div>

              <div className="interactive-metric-card" onClick={() => setSelectedViewCategory('CLEAN')}>
                <MetricCard
                  label="Verified Clean Files"
                  value={auditReport.totalVerifiedClean}
                  sub="Click to view verified seals"
                  variant="pass"
                  icon={<CheckCircle2 size={15} />}
                />
              </div>

              <div className="interactive-metric-card" onClick={() => setSelectedViewCategory('CONTRIBUTORS')}>
                <MetricCard
                  label="High-Risk Contributors"
                  value={auditReport.totalHighRiskContributors}
                  sub="Click to view unit risks"
                  variant={auditReport.totalHighRiskContributors > 0 ? 'review' : 'pass'}
                  icon={<AlertTriangle size={15} />}
                />
              </div>
            </div>

            {/* Flagged Items Accordion / Details */}
            {auditReport.flaggedItems.length > 0 && (
              <div style={{
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
                padding: 12,
              }}>
                <div
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer', userSelect: 'none'
                  }}
                  onClick={() => setShowFlaggedDetails(!showFlaggedDetails)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    <AlertTriangle size={15} style={{ color: 'var(--color-review-icon)' }} />
                    Flagged Anomalies & Malfunction Breakdown ({auditReport.flaggedItems.length} Issues)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {showFlaggedDetails ? 'Hide details' : 'Show details'}
                    {showFlaggedDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {showFlaggedDetails && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {auditReport.flaggedItems.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 14px', borderRadius: 4,
                          background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)',
                          fontSize: 12, flexWrap: 'wrap', gap: 8
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-brand-primary)' }}>{item.assetId}</span>
                          <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.name}</span>
                          <span style={{ color: 'var(--color-text-secondary)' }}>— {item.issue}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Badge variant={item.severity === 'CRITICAL' ? 'critical' : 'review'}>
                            {item.severity}
                          </Badge>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: item.action === 'QUARANTINE' ? 'var(--color-critical-text)' : 'var(--color-review-text)'
                          }}>
                            [{item.action}]
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<ExternalLink size={12} />}
                            onClick={() => {
                              const found = dbState.assets.find(a => a.assetId === item.assetId);
                              if (found) {
                                setSelectedFileForInspect(found);
                                setSelectedViewCategory('SINGLE_FILE');
                              } else if (item.issue.includes('Near-Duplicate')) {
                                setSelectedViewCategory('NEAR_DUPLICATES');
                              } else {
                                setSelectedViewCategory('MALFUNCTION');
                              }
                            }}
                          >
                            Inspect View 🔍
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardBody>
        )}
      </Card>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button
          className={`tab-item ${activeTab === 'upload_compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload_compare')}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Upload size={14} /> 1. Input Files & Live Comparison {analyzedFiles.length > 0 && `(${analyzedFiles.length})`}
        </button>
        <button
          className={`tab-item ${activeTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Layers size={14} /> 2. 13-Stage Assurance Pipeline
        </button>
        <button
          className={`tab-item ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => { setActiveTab('database'); refreshDb(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <HardDrive size={14} /> 3. Persistent Database Registry ({dbState.assets.length})
        </button>
      </div>

      {/* TAB 1: INPUT FILES & LIVE COMPARISON */}
      {activeTab === 'upload_compare' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* File Upload Zone */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HardDrive size={16} /> File Manager Access & Dropzone
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Contributor Signature:</span>
                  <select
                    value={selectedContributor.id}
                    onChange={(e) => {
                      const id = e.target.value;
                      const names: Record<string, string> = {
                        C01: 'Unit Alpha', C02: 'Unit Bravo', C03: 'Unit Charlie',
                        C04: 'Unit Delta', C07: 'Unit Golf', DGIS: 'DGIS Registry'
                      };
                      setSelectedContributor({ id, name: names[id] || 'Operator' });
                    }}
                    style={{
                      background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)',
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    <option value="C01">C01 — Unit Alpha (Low Risk)</option>
                    <option value="C04">C04 — Unit Delta (Low Risk)</option>
                    <option value="C07">C07 — Unit Golf (High Risk)</option>
                    <option value="DGIS">DGIS-HQ — Central Registry</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />

              {/* Drag and Drop Zone */}
              <div
                className={`upload-zone ${dragActive ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                style={{
                  border: dragActive ? '2px dashed var(--color-brand-primary)' : '2px dashed var(--color-border-strong)',
                  background: dragActive ? 'rgba(59, 130, 246, 0.08)' : 'var(--color-bg-secondary)',
                  padding: '36px 20px',
                  borderRadius: 8,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'var(--color-brand-primary)' }}>
                  <Upload size={36} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>
                  Click to Browse Files from File Manager or Drag & Drop Here
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', maxWidth: 540, margin: '0 auto' }}>
                  Supports <strong>Dataset Images</strong> (.png, .jpg, .webp), <strong>Model Weights</strong> (.onnx, .pt, .bin, .safetensors),
                  and <strong>Manifests / Logs</strong> (.json, .csv). Files are hashed locally via Web Crypto API.
                </div>
                <div style={{ marginTop: 16 }}>
                  <Button variant="primary" size="md" icon={<Upload size={14} />}>
                    Open File Explorer
                  </Button>
                </div>
              </div>

              {/* Quick Sample File Generators */}
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⚡ Or Test with Realistic Defense Attack / Baseline Samples:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadQuickScenario('CLEAN_RECON')}
                    icon={<ImageIcon size={14} />}
                    disabled={isAnalyzing}
                  >
                    Clean Recon Image (New Asset)
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadQuickScenario('ALTERED_MODEL')}
                    icon={<AlertTriangle size={14} style={{ color: 'var(--color-critical-icon)' }} />}
                    disabled={isAnalyzing}
                  >
                    Tampered YOLO Model (Adversarial Weights Mismatch)
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadQuickScenario('DUPLICATE_SAMPLE')}
                    icon={<RefreshCw size={14} style={{ color: 'var(--color-review-icon)' }} />}
                    disabled={isAnalyzing}
                  >
                    Cluster Duplicate Image (Visual pHash Match)
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadQuickScenario('MANIFEST_JSON')}
                    icon={<FileText size={14} />}
                    disabled={isAnalyzing}
                  >
                    Baseline Batch Manifest (SHA-256 Match)
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Analysis & Comparison Results */}
          {isAnalyzing && (
            <Card>
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
                  <Loader size={20} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--color-brand-primary)' }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    Computing cryptographic SHA-256 and perceptual difference hashes...
                  </span>
                </div>
              </CardBody>
            </Card>
          )}

          {analyzedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={16} /> Verification & Baseline Comparison Results ({analyzedFiles.length})
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Save size={14} />}
                      onClick={handleSaveAllToDatabase}
                    >
                      Save All to Database
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Trash2 size={14} />}
                      onClick={() => setAnalyzedFiles([])}
                    >
                      Clear List
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody style={{ padding: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {analyzedFiles.map((item, idx) => {
                    const { fileMeta, comparison, isSavedToDb, storedAsset } = item;
                    const isCrit = comparison.riskLevel === 'CRITICAL';
                    const isHigh = comparison.riskLevel === 'HIGH';
                    const isMatch = comparison.status === 'VERIFIED_BASELINE_MATCH';

                    return (
                      <div
                        key={`${fileMeta.fileName}-${idx}`}
                        style={{
                          padding: '16px 20px',
                          borderBottom: idx < analyzedFiles.length - 1 ? '1px solid var(--color-border)' : 'none',
                          background: isCrit ? 'rgba(239, 68, 68, 0.04)' : (isHigh ? 'rgba(245, 158, 11, 0.04)' : (isMatch ? 'rgba(16, 185, 129, 0.03)' : 'transparent')),
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                          {/* File preview icon */}
                          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 }}>
                            {fileMeta.previewUrl ? (
                              <img
                                src={fileMeta.previewUrl}
                                alt="Preview"
                                style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--color-border)' }}
                              />
                            ) : (
                              <div style={{
                                width: 48, height: 48, borderRadius: 4, background: 'var(--color-bg-secondary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', flexShrink: 0
                              }}>
                                {fileMeta.fileName.endsWith('.onnx') || fileMeta.fileName.endsWith('.pt') ? (
                                  <Cpu size={22} style={{ color: 'var(--color-brand-primary)' }} />
                                ) : fileMeta.fileName.endsWith('.json') || fileMeta.fileName.endsWith('.csv') ? (
                                  <FileText size={22} style={{ color: 'var(--color-text-secondary)' }} />
                                ) : (
                                  <Database size={22} style={{ color: 'var(--color-text-secondary)' }} />
                                )}
                              </div>
                            )}

                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>
                                  {fileMeta.fileName}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                  ({formatFileSize(fileMeta.fileSize)})
                                </span>
                                <RiskBadge risk={comparison.riskLevel} />
                                {isSavedToDb && (
                                  <Badge variant="pass" dot>Stored: {storedAsset?.assetId}</Badge>
                                )}
                              </div>

                              {/* Hashes */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, marginBottom: 8 }}>
                                <div>
                                  <span style={{ color: 'var(--color-text-muted)', marginRight: 6 }}>Computed SHA-256:</span>
                                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                                    {fileMeta.sha256Short}
                                  </span>
                                </div>
                                {fileMeta.imageMeta?.perceptualHash && (
                                  <div>
                                    <span style={{ color: 'var(--color-text-muted)', marginRight: 6 }}>Perceptual pHash:</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                                      {fileMeta.imageMeta.perceptualHash}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Comparison result box */}
                              <div style={{
                                padding: '10px 14px',
                                borderRadius: 6,
                                background: isCrit ? 'var(--color-critical-bg)' : (isHigh ? 'var(--color-review-bg)' : (isMatch ? 'var(--color-pass-bg)' : 'var(--color-bg-secondary)')),
                                border: `1px solid ${isCrit ? 'var(--color-critical-border)' : (isHigh ? 'var(--color-review-border)' : (isMatch ? 'var(--color-pass-border)' : 'var(--color-border)'))}`,
                                marginTop: 6,
                              }}>
                                <div style={{
                                  fontWeight: 600, fontSize: 13,
                                  color: isCrit ? 'var(--color-critical-text)' : (isHigh ? 'var(--color-review-text)' : (isMatch ? 'var(--color-pass-text)' : 'var(--color-text-primary)')),
                                  marginBottom: 3,
                                  display: 'flex', alignItems: 'center', gap: 6
                                }}>
                                  {isCrit ? <XCircle size={15} /> : (isMatch ? <Check size={15} /> : <AlertTriangle size={15} />)}
                                  {comparison.findingTitle}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                                  {comparison.findingDetails}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                            {isSavedToDb ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-pass-text)', fontSize: 12, fontWeight: 600 }}>
                                <CheckCircle2 size={16} /> Saved in Database
                              </div>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                icon={<Save size={14} />}
                                onClick={() => handleSaveToDatabase(idx)}
                              >
                                Save to Database
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<ExternalLink size={12} />}
                              onClick={() => {
                                setSelectedFileForInspect(item);
                                setSelectedViewCategory('SINGLE_FILE');
                              }}
                            >
                              Inspect View 🔍
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: 13-STAGE ASSURANCE PIPELINE */}
      {activeTab === 'pipeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Scope + Run side by side */}
          <div className="grid-2">
            {/* Scope */}
            <Card>
              <CardHeader>
                <div className="card-title">Assurance Verification Scope</div>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { key: 'dataIntegrity', label: 'Dataset Integrity', desc: 'Duplicates, label flips, contributor risk, OOD' },
                    { key: 'modelIntegrity', label: 'Model Integrity', desc: 'SHA-256 baseline comparison, behavioural fingerprint' },
                    { key: 'provenance', label: 'Cryptographic Provenance', desc: 'Immutable SHA-256 hash chain verification' },
                    { key: 'distributionShift', label: 'Distribution Shift', desc: 'Statistical Jensen-Shannon divergence check' },
                    { key: 'inferenceIntegrity', label: 'Inference Integrity', desc: 'Tamper, replay, model substitution detection' },
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', gap: 12, cursor: 'pointer', alignItems: 'flex-start' }}>
                      <input
                        type="checkbox"
                        checked={scope[item.key as keyof typeof scope]}
                        onChange={e => setScope(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        style={{ marginTop: 3, accentColor: 'var(--color-brand-primary)' }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Run panel */}
            <Card>
              <CardHeader>
                <div className="card-title">Run Automated Pipeline</div>
              </CardHeader>
              <CardBody>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                    Enrolled Baseline Artifacts
                  </div>
                  {[
                    { label: 'Dataset', loaded: hasDataset, id: 'CVIA-DATASET-001 (1,300 samples)' },
                    { label: 'Model Checkpoint', loaded: hasModel, id: 'CVIA-MODEL-003 (ONNX 47.3M params)' },
                    { label: 'Inference Records', loaded: hasInference, id: 'VER-2026-00124 (200 records)' },
                  ].map(a => (
                    <div key={a.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{a.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-pass-text)', fontFamily: 'var(--font-mono)' }}>{a.id}</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  style={{ width: '100%', marginBottom: 12 }}
                  onClick={runVerification}
                  loading={running}
                  icon={<ShieldCheck size={16} />}
                  disabled={running}
                >
                  {running ? 'Executing 13 Verification Stages…' : 'EXECUTE FULL PIPELINE'}
                </Button>

                {complete && (
                  <Button
                    variant="secondary"
                    size="md"
                    style={{ width: '100%' }}
                    onClick={() => navigate('/console')}
                    iconRight={<ArrowRight size={14} />}
                  >
                    View Console Results & Radar
                  </Button>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Progress stages */}
          {(running || complete) && (
            <Card>
              <CardHeader>
                <div className="card-title">13-Stage Assurance Pipeline Progress</div>
                {complete && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-pass-text)' }}>Complete (All Stages Verified)</span>
                )}
              </CardHeader>
              <CardBody>
                <div className="verification-stages">
                  {stages.map(stage => (
                    <div key={stage.stageId} className={`verification-stage ${stage.status}`}>
                      <div className="verification-stage-icon">
                        <StageIcon status={stage.status} />
                      </div>
                      <span className="verification-stage-label">{stage.label}</span>
                      {stage.status === 'running' && (
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-brand-primary)', fontWeight: 600 }}>
                          Analyzing…
                        </span>
                      )}
                      {stage.status === 'done' && (
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-pass-text)', fontWeight: 600 }}>Done</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: LOCAL DATABASE REGISTRY */}
      {activeTab === 'database' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HardDrive size={16} /> Persistent Local Database Registry ({dbState.assets.length} Assets)
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Download size={14} />}
                    onClick={exportDatabaseJson}
                  >
                    Export Database JSON
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RefreshCw size={14} />}
                    onClick={handleResetDb}
                  >
                    Reset to Baseline
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Asset ID</th>
                      <th>File Name</th>
                      <th>Type</th>
                      <th>Contributor</th>
                      <th>SHA-256 Fingerprint</th>
                      <th>Size</th>
                      <th>Provenance Block</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbState.assets.map((asset) => (
                      <tr key={asset.assetId}>
                        <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{asset.assetId}</td>
                        <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{asset.name}</td>
                        <td>
                          <Badge variant="neutral">{asset.type}</Badge>
                        </td>
                        <td style={{ fontSize: 12 }}>{asset.contributorName} ({asset.contributorId})</td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                            {asset.sha256.substring(0, 16)}...
                          </span>
                        </td>
                        <td style={{ fontSize: 12 }}>{formatFileSize(asset.fileSize)}</td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-brand-primary)' }}>
                            {asset.provenanceBlock}
                          </span>
                        </td>
                        <td>
                          <Badge variant={asset.status === 'VERIFIED' ? 'pass' : (asset.status === 'QUARANTINE' ? 'critical' : 'review')}>
                            {asset.status}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<ExternalLink size={12} />}
                            onClick={() => {
                              setSelectedFileForInspect(asset);
                              setSelectedViewCategory('SINGLE_FILE');
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* DEEP VIEW-LEVEL INSPECTION MODAL (FOR DUPLICATES, MALFUNCTION, ETC.) */}
      {/* ============================================================ */}
      {selectedViewCategory && (
        <div className="modal-backdrop" onClick={() => setSelectedViewCategory(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: selectedViewCategory === 'MALFUNCTION' ? 'var(--color-critical-bg)' : 'var(--color-brand-subtle)',
                  color: selectedViewCategory === 'MALFUNCTION' ? 'var(--color-critical-text)' : 'var(--color-brand-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {selectedViewCategory === 'EXACT_DUPLICATES' && <RefreshCw size={16} />}
                  {selectedViewCategory === 'NEAR_DUPLICATES' && <ImageIcon size={16} />}
                  {selectedViewCategory === 'MALFUNCTION' && <AlertOctagon size={16} />}
                  {selectedViewCategory === 'CLEAN' && <CheckCircle2 size={16} />}
                  {selectedViewCategory === 'CONTRIBUTORS' && <ShieldCheck size={16} />}
                  {selectedViewCategory === 'SINGLE_FILE' && <FileText size={16} />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>
                    {selectedViewCategory === 'EXACT_DUPLICATES' && 'Exact Duplicate Images & Hash Collision Inspector'}
                    {selectedViewCategory === 'NEAR_DUPLICATES' && 'Near-Duplicate Image Clusters (Perceptual pHash Analysis)'}
                    {selectedViewCategory === 'MALFUNCTION' && 'Malfunction & Tampered Data Security Deep-Dive'}
                    {selectedViewCategory === 'CLEAN' && 'Verified Clean Asset Registry & Cryptographic Proofs'}
                    {selectedViewCategory === 'CONTRIBUTORS' && 'Contributor Risk Distribution & Integrity Ratings'}
                    {selectedViewCategory === 'SINGLE_FILE' && 'Deep Cryptographic File & Metadata Inspector'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Visual inspection & forensic breakdown of database-stored artifacts
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedViewCategory(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* 1. EXACT DUPLICATES VIEW */}
              {selectedViewCategory === 'EXACT_DUPLICATES' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 6,
                    background: 'var(--color-review-bg)', border: '1px solid var(--color-review-border)',
                    fontSize: 13, color: 'var(--color-review-text)'
                  }}>
                    <strong>Exact Duplicate Collision Detected:</strong> The following images share an identical bit-for-bit SHA-256 hash. One is the original sample and the other is an identical duplicate copy.
                  </div>

                  {/* If user uploaded actual duplicate files, render them */}
                  {analyzedFiles.filter(a => a.comparison.findingTitle.includes('Duplicate') || a.comparison.status === 'NEAR_DUPLICATE').length >= 2 ? (
                    <div className="grid-2">
                      {analyzedFiles.filter(a => a.comparison.findingTitle.includes('Duplicate') || a.comparison.status === 'NEAR_DUPLICATE').slice(0, 2).map((item, idx) => (
                        <Card key={idx} style={{ border: idx === 1 ? '1px solid var(--color-review-border)' : '1px solid var(--color-border)' }}>
                          <CardHeader>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600, fontSize: 13 }}>
                                {idx === 0 ? 'Uploaded Instance A (First Input)' : 'Uploaded Instance B (Duplicate Match)'}
                              </span>
                              <Badge variant={idx === 1 ? 'review' : 'pass'}>
                                {idx === 1 ? '100% COLLISION' : 'INPUT_ORIGINAL'}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardBody>
                            {renderSimulatedImage(item.fileMeta.fileName, idx === 1 ? 'DUPLICATE' : 'ORIGINAL', idx === 1 ? '#f59e0b' : '#22c55e', item.fileMeta.previewUrl)}
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                              <div><span style={{ color: 'var(--color-text-muted)' }}>File Name:</span> <strong>{item.fileMeta.fileName}</strong></div>
                              <div><span style={{ color: 'var(--color-text-muted)' }}>Size:</span> {formatFileSize(item.fileMeta.fileSize)}</div>
                              <div><span style={{ color: 'var(--color-text-muted)' }}>SHA-256:</span> <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{item.fileMeta.sha256Short}</span></div>
                              {item.fileMeta.imageMeta?.perceptualHash && (
                                <div><span style={{ color: 'var(--color-text-muted)' }}>Perceptual pHash:</span> <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{item.fileMeta.imageMeta.perceptualHash}</span></div>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    /* Default baseline duplicate pair */
                    <div className="grid-2">
                      <Card style={{ border: '1px solid var(--color-border)' }}>
                        <CardHeader>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>Sample A (Original Baseline)</span>
                            <Badge variant="pass">ASSET-REF-001</Badge>
                          </div>
                        </CardHeader>
                        <CardBody>
                          {renderSimulatedImage('IMG_00341_baseline.jpg', 'BASE_SAMPLE', '#22c55e')}
                          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                            <div><span style={{ color: 'var(--color-text-muted)' }}>File Name:</span> <strong>IMG_00341_baseline.jpg</strong></div>
                            <div><span style={{ color: 'var(--color-text-muted)' }}>Size:</span> 87.4 KB · 640x480</div>
                            <div><span style={{ color: 'var(--color-text-muted)' }}>Contributor:</span> Unit Delta (C04)</div>
                            <div><span style={{ color: 'var(--color-text-muted)' }}>SHA-256:</span> <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>sha256:a3f8b2c1d4e5f6...</span></div>
                          </div>
                        </CardBody>
                      </Card>

                      <Card style={{ border: '1px solid var(--color-review-border)', background: 'var(--color-review-bg)' }}>
                        <CardHeader>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-review-text)' }}>Sample B (Duplicate Copy)</span>
                            <Badge variant="review">DUPLICATE MATCH</Badge>
                          </div>
                        </CardHeader>
                        <CardBody>
                          {renderSimulatedImage('IMG_00874_duplicate.jpg', '100% COLLISION', '#f59e0b')}
                          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                            <div><span style={{ color: 'var(--color-text-muted)' }}>File Name:</span> <strong>IMG_00874_duplicate.jpg</strong></div>
                            <div><span style={{ color: 'var(--color-text-muted)' }}>Size:</span> 87.4 KB · 640x480</div>
                            <div><span style={{ color: 'var(--color-text-muted)' }}>Contributor:</span> Unit Delta (C04)</div>
                            <div><span style={{ color: 'var(--color-text-muted)' }}>SHA-256:</span> <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>sha256:a3f8b2c1d4e5f6...</span></div>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {/* 2. NEAR DUPLICATES VIEW */}
              {selectedViewCategory === 'NEAR_DUPLICATES' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 6,
                    background: 'var(--color-review-bg)', border: '1px solid var(--color-review-border)',
                    fontSize: 13, color: 'var(--color-review-text)'
                  }}>
                    <strong>Perceptual Cluster NDC-001:</strong> Images exhibit a <strong>$\ge 92\%$ visual perceptual similarity</strong> (Hamming distance $\le 4$). Indicates near-duplicate flooding or slight synthetic recompression.
                  </div>

                  <div className="grid-3">
                    <Card>
                      <CardHeader>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>Sample 1 (Anchor)</span>
                      </CardHeader>
                      <CardBody>
                        {renderSimulatedImage('IMG_00482_cluster_ref.jpg', 'ANCHOR', '#3b82f6')}
                        <div style={{ marginTop: 10, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div><strong>IMG_00482_cluster_ref.jpg</strong></div>
                          <div>Contributor: Unit Golf (C07)</div>
                          <div>pHash: <span style={{ fontFamily: 'var(--font-mono)' }}>f0a1b2c3d4e5f6a7</span></div>
                        </div>
                      </CardBody>
                    </Card>

                    <Card style={{ border: '1px solid var(--color-review-border)' }}>
                      <CardHeader>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-review-text)' }}>Sample 2 (94% Match)</span>
                      </CardHeader>
                      <CardBody>
                        {renderSimulatedImage('IMG_00483_cluster.jpg', '94% SIMILAR', '#f59e0b')}
                        <div style={{ marginTop: 10, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div><strong>IMG_00483_cluster.jpg</strong></div>
                          <div>Contributor: Unit Golf (C07)</div>
                          <div>pHash: <span style={{ fontFamily: 'var(--font-mono)' }}>f0a1b2c3d4e5f6a8</span></div>
                        </div>
                      </CardBody>
                    </Card>

                    <Card style={{ border: '1px solid var(--color-review-border)' }}>
                      <CardHeader>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-review-text)' }}>Sample 3 (92% Match)</span>
                      </CardHeader>
                      <CardBody>
                        {renderSimulatedImage('IMG_00484_cluster.jpg', '92% SIMILAR', '#f59e0b')}
                        <div style={{ marginTop: 10, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div><strong>IMG_00484_cluster.jpg</strong></div>
                          <div>Contributor: Unit Golf (C07)</div>
                          <div>pHash: <span style={{ fontFamily: 'var(--font-mono)' }}>f0a1b2c3d4e5f6a9</span></div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </div>
              )}

              {/* 3. MALFUNCTION / TAMPERED DATA VIEW */}
              {selectedViewCategory === 'MALFUNCTION' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    padding: '12px 16px', borderRadius: 6,
                    background: 'var(--color-critical-bg)', border: '1px solid var(--color-critical-border)',
                    fontSize: 13, color: 'var(--color-critical-text)'
                  }}>
                    <strong>Critical Malfunction & Security Integrity Failure:</strong>
                    <div>Cryptographic mismatch detected. An asset claimed a registered baseline identity but contained corrupted/adversarially altered weights.</div>
                  </div>

                  <Card style={{ border: '1px solid var(--color-critical-border)' }}>
                    <CardHeader>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>Tampered Model Checkpoint Inspection: yolov8_vehicle_v3.onnx</span>
                        <Badge variant="critical">QUARANTINE ENFORCED</Badge>
                      </div>
                    </CardHeader>
                    <CardBody>
                      <div className="grid-2" style={{ marginBottom: 14 }}>
                        <div style={{ padding: 12, borderRadius: 6, background: 'var(--color-pass-bg)', border: '1px solid var(--color-pass-border)' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-pass-text)', marginBottom: 4 }}>
                            AUTHENTIC BASELINE REGISTRY HASH
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, wordBreak: 'break-all', color: 'var(--color-text-primary)' }}>
                            sha256:9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                            Status: Verified Authentic YOLOv8-Medium (Central DGIS Registry)
                          </div>
                        </div>

                        <div style={{ padding: 12, borderRadius: 6, background: 'var(--color-critical-bg)', border: '1px solid var(--color-critical-border)' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-critical-text)', marginBottom: 4 }}>
                            OBSERVED UPLOADED MALFUNCTION HASH
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, wordBreak: 'break-all', color: 'var(--color-critical-text)', fontWeight: 600 }}>
                            sha256:56b823e1f0a99c82d41e7f3b6a0c5d2e8f1a4b7c9e0d3f6a2b5c8e1d4f7a0b3c
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-critical-text)', marginTop: 6 }}>
                            Mismatch detected: Corrupted Layer 7 Weights / Trojan Trigger Injected
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        <strong>Forensic Finding Details:</strong> Byte-level analysis indicates that internal convolutional weights in block <code>model.22.cv3.0</code> differ from the certified defense weights. Running inference with this checkpoint may cause misclassification of military vehicles under specific triggers.
                      </div>
                    </CardBody>
                  </Card>
                </div>
              )}

              {/* 4. CLEAN ASSETS VIEW */}
              {selectedViewCategory === 'CLEAN' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 6,
                    background: 'var(--color-pass-bg)', border: '1px solid var(--color-pass-border)',
                    fontSize: 13, color: 'var(--color-pass-text)'
                  }}>
                    <strong>Cryptographically Sealed Clean Assets:</strong> All listed files match authentic baseline checksums with valid provenance seals.
                  </div>

                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Asset ID</th>
                          <th>Name</th>
                          <th>Type</th>
                          <th>SHA-256 Checksum</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbState.assets.filter(a => a.status === 'VERIFIED').map(a => (
                          <tr key={a.assetId}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{a.assetId}</td>
                            <td>{a.name}</td>
                            <td><Badge variant="neutral">{a.type}</Badge></td>
                            <td><HashDisplay hash={a.sha256} maxLength={28} /></td>
                            <td><Badge variant="pass">VERIFIED SEAL</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. CONTRIBUTORS VIEW */}
              {selectedViewCategory === 'CONTRIBUTORS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Unit / Contributor</th>
                          <th>Sample Volume</th>
                          <th>Duplicate Rate</th>
                          <th>Near-Dup Rate</th>
                          <th>Risk Score</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Unit Alpha (C01)</strong></td>
                          <td>250 samples</td>
                          <td>0.4%</td>
                          <td>1.2%</td>
                          <td>12 / 100</td>
                          <td><Badge variant="pass">LOW RISK</Badge></td>
                        </tr>
                        <tr>
                          <td><strong>Unit Delta (C04)</strong></td>
                          <td>180 samples</td>
                          <td>0.6%</td>
                          <td>0.0%</td>
                          <td>14 / 100</td>
                          <td><Badge variant="pass">LOW RISK</Badge></td>
                        </tr>
                        <tr style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                          <td><strong>Unit Golf (C07)</strong></td>
                          <td>135 samples</td>
                          <td>0.0%</td>
                          <td>12.6% (Elevated)</td>
                          <td>87 / 100</td>
                          <td><Badge variant="critical">HIGH RISK (FLAGGED)</Badge></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 6. SINGLE FILE VIEW */}
              {selectedViewCategory === 'SINGLE_FILE' && selectedFileForInspect && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {'assetId' in selectedFileForInspect ? (
                    // Stored database asset
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span style={{ fontSize: 16, fontWeight: 700 }}>{selectedFileForInspect.name}</span>
                        <Badge variant={selectedFileForInspect.status === 'VERIFIED' ? 'pass' : (selectedFileForInspect.status === 'QUARANTINE' ? 'critical' : 'review')}>
                          {selectedFileForInspect.status}
                        </Badge>
                      </div>

                      <div className="grid-2">
                        {renderSimulatedImage(selectedFileForInspect.name, selectedFileForInspect.status, selectedFileForInspect.status === 'VERIFIED' ? '#22c55e' : '#f43f5e', selectedFileForInspect.previewUrl)}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                          <div><span style={{ color: 'var(--color-text-muted)' }}>Asset ID:</span> <strong>{selectedFileForInspect.assetId}</strong></div>
                          <div><span style={{ color: 'var(--color-text-muted)' }}>Type:</span> {selectedFileForInspect.type}</div>
                          <div><span style={{ color: 'var(--color-text-muted)' }}>Size:</span> {formatFileSize(selectedFileForInspect.fileSize)}</div>
                          <div><span style={{ color: 'var(--color-text-muted)' }}>Contributor:</span> {selectedFileForInspect.contributorName} ({selectedFileForInspect.contributorId})</div>
                          <div><span style={{ color: 'var(--color-text-muted)' }}>Provenance Block:</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brand-primary)' }}>{selectedFileForInspect.provenanceBlock}</span></div>
                          <div><span style={{ color: 'var(--color-text-muted)' }}>Full SHA-256:</span></div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--color-bg-secondary)', padding: 6, borderRadius: 4, wordBreak: 'break-all' }}>
                            {selectedFileForInspect.sha256}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Analyzed Item
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span style={{ fontSize: 16, fontWeight: 700 }}>{selectedFileForInspect.fileMeta.fileName}</span>
                        <RiskBadge risk={selectedFileForInspect.comparison.riskLevel} />
                      </div>
                      <div className="grid-2" style={{ marginBottom: 12 }}>
                        {renderSimulatedImage(selectedFileForInspect.fileMeta.fileName, selectedFileForInspect.comparison.riskLevel, selectedFileForInspect.comparison.riskLevel === 'CRITICAL' ? '#f43f5e' : (selectedFileForInspect.comparison.riskLevel === 'HIGH' ? '#f59e0b' : '#22c55e'), selectedFileForInspect.fileMeta.previewUrl)}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                          <div><span style={{ color: 'var(--color-text-muted)' }}>File Size:</span> {formatFileSize(selectedFileForInspect.fileMeta.fileSize)}</div>
                          <div><span style={{ color: 'var(--color-text-muted)' }}>Type:</span> {selectedFileForInspect.fileMeta.fileType}</div>
                          <div><span style={{ color: 'var(--color-text-muted)' }}>Verdict:</span> <strong>{selectedFileForInspect.comparison.findingTitle}</strong></div>
                          <div style={{ color: 'var(--color-text-secondary)' }}>{selectedFileForInspect.comparison.findingDetails}</div>
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--color-bg-secondary)', padding: 8, borderRadius: 4, wordBreak: 'break-all' }}>
                        SHA-256: {selectedFileForInspect.fileMeta.sha256}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <Button variant="secondary" size="md" onClick={() => setSelectedViewCategory(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
