// CVIA — Audit Trail Page

import { useState } from 'react';
import {
  ClipboardList, CheckCircle, XCircle, Download,
  Shield, AlertTriangle,
} from 'lucide-react';
import { useAssurance } from '../context/AssuranceContext';
import {
  Card, CardHeader, CardBody, SectionHeader, DemoBanner,
  Badge, Button, HashDisplay, EmptyState, MetricCard,
} from '../components/ui/index';
import type { AuditEvent } from '../types/cvia';

const ACTION_ICONS: Partial<Record<string, React.ReactNode>> = {
  VERIFICATION_STARTED: <Shield size={14} style={{ color: 'var(--color-brand-primary)' }} />,
  DATASET_IMPORTED: <Shield size={14} style={{ color: 'var(--color-info-text)' }} />,
  HASH_CALCULATED: <Shield size={14} style={{ color: 'var(--color-info-text)' }} />,
  DATASET_ANALYSED: <Shield size={14} style={{ color: 'var(--color-info-text)' }} />,
  FINDING_GENERATED: <AlertTriangle size={14} style={{ color: 'var(--color-review-icon)' }} />,
  MODEL_VERIFIED: <CheckCircle size={14} style={{ color: 'var(--color-pass-icon)' }} />,
  INFERENCE_VERIFIED: <CheckCircle size={14} style={{ color: 'var(--color-pass-icon)' }} />,
  DECISION_RECORDED: <Shield size={14} style={{ color: 'var(--color-brand-primary)' }} />,
  REPORT_EXPORTED: <Download size={14} style={{ color: 'var(--color-info-text)' }} />,
  CONTRIBUTOR_ANALYSED: <Shield size={14} style={{ color: 'var(--color-info-text)' }} />,
  DISTRIBUTION_ANALYSED: <Shield size={14} style={{ color: 'var(--color-info-text)' }} />,
  AUDIT_CHAIN_VERIFIED: <CheckCircle size={14} style={{ color: 'var(--color-pass-icon)' }} />,
};

function EventRow({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false);
  const icon = ACTION_ICONS[event.action] ?? <Shield size={14} style={{ color: 'var(--color-text-muted)' }} />;

  return (
    <div style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div
        style={{ display: 'flex', gap: 16, padding: '10px 20px', cursor: 'pointer', alignItems: 'flex-start' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ paddingTop: 1, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{event.action}</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 10 }}>{event.asset}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
              <Badge variant={event.status === 'OK' ? 'pass' : 'critical'}>{event.status}</Badge>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {new Date(event.timestamp).toLocaleString()}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>{event.eventId}</span>
            </div>
          </div>
          {event.details && (
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>{event.details}</div>
          )}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 20px 14px 50px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: 100 }}>Previous Hash</span>
            <HashDisplay hash={event.previousHash} maxLength={50} />
          </div>
          <div style={{ fontSize: 11, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: 100 }}>Event Hash</span>
            <HashDisplay hash={event.eventHash} maxLength={50} />
          </div>
          <div style={{ fontSize: 11 }}>
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Actor: </span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{event.actor}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function Audit() {
  const { state } = useAssurance();
  const v = state.activeVerification;
  const events = v?.auditTrail ?? state.auditTrail;
  const [chainVerified, setChainVerified] = useState<boolean | null>(null);

  if (events.length === 0) {
    return (
      <div>
        <SectionHeader title="Audit Trail" description="No audit events recorded." />
        <EmptyState icon={<ClipboardList size={24} />} title="No audit events" description="Run a verification to generate an audit trail." />
      </div>
    );
  }

  const okCount = events.filter(e => e.status === 'OK').length;
  const tamperedCount = events.filter(e => e.status === 'TAMPERED').length;

  function verifyChain() {
    // Verify event hash chain locally
    let valid = true;
    for (let i = 1; i < events.length; i++) {
      if (events[i].previousHash !== events[i - 1].eventHash) {
        valid = false;
        break;
      }
    }
    setChainVerified(valid);
  }

  function exportJSON() {
    const report = {
      exportedAt: new Date().toISOString(),
      verificationId: v?.verificationId,
      totalEvents: events.length,
      auditTrail: events,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cvia-audit-${v?.verificationId ?? 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="section-grid">
      {v?.isSimulation && <DemoBanner />}

      <SectionHeader
        title="Audit Trail"
        description={`${events.length} events · Tamper-evident hash chain`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" icon={<Shield size={14} />} onClick={verifyChain}>
              Verify Chain
            </Button>
            <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={exportJSON}>
              Export JSON
            </Button>
          </div>
        }
      />

      {/* Chain verification result */}
      {chainVerified !== null && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, border: '1px solid',
          borderColor: chainVerified ? 'var(--color-pass-border)' : 'var(--color-critical-border)',
          background: chainVerified ? 'var(--color-pass-bg)' : 'var(--color-critical-bg)',
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          {chainVerified
            ? <CheckCircle size={16} style={{ color: 'var(--color-pass-icon)' }} />
            : <XCircle size={16} style={{ color: 'var(--color-critical-icon)' }} />}
          <span style={{ fontSize: 13, fontWeight: 600, color: chainVerified ? 'var(--color-pass-text)' : 'var(--color-critical-text)' }}>
            {chainVerified
              ? 'Audit chain verified — all event hashes are consistent'
              : 'Audit chain TAMPERED — event hash mismatch detected'}
          </span>
        </div>
      )}

      {/* Metrics */}
      <div className="metric-grid">
        <MetricCard label="Total Events" value={events.length} />
        <MetricCard label="Verified OK" value={okCount} variant="pass" />
        <MetricCard label="Tampered" value={tamperedCount} variant={tamperedCount > 0 ? 'critical' : 'pass'} />
      </div>

      {/* How tamper-evident works */}
      <Card>
        <CardHeader><div className="card-title">Tamper-Evident Audit Chain</div></CardHeader>
        <CardBody>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
            Each audit event contains the SHA-256 hash of the previous event.
            Modifying any event breaks the chain — all subsequent events will report a <strong>previous hash mismatch</strong>.
            The chain starts with a zero hash (genesis event).
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 13 }}>
            {['Event 001', 'Event 002', 'Event 003', '…', 'Event N'].map((e, i, arr) => (
              <span key={e} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '4px 10px', background: 'var(--color-brand-subtle)', border: '1px solid var(--color-border-brand)', borderRadius: 4, fontSize: 12, fontWeight: 600, color: 'var(--color-brand-primary)' }}>{e}</span>
                {i < arr.length - 1 && <span style={{ color: 'var(--color-text-muted)' }}>→ hash →</span>}
              </span>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Event timeline */}
      <Card>
        <CardHeader>
          <div className="card-title">Event Timeline</div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Click any event to expand hash details</span>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {events.map(ev => <EventRow key={ev.eventId} event={ev} />)}
        </CardBody>
      </Card>
    </div>
  );
}
