// CVIA — Distribution Shift Page

import { TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useAssurance } from '../context/AssuranceContext';
import {
  Card, CardHeader, CardBody, MetricCard, SectionHeader, DemoBanner,
  Badge, EmptyState, ProgressBar,
} from '../components/ui/index';
import type { ShiftClassification } from '../types/cvia';

function classificationBadge(cls: ShiftClassification) {
  if (cls === 'SUSPICIOUS_ANOMALY') return <Badge variant="review">SUSPICIOUS ANOMALY</Badge>;
  if (cls === 'OPERATIONAL_DRIFT') return <Badge variant="info">OPERATIONAL DRIFT</Badge>;
  if (cls === 'INSUFFICIENT_EVIDENCE') return <Badge variant="neutral">INSUFFICIENT EVIDENCE</Badge>;
  return <Badge variant="pass">BENIGN</Badge>;
}

export function DistributionShift() {
  const { state } = useAssurance();
  const v = state.activeVerification;
  const drift = v?.distribution;

  if (!drift) {
    return (
      <div>
        <SectionHeader title="Distribution Shift" description="No distribution analysis loaded." />
        <EmptyState icon={<TrendingUp size={24} />} title="No distribution analysis" description="Run a verification to analyse distribution shift." />
      </div>
    );
  }

  const exceeded = drift.metrics.filter(m => m.exceededThreshold);
  const overallPct = Math.round(drift.overallShiftScore * 100);

  return (
    <div className="section-grid">
      {v?.isSimulation && <DemoBanner />}

      <SectionHeader
        title="Distribution Shift"
        description={`${drift.referenceDatasetId} vs ${drift.observedDatasetId} · JS Divergence: ${drift.jsDivergence.toFixed(3)}`}
        badge={classificationBadge(drift.classification)}
      />

      {/* Important disclaimer */}
      <div style={{ background: 'var(--color-info-bg)', border: '1px solid var(--color-info-border)', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Info size={15} style={{ color: 'var(--color-info-text)', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: 'var(--color-info-text)', lineHeight: 1.5 }}>
          <strong>Classification policy:</strong> Distribution shift is NOT automatically classified as malicious.
          Environmental variation, operational differences, and seasonal changes can all produce legitimate shifts.
          Evidence is classified as Operational Drift, Suspicious Anomaly, or Insufficient Evidence.
        </p>
      </div>

      {/* Metrics */}
      <div className="metric-grid">
        <MetricCard label="Overall Shift Score" value={`${overallPct}%`} variant={overallPct > 30 ? 'review' : 'pass'} />
        <MetricCard label="JS Divergence" value={drift.jsDivergence.toFixed(3)} variant={drift.jsDivergence > 0.1 ? 'review' : 'pass'} sub="(0=identical, 1=max)"/>
        <MetricCard label="Classification" value={drift.classification.replace('_', ' ')} variant={drift.classification === 'SUSPICIOUS_ANOMALY' ? 'review' : 'pass'} />
        <MetricCard label="Risk Level" value={drift.riskLevel} variant={drift.riskLevel === 'HIGH' ? 'high' : drift.riskLevel === 'MEDIUM' ? 'review' : 'pass'} />
        <MetricCard label="Metrics Exceeded" value={`${exceeded.length}/${drift.metrics.length}`} variant={exceeded.length > 0 ? 'review' : 'pass'} />
      </div>

      {/* Interpretation */}
      <Card>
        <CardHeader>
          <div className="card-title">Interpretation</div>
          {classificationBadge(drift.classification)}
        </CardHeader>
        <CardBody>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{drift.interpretation}</p>
        </CardBody>
      </Card>

      {/* Per-metric breakdown */}
      <Card>
        <CardHeader>
          <div>
            <div className="card-title">Per-Metric Analysis</div>
            <div className="card-desc">Reference vs observed — threshold-based risk assessment</div>
          </div>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-muted)' }}>
                {['Metric', 'Reference', 'Observed', 'Difference', 'Threshold', 'Status'].map(h => (
                  <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drift.metrics.map(metric => (
                <tr key={metric.metricName} style={{
                  borderBottom: '1px solid var(--color-border)',
                  background: metric.exceededThreshold ? 'var(--color-review-bg)' : 'transparent',
                }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13 }}>
                    {metric.metricName}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {typeof metric.referenceValue === 'number' && metric.referenceValue > 1000
                      ? metric.referenceValue.toLocaleString()
                      : metric.referenceValue.toFixed(3)}
                    {metric.unit ? ` ${metric.unit}` : ''}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: metric.exceededThreshold ? 'var(--color-review-text)' : 'var(--color-text-secondary)', fontWeight: metric.exceededThreshold ? 600 : 400 }}>
                    {typeof metric.observedValue === 'number' && metric.observedValue > 1000
                      ? metric.observedValue.toLocaleString()
                      : metric.observedValue.toFixed(3)}
                    {metric.unit ? ` ${metric.unit}` : ''}
                  </td>
                  <td style={{ padding: '12px 16px', color: metric.exceededThreshold ? 'var(--color-review-text)' : 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {metric.difference > 0 ? '+' : ''}{typeof metric.difference === 'number' && Math.abs(metric.difference) > 100
                      ? metric.difference.toLocaleString()
                      : metric.difference.toFixed(3)}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {metric.threshold.toFixed(3)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {metric.exceededThreshold
                      ? <Badge variant="review">EXCEEDED</Badge>
                      : <Badge variant="pass">WITHIN</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Shift score per metric bar chart */}
      <Card>
        <CardHeader>
          <div className="card-title">Normalized Shift Score by Metric</div>
        </CardHeader>
        <CardBody>
          {drift.metrics.map(m => (
            <div key={m.metricName} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{m.metricName}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {(m.normalizedDifference * 100).toFixed(1)}% shift
                  </span>
                  {m.exceededThreshold
                    ? <AlertTriangle size={13} style={{ color: 'var(--color-review-icon)' }} />
                    : <CheckCircle2 size={13} style={{ color: 'var(--color-pass-icon)' }} />}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <ProgressBar
                    value={Math.min(100, m.normalizedDifference * 100)}
                    variant={m.exceededThreshold ? 'review' : 'pass'}
                    showValue={false}
                  />
                </div>
                {/* Threshold marker */}
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', minWidth: 60, textAlign: 'right' }}>
                  threshold: {(m.threshold * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Classification guide */}
      <Card>
        <CardHeader><div className="card-title">Classification Guide</div></CardHeader>
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { label: 'OPERATIONAL DRIFT', color: 'info', desc: 'Shift is within expected operational variation. No action required.' },
              { label: 'SUSPICIOUS ANOMALY', color: 'review', desc: 'Statistically significant shift that warrants investigation. May indicate data poisoning or environmental change.' },
              { label: 'INSUFFICIENT EVIDENCE', color: 'neutral', desc: 'Not enough data to classify the shift. Collect more samples.' },
              { label: 'BENIGN', color: 'pass', desc: 'Shift is negligible and does not require action.' },
            ].map(cls => (
              <div key={cls.label} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--color-bg-muted)', border: '1px solid var(--color-border)' }}>
                <div style={{ marginBottom: 8 }}>
                  <Badge variant={cls.color as 'info' | 'review' | 'neutral' | 'pass'}>{cls.label}</Badge>
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{cls.desc}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
