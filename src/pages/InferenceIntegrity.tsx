// CVIA — Inference Integrity Page

import { Zap, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Shield } from 'lucide-react';
import { useAssurance } from '../context/AssuranceContext';
import {
  Card, CardHeader, CardBody, MetricCard, SectionHeader, DemoBanner,
  Badge, HashDisplay, EmptyState, Alert,
} from '../components/ui/index';
import type { InferenceRecord } from '../types/cvia';

function RecordStatus({ rec }: { rec: InferenceRecord }) {
  if (rec.tamperDetected) return <Badge variant="critical">TAMPERED</Badge>;
  if (rec.replayDetected) return <Badge variant="high">REPLAY</Badge>;
  if (rec.sequenceViolation) return <Badge variant="high">SEQ ERROR</Badge>;
  if (rec.modelSubstitution) return <Badge variant="high">SUBSTITUTION</Badge>;
  if (rec.verified) return <Badge variant="pass">VERIFIED</Badge>;
  return <Badge variant="neutral">UNVERIFIED</Badge>;
}

function RecordCard({ rec }: { rec: InferenceRecord }) {
  const isBad = rec.tamperDetected || rec.replayDetected || rec.sequenceViolation;

  return (
    <div style={{
      border: '1px solid', borderRadius: 8, overflow: 'hidden', marginBottom: 12,
      borderColor: isBad ? 'var(--color-critical-border)' : rec.verified ? 'var(--color-pass-border)' : 'var(--color-border)',
      background: isBad ? 'var(--color-critical-bg)' : rec.verified ? 'var(--color-pass-bg)' : 'var(--color-bg-surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {isBad
            ? <XCircle size={16} style={{ color: 'var(--color-critical-icon)' }} />
            : <CheckCircle2 size={16} style={{ color: 'var(--color-pass-icon)' }} />}
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13 }}>{rec.recordId}</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Seq #{rec.sequence}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <RecordStatus rec={rec} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
            {new Date(rec.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
      <div style={{ padding: '10px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        {[
          { label: 'Input Hash', value: rec.inputHash },
          { label: 'Model Hash', value: rec.modelHash },
          { label: 'Preprocessing Hash', value: rec.preprocessingHash },
          { label: 'Config Hash', value: rec.inferenceConfigHash },
          { label: 'Output Hash', value: rec.outputHash },
          { label: 'Previous Hash', value: rec.previousRecordHash },
        ].map(row => (
          <div key={row.label}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 3 }}>{row.label}</div>
            <HashDisplay hash={row.value} maxLength={28} />
          </div>
        ))}
      </div>
      <div style={{ padding: '6px 16px', display: 'flex', gap: 12 }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Nonce: <span style={{ fontFamily: 'var(--font-mono)' }}>{rec.nonce}</span></span>
      </div>
      {rec.verificationDetails && (
        <div style={{ padding: '8px 16px', background: isBad ? 'rgba(190,18,60,0.07)' : undefined, borderTop: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: 12, color: isBad ? 'var(--color-critical-text)' : 'var(--color-text-secondary)' }}>
            <strong>Detail:</strong> {rec.verificationDetails}
          </span>
        </div>
      )}
    </div>
  );
}

export function InferenceIntegrity() {
  const { state } = useAssurance();
  const v = state.activeVerification;
  const records = v?.inferenceRecords ?? [];
  const prov = v?.provenance;

  if (records.length === 0) {
    return (
      <div>
        <SectionHeader title="Inference Integrity" description="No inference records loaded." />
        <EmptyState icon={<Zap size={24} />} title="No inference records" description="Load inference records from the Verify page." />
      </div>
    );
  }

  const verified = records.filter(r => r.verified && !r.tamperDetected).length;
  const tampered = records.filter(r => r.tamperDetected).length;
  const replayed = records.filter(r => r.replayDetected).length;
  const totalShown = records.length;

  return (
    <div className="section-grid">
      {v?.isSimulation && <DemoBanner />}

      <SectionHeader
        title="Inference Integrity"
        description={`${prov?.totalRecords ?? totalShown} total records · ${prov?.verifiedRecords ?? verified} verified · Showing ${totalShown} sample records`}
        badge={<Badge variant={tampered > 0 ? 'critical' : 'pass'}>
          {tampered > 0 ? 'TAMPERING DETECTED' : 'INTEGRITY OK'}
        </Badge>}
      />

      {tampered > 0 && (
        <Alert variant="danger" icon={<AlertTriangle size={15} />}>
          <strong>Tampering detected in {tampered} record(s).</strong> Hash mismatch indicates records may have been modified after creation.
          Records downstream of a tampered record also fail chain verification.
        </Alert>
      )}

      <div className="metric-grid">
        <MetricCard label="Total Records" value={prov?.totalRecords ?? totalShown} />
        <MetricCard label="Verified" value={prov?.verifiedRecords ?? verified} variant="pass" />
        <MetricCard label="Tampered" value={tampered} variant={tampered > 0 ? 'critical' : 'pass'} />
        <MetricCard label="Replay Attacks" value={replayed} variant={replayed > 0 ? 'critical' : 'pass'} />
        <MetricCard label="Chain Valid" value={prov?.chainValid ? 'YES' : 'NO'} variant={prov?.chainValid ? 'pass' : 'critical'} />
        <MetricCard label="First Tampered" value={prov?.firstTamperedRecord ?? 'None'} variant={prov?.firstTamperedRecord ? 'critical' : 'pass'} />
      </div>

      {/* How it works */}
      <Card>
        <CardHeader><div className="card-title">Cryptographic Binding Schema</div></CardHeader>
        <CardBody>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {[
              'Input Image + Hash', 'Model ID + Weight Hash', 'Preprocessing Config Hash',
              'Inference Config Hash', 'Timestamp', 'Sequence Number', 'Nonce',
              'Output + Output Hash', 'Previous Record Hash',
            ].map((item, i, arr) => (
              <span key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '4px 10px', background: 'var(--color-brand-subtle)', border: '1px solid var(--color-border-brand)', borderRadius: 4, fontSize: 12, fontWeight: 600, color: 'var(--color-brand-primary)' }}>{item}</span>
                {i < arr.length - 1 && <span style={{ color: 'var(--color-text-muted)' }}>→</span>}
              </span>
            ))}
            <span style={{ color: 'var(--color-text-muted)' }}>→</span>
            <span style={{ padding: '4px 10px', background: 'var(--color-pass-bg)', border: '1px solid var(--color-pass-border)', borderRadius: 4, fontSize: 12, fontWeight: 700, color: 'var(--color-pass-text)' }}>SHA-256 Record Hash</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
            Each record cryptographically binds all inputs, the model, and outputs. Changing any field invalidates the hash. Each record's hash becomes the previous_record_hash of the next, forming a tamper-evident chain.
          </div>
        </CardBody>
      </Card>

      {/* Detection capabilities */}
      <div className="grid-2">
        {[
          { icon: <Shield size={15} />, label: 'Output Modification', desc: 'Output hash mismatch indicates the recorded output was changed after inference.' },
          { icon: <RefreshCw size={15} />, label: 'Replay Attack', desc: 'Nonce + sequence number uniqueness check prevents record reuse.' },
          { icon: <AlertTriangle size={15} />, label: 'Model Substitution', desc: 'Model hash binding detects if a different model was used for inference.' },
          { icon: <XCircle size={15} />, label: 'Chain Cascade', desc: 'Tampering an earlier record causes all subsequent records to fail verification.' },
        ].map(cap => (
          <div key={cap.label} style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '14px 16px', display: 'flex', gap: 12 }}>
            <div style={{ color: 'var(--color-brand-primary)', flexShrink: 0 }}>{cap.icon}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{cap.label}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{cap.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Record list */}
      <Card>
        <CardHeader>
          <div>
            <div className="card-title">Sample Inference Records</div>
            <div className="card-desc">Showing {totalShown} records including tampered record INF-000182</div>
          </div>
        </CardHeader>
        <CardBody>
          {records.map(rec => <RecordCard key={rec.recordId} rec={rec} />)}
        </CardBody>
      </Card>
    </div>
  );
}
