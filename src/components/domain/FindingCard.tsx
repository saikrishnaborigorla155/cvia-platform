// CVIA — FindingCard Domain Component

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { Finding } from '../../types/cvia';
import { SeverityBadge, ActionBadge, Badge } from '../ui/index';

interface FindingCardProps {
  finding: Finding;
  onAction?: (findingId: string, action: 'ACCEPT' | 'REVIEW' | 'QUARANTINE') => void;
}

export function FindingCard({ finding, onAction }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);

  const severityClass = finding.severity.toLowerCase();
  const confidencePct = Math.round(finding.confidence * 100);

  return (
    <article
      className={`finding-card severity-${severityClass}`}
      aria-label={`Finding: ${finding.title}`}
    >
      {/* Header */}
      <div className="finding-header">
        <div className="finding-title-group">
          <div className="finding-id">{finding.findingId}</div>
          <div className="finding-title">{finding.title}</div>
          <div className="finding-asset">Affected: {finding.affectedAsset}</div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <SeverityBadge severity={finding.severity} />
          <ActionBadge action={finding.recommendedAction} />
        </div>
      </div>

      {/* Body */}
      <div className="finding-body">
        <div className="finding-section">
          <div className="finding-section-label">Reason</div>
          <div className="finding-section-content">{finding.reason}</div>
        </div>

        {/* Expandable: Evidence */}
        <button
          className="btn btn-ghost btn-sm mt-3"
          style={{ padding: '4px 0', color: 'var(--color-text-muted)' }}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Hide Evidence' : `Show Evidence (${finding.evidence.length})`}
        </button>

        {expanded && (
          <div style={{ marginTop: 12 }}>
            <div className="finding-section-label">Evidence</div>
            {finding.evidence.map(ev => (
              <div
                key={ev.evidenceId}
                style={{
                  background: 'var(--color-bg-muted)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  marginTop: 8,
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                  {ev.type}
                </div>
                <div style={{ color: 'var(--color-text-secondary)' }}>{ev.description}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    Detector: <strong style={{ color: 'var(--color-text-secondary)' }}>{ev.detector}</strong>
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    Confidence: <strong style={{ color: 'var(--color-text-secondary)' }}>{Math.round(ev.confidence * 100)}%</strong>
                  </span>
                  {ev.dataPoints !== undefined && (
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Data points: <strong style={{ color: 'var(--color-text-secondary)' }}>{ev.dataPoints}</strong>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="finding-meta">
        <div className="finding-meta-item">
          <span className="finding-meta-label">Detector</span>
          <span className="finding-meta-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{finding.detector}</span>
        </div>
        <div className="finding-meta-item">
          <span className="finding-meta-label">Confidence</span>
          <span className="finding-meta-value">{confidencePct}%</span>
        </div>
        <div className="finding-meta-item">
          <span className="finding-meta-label">Category</span>
          <span className="finding-meta-value">
            <Badge variant="info">{finding.category}</Badge>
          </span>
        </div>
        <div className="finding-meta-item">
          <span className="finding-meta-label">Attack Type</span>
          <span className="finding-meta-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            {finding.attackType}
          </span>
        </div>
        <div className="finding-meta-item">
          <span className="finding-meta-label">Timestamp</span>
          <span className="finding-meta-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            {new Date(finding.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Limitation */}
      <div className="finding-limitation">
        <Info size={11} style={{ display: 'inline', marginRight: 4 }} />
        <strong>Limitation:</strong> {finding.limitations}
      </div>

      {/* Actions */}
      {onAction && (
        <div className="finding-actions">
          <button
            className="btn btn-sm"
            style={{ background: 'var(--color-pass-bg)', border: '1px solid var(--color-pass-border)', color: 'var(--color-pass-text)' }}
            onClick={() => onAction(finding.findingId, 'ACCEPT')}
          >
            Accept
          </button>
          <button
            className="btn btn-sm"
            style={{ background: 'var(--color-review-bg)', border: '1px solid var(--color-review-border)', color: 'var(--color-review-text)' }}
            onClick={() => onAction(finding.findingId, 'REVIEW')}
          >
            Review
          </button>
          <button
            className="btn btn-sm"
            style={{ background: 'var(--color-critical-bg)', border: '1px solid var(--color-critical-border)', color: 'var(--color-critical-text)' }}
            onClick={() => onAction(finding.findingId, 'QUARANTINE')}
          >
            Quarantine
          </button>
        </div>
      )}
    </article>
  );
}
