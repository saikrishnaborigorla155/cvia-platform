// CVIA — Model Integrity Page

import { Cpu, Info, AlertTriangle, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { useAssurance } from '../context/AssuranceContext';
import {
  Card, CardHeader, CardBody, MetricCard, SectionHeader, DemoBanner,
  Badge, UnavailableBanner, HashDisplay, EmptyState,
} from '../components/ui/index';

function AccessLevelBadge({ level }: { level: string }) {
  if (level === 'WHITE_BOX') return <Badge variant="pass">WHITE BOX</Badge>;
  if (level === 'GREY_BOX') return <Badge variant="medium">GREY BOX</Badge>;
  return <Badge variant="neutral">BLACK BOX</Badge>;
}

export function ModelIntegrity() {
  const { state } = useAssurance();
  const v = state.activeVerification;
  const model = v?.model;

  if (!model) {
    return (
      <div>
        <SectionHeader title="Model Integrity" description="No model loaded." />
        <EmptyState icon={<Cpu size={24} />} title="No model analysed" description="Load a model from the Verify page and run verification." />
      </div>
    );
  }

  const hashMatch = model.hashMatch;
  const agreement = model.behaviouralAgreement ?? 0;

  return (
    <div className="section-grid">
      {v?.isSimulation && <DemoBanner />}

      <SectionHeader
        title="Model Integrity"
        description={`${model.modelId} · ${model.format} · Access: ${model.accessLevel.replace('_', ' ')}`}
        badge={<Badge variant={hashMatch ? 'pass' : 'critical'}>{hashMatch ? 'HASH MATCH' : 'HASH MISMATCH'}</Badge>}
      />

      {/* Access level banner */}
      {model.accessLevel === 'BLACK_BOX' && (
        <UnavailableBanner
          title="Access Level: Black Box"
          description="The model weights are not available for inspection. Only hash verification and behavioural comparison are possible. White-box methods (activation analysis, parameter comparison) are unavailable."
          icon={<Lock size={16} />}
          available={['SHA-256 hash verification', 'Metadata inspection', 'Behavioural test battery', 'Prototype trigger screening']}
          unavailable={['Activation analysis', 'Parameter-level comparison', 'Gradient-based trigger search', 'Weight statistics comparison']}
        />
      )}

      {/* Top metrics */}
      <div className="metric-grid">
        <MetricCard label="Integrity Result" value={model.integrityResult} variant={model.integrityResult === 'PASS' ? 'pass' : 'critical'} />
        <MetricCard label="Hash Match" value={hashMatch ? 'MATCH' : 'MISMATCH'} variant={hashMatch ? 'pass' : 'critical'} />
        <MetricCard label="Behavioural Agreement" value={`${Math.round(agreement * 100)}%`} variant={agreement >= 0.9 ? 'pass' : agreement >= 0.7 ? 'review' : 'critical'} />
        <MetricCard label="Tests Passed" value={`${model.behaviouralTests.filter(t => t.passed).length}/${model.behaviouralTests.length}`} variant="pass" />
        <MetricCard label="Parameters" value={model.parameterCount ? `${(model.parameterCount / 1e6).toFixed(1)}M` : 'N/A'} />
        <MetricCard label="Access Level" value={model.accessLevel.replace('_', ' ')} />
      </div>

      {/* Hash + metadata */}
      <div className="grid-2">
        <Card>
          <CardHeader><div className="card-title">Hash Verification</div></CardHeader>
          <CardBody>
            {[
              { label: 'Model ID', value: model.modelId, mono: false },
              { label: 'Format', value: model.format, mono: false },
              { label: 'Architecture', value: model.architecture ?? 'Unknown', mono: false },
              { label: 'Input Shape', value: model.inputShape ?? 'N/A', mono: true },
              { label: 'Output Shape', value: model.outputShape ?? 'N/A', mono: true },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontFamily: row.mono ? 'var(--font-mono)' : undefined, color: 'var(--color-text-primary)', fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Model Hash</div>
              <HashDisplay hash={model.hash} maxLength={60} />
            </div>
            {model.referenceHash && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Reference Hash</div>
                <HashDisplay hash={model.referenceHash} maxLength={60} />
              </div>
            )}
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 6, background: hashMatch ? 'var(--color-pass-bg)' : 'var(--color-critical-bg)', border: `1px solid ${hashMatch ? 'var(--color-pass-border)' : 'var(--color-critical-border)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: hashMatch ? 'var(--color-pass-text)' : 'var(--color-critical-text)', fontWeight: 600, fontSize: 13 }}>
                {hashMatch ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                {hashMatch ? 'Hash verification PASSED — Model matches reference' : 'Hash verification FAILED — Model does not match reference'}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><div className="card-title">Access Level & Confidence</div></CardHeader>
          <CardBody>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20, padding: '12px 16px', background: 'var(--color-bg-muted)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <AccessLevelBadge level={model.accessLevel} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{model.accessLevel.replace('_', ' ')}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {model.accessLevel === 'BLACK_BOX' ? 'Only hash and behavioural methods available' : 'Full analysis possible'}
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Limitations</div>
              {model.limitations.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--color-border)', fontSize: 12, color: 'var(--color-text-secondary)', alignItems: 'flex-start' }}>
                  <Info size={12} style={{ color: 'var(--color-info-text)', flexShrink: 0, marginTop: 1 }} />
                  {l}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Unavailable Methods</div>
              {model.unavailableMethods.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  <XCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                  {m}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Behavioural tests */}
      <Card>
        <CardHeader>
          <div>
            <div className="card-title">Behavioural Test Battery</div>
            <div className="card-desc">
              Reference model comparison — {model.behaviouralTests.filter(t => t.passed).length}/{model.behaviouralTests.length} tests passed
            </div>
          </div>
          <Badge variant={agreement >= 0.9 ? 'pass' : 'review'}>
            Agreement: {Math.round(agreement * 100)}%
          </Badge>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {model.behaviouralTests.map(test => (
            <div key={test.testId} style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', background: test.notes ? 'var(--color-review-bg)' : 'transparent' }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{test.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{test.testId}</div>
                </div>
                <div className="flex items-center gap-8 shrink-0">
                  {test.passed
                    ? <CheckCircle2 size={16} style={{ color: 'var(--color-pass-icon)' }} />
                    : <XCircle size={16} style={{ color: 'var(--color-critical-icon)' }} />}
                  <Badge variant={test.passed ? 'pass' : 'critical'}>{test.passed ? 'PASS' : 'FAIL'}</Badge>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Expected: </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{test.expectedOutput}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Observed: </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{test.observedOutput}</span>
                </div>
              </div>
              {test.notes && (
                <div style={{ marginTop: 8, padding: '6px 10px', background: 'var(--color-review-bg)', border: '1px solid var(--color-review-border)', borderRadius: 4, fontSize: 11, color: 'var(--color-review-text)', fontStyle: 'italic' }}>
                  <AlertTriangle size={11} style={{ display: 'inline', marginRight: 4 }} />
                  {test.notes}
                </div>
              )}
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
