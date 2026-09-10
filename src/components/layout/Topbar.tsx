// CVIA — Topbar Component

import { Wifi, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PAGE_META: Record<string, { title: string; desc: string }> = {
  '/': { title: 'CVIA Platform', desc: 'Trustworthy Computer Vision Integrity Assurance' },
  '/console': { title: 'Dashboard', desc: 'Assurance overview and summary metrics' },
  '/verify': { title: 'Verify', desc: 'Load artifacts and run integrity verification' },
  '/data': { title: 'Data Integrity', desc: 'Dataset analysis — duplicates, labels, contributors, OOD' },
  '/model': { title: 'Model Integrity', desc: 'Model hash, format, behavioural fingerprint, access level' },
  '/provenance': { title: 'Provenance', desc: 'Cryptographic hash chain — contributor → dataset → model → inference → output' },
  '/drift': { title: 'Distribution Shift', desc: 'Reference vs observed — brightness, contrast, class, contributor distributions' },
  '/inference': { title: 'Inference Integrity', desc: 'Cryptographic binding — input → model → output tamper detection' },
  '/findings': { title: 'Findings', desc: 'All findings with evidence, severity, confidence and recommended actions' },
  '/audit': { title: 'Audit Trail', desc: 'Tamper-evident chronological audit log with event hashes' },
};

interface TopbarProps {
  datasetId?: string;
  modelId?: string;
  verificationId?: string;
}

export function Topbar({ datasetId, modelId, verificationId }: TopbarProps) {
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || PAGE_META['/console'];

  return (
    <header className="topbar" role="banner">
      {/* Page title + desc */}
      <div className="topbar-left">
        <h1 className="topbar-title">{meta.title}</h1>
        <p className="topbar-desc">{meta.desc}</p>
      </div>

      {/* Right: meta badges + status */}
      <div className="topbar-right">
        {/* Meta IDs */}
        <div className="topbar-meta">
          {datasetId && (
            <div className="topbar-meta-item">
              <span className="topbar-meta-label">Dataset</span>
              <span className="topbar-meta-value">{datasetId}</span>
            </div>
          )}
          {modelId && (
            <div className="topbar-meta-item">
              <span className="topbar-meta-label">Model</span>
              <span className="topbar-meta-value">{modelId}</span>
            </div>
          )}
          {verificationId && (
            <div className="topbar-meta-item">
              <span className="topbar-meta-label">Verification</span>
              <span className="topbar-meta-value">{verificationId}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        {(datasetId || modelId || verificationId) && (
          <div style={{ width: 1, height: 28, background: 'var(--color-border)', flexShrink: 0 }} />
        )}

        {/* Status badges */}
        <div className="topbar-badge offline" role="status" aria-label="System is in offline mode">
          <Wifi size={11} />
          Offline Mode
        </div>
        <div className="topbar-badge ready" role="status" aria-label="System is ready">
          <CheckCircle2 size={11} />
          System Ready
        </div>
      </div>
    </header>
  );
}
