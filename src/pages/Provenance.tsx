// CVIA — Provenance Page

import { GitBranch, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useAssurance } from '../context/AssuranceContext';
import {
  Card, CardHeader, CardBody, MetricCard, SectionHeader, DemoBanner,
  Badge, HashDisplay, EmptyState,
} from '../components/ui/index';
import type { ProvenanceNode } from '../types/cvia';

const NODE_TYPE_LABELS: Record<string, string> = {
  CONTRIBUTOR: 'Contributor', DATASET: 'Dataset', PREPROCESSING: 'Preprocessing',
  TRAINING: 'Training Run', MODEL: 'Model', INFERENCE: 'Inference Session', OUTPUT: 'Output',
};

function NodeCard({ node, isLast }: { node: ProvenanceNode; isLast: boolean }) {
  const isVerified = node.status === 'VERIFIED';
  const isTampered = node.status === 'TAMPERED';

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* Connector line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%', border: '2px solid',
          borderColor: isVerified ? 'var(--color-pass-icon)' : isTampered ? 'var(--color-critical-icon)' : 'var(--color-border-strong)',
          background: isVerified ? 'var(--color-pass-bg)' : isTampered ? 'var(--color-critical-bg)' : 'var(--color-bg-muted)',
          marginTop: 6, zIndex: 1, flexShrink: 0,
        }} />
        {!isLast && <div style={{ width: 2, flex: 1, background: 'var(--color-border)', marginTop: 2, minHeight: 32 }} />}
      </div>

      {/* Node content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
        <div style={{
          background: 'var(--color-bg-surface)', border: '1px solid',
          borderColor: isVerified ? 'var(--color-pass-border)' : isTampered ? 'var(--color-critical-border)' : 'var(--color-border)',
          borderRadius: 8, padding: '12px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 2 }}>
                {NODE_TYPE_LABELS[node.nodeType] ?? node.nodeType}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{node.label}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>Source: {node.source}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isVerified
                ? <CheckCircle2 size={16} style={{ color: 'var(--color-pass-icon)' }} />
                : isTampered
                  ? <XCircle size={16} style={{ color: 'var(--color-critical-icon)' }} />
                  : <AlertTriangle size={16} style={{ color: 'var(--color-review-icon)' }} />}
              <Badge variant={isVerified ? 'pass' : isTampered ? 'critical' : 'neutral'}>
                {node.status}
              </Badge>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>HASH </span>
              <HashDisplay hash={node.hash} maxLength={40} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>NODE ID </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-secondary)' }}>{node.nodeId}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>TIME </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-secondary)' }}>{new Date(node.timestamp).toLocaleString()}</span>
            </div>
          </div>
          {node.metadata && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(node.metadata).map(([k, v]) => (
                <span key={k} style={{ fontSize: 11, background: 'var(--color-bg-muted)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '2px 8px', color: 'var(--color-text-secondary)' }}>
                  {k}: {String(v)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Provenance() {
  const { state } = useAssurance();
  const v = state.activeVerification;
  const prov = v?.provenance;

  if (!prov) {
    return (
      <div>
        <SectionHeader title="Provenance" description="No provenance chain loaded." />
        <EmptyState icon={<GitBranch size={24} />} title="No provenance data" description="Run a verification to generate the provenance chain." />
      </div>
    );
  }

  return (
    <div className="section-grid">
      {v?.isSimulation && <DemoBanner />}

      <SectionHeader
        title="Provenance Chain"
        description={`Chain ${prov.chainId} · ${prov.nodes.length} nodes · ${prov.totalRecords} inference records`}
        badge={<Badge variant={prov.chainValid && !prov.tamperingDetected ? 'pass' : 'critical'}>
          {prov.tamperingDetected ? 'TAMPERING DETECTED' : 'CHAIN VALID'}
        </Badge>}
      />

      {/* Metrics */}
      <div className="metric-grid">
        <MetricCard label="Chain Valid" value={prov.chainValid ? 'YES' : 'NO'} variant={prov.chainValid ? 'pass' : 'critical'} />
        <MetricCard label="Tampering" value={prov.tamperingDetected ? 'DETECTED' : 'NONE'} variant={prov.tamperingDetected ? 'critical' : 'pass'} />
        <MetricCard label="Replay Attack" value={prov.replayDetected ? 'DETECTED' : 'NONE'} variant={prov.replayDetected ? 'critical' : 'pass'} />
        <MetricCard label="Verified Records" value={`${prov.verifiedRecords}/${prov.totalRecords}`} variant={prov.verifiedRecords === prov.totalRecords ? 'pass' : 'review'} />
        <MetricCard label="Provenance Nodes" value={prov.nodes.length} />
        <MetricCard label="First Tampered" value={prov.firstTamperedRecord ?? 'None'} variant={prov.firstTamperedRecord ? 'critical' : 'pass'} />
      </div>

      {/* Tampering alert */}
      {prov.tamperingDetected && (
        <div style={{ background: 'var(--color-critical-bg)', border: '1px solid var(--color-critical-border)', borderRadius: 8, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <XCircle size={18} style={{ color: 'var(--color-critical-icon)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-critical-text)', marginBottom: 4 }}>TAMPERING DETECTED</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Tampering first detected at record <strong>{prov.firstTamperedRecord}</strong>.
              Records {prov.tamperingAt?.join(', ')} failed hash verification. All subsequent records in the chain are invalidated.
            </div>
          </div>
        </div>
      )}

      {/* Provenance chain visualization */}
      <Card>
        <CardHeader>
          <div>
            <div className="card-title">Provenance Chain</div>
            <div className="card-desc">Contributor → Dataset → Preprocessing → Training → Model → Inference → Output</div>
          </div>
        </CardHeader>
        <CardBody>
          {prov.nodes.map((node, i) => (
            <NodeCard key={node.nodeId} node={node} isLast={i === prov.nodes.length - 1} />
          ))}
        </CardBody>
      </Card>

      {/* Inference records hash chain */}
      <Card>
        <CardHeader>
          <div>
            <div className="card-title">Inference Record Hash Chain</div>
            <div className="card-desc">Each record's hash links to the previous — tampering breaks the chain</div>
          </div>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-muted)' }}>
                {['Record ID', 'Sequence', 'Input Hash', 'Output Hash', 'Prev Hash', 'Status'].map(h => (
                  <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prov.records.map(rec => (
                <tr key={rec.recordId} style={{
                  borderBottom: '1px solid var(--color-border)',
                  background: rec.tamperDetected ? 'var(--color-critical-bg)' : 'transparent',
                }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11 }}>{rec.recordId}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>{rec.sequence}</td>
                  <td style={{ padding: '10px 14px' }}><HashDisplay hash={rec.inputHash} maxLength={20} /></td>
                  <td style={{ padding: '10px 14px' }}><HashDisplay hash={rec.outputHash} maxLength={20} /></td>
                  <td style={{ padding: '10px 14px' }}><HashDisplay hash={rec.previousRecordHash} maxLength={20} /></td>
                  <td style={{ padding: '10px 14px' }}>
                    {rec.tamperDetected
                      ? <Badge variant="critical">TAMPERED</Badge>
                      : <Badge variant="pass">VERIFIED</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
