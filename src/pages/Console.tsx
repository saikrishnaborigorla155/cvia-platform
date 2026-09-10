// CVIA — Console / Dashboard Page

import { Link } from 'react-router-dom';
import {
  Database, Cpu, GitBranch, TrendingUp, Zap,
  ArrowRight, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react';
import { useAssurance } from '../context/AssuranceContext';
import {
  MetricCard, SectionHeader, DemoBanner, Badge,
  DecisionBadge, RiskBadge, SeverityBadge, ProgressBar, Card, CardHeader, CardBody,
} from '../components/ui/index';
import type { CategoryScore } from '../types/cvia';

function categoryIcon(cat: string) {
  if (cat === 'DATA') return <Database size={14} />;
  if (cat === 'MODEL') return <Cpu size={14} />;
  if (cat === 'PROVENANCE') return <GitBranch size={14} />;
  if (cat === 'DISTRIBUTION') return <TrendingUp size={14} />;
  if (cat === 'INFERENCE') return <Zap size={14} />;
  return null;
}

function scoreVariant(score: number): 'pass' | 'review' | 'high' | 'critical' {
  if (score >= 80) return 'pass';
  if (score >= 60) return 'review';
  if (score >= 40) return 'high';
  return 'critical';
}

function CategoryRow({ cat }: { cat: CategoryScore }) {
  const variant = scoreVariant(cat.score);
  const progressVariant = variant === 'pass' ? 'pass' : variant === 'review' ? 'review' : variant === 'high' ? 'high' : 'critical';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ width: 130, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ color: 'var(--color-text-muted)' }}>{categoryIcon(cat.category)}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{cat.label}</span>
      </div>
      <div style={{ flex: 1 }}>
        <ProgressBar value={cat.score} variant={progressVariant} showValue={false} />
      </div>
      <div style={{ width: 40, textAlign: 'right', fontWeight: 700, fontSize: 14, color: `var(--color-${variant === 'pass' ? 'pass' : variant === 'review' ? 'review' : variant}-text)` }}>
        {cat.score}
      </div>
      <div style={{ width: 80, flexShrink: 0 }}>
        <RiskBadge risk={cat.riskLevel} />
      </div>
    </div>
  );
}

export function Console() {
  const { state } = useAssurance();
  const v = state.activeVerification;
  const ir = v?.integrityResult;

  if (!v || !ir) {
    return (
      <div>
        <SectionHeader title="Dashboard" description="No active verification. Run a verification from the Verify page." />
      </div>
    );
  }

  const critCount = v.findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = v.findings.filter(f => f.severity === 'HIGH').length;
  const medCount = v.findings.filter(f => f.severity === 'MEDIUM').length;
  const lowCount = v.findings.filter(f => f.severity === 'LOW').length;


  return (
    <div className="section-grid">
      {/* Demo banner */}
      {v.isSimulation && <DemoBanner label={v.simulationLabel} />}

      {/* Header */}
      <SectionHeader
        title="Assurance Dashboard"
        description={`Verification ${v.verificationId} · Completed ${new Date(v.completedAt ?? '').toLocaleString()}`}
        badge={<DecisionBadge decision={ir.decision} />}
        actions={
          <Link to="/verify" className="btn btn-primary btn-sm">
            New Verification
          </Link>
        }
      />

      {/* Top metrics */}
      <div className="metric-grid">
        <MetricCard label="Overall Assurance" value={ir.overallScore} sub="/ 100" variant={
          ir.overallScore >= 80 ? 'pass' : ir.overallScore >= 60 ? 'review' : 'critical'
        } />
        <MetricCard label="Risk Level" value={ir.overallRisk} variant={
          ir.overallRisk === 'LOW' ? 'pass' : ir.overallRisk === 'MEDIUM' ? 'review' : 'critical'
        } />
        <MetricCard label="Critical Findings" value={critCount} variant={critCount > 0 ? 'critical' : 'pass'} />
        <MetricCard label="High Findings" value={highCount} variant={highCount > 0 ? 'high' : 'pass'} />
        <MetricCard label="Medium Findings" value={medCount} variant={medCount > 0 ? 'review' : 'pass'} />
        <MetricCard label="Low Findings" value={lowCount} sub="findings" />
      </div>

      {/* Category scores + Decision side by side */}
      <div className="grid-2">
        {/* Category scores */}
        <Card>
          <CardHeader>
            <div>
              <div className="card-title">Category Scores</div>
              <div className="card-desc">Per-domain assurance breakdown</div>
            </div>
          </CardHeader>
          <CardBody>
            {ir.categoryScores.map(cat => <CategoryRow key={cat.category} cat={cat} />)}
            <div style={{ paddingTop: 12, borderTop: '2px solid var(--color-border)', marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>Overall</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 800, fontSize: 24, color: 'var(--color-text-primary)' }}>{ir.overallScore}</span>
                  <RiskBadge risk={ir.overallRisk} />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Decision panel */}
        <Card>
          <CardHeader>
            <div>
              <div className="card-title">Assurance Decision</div>
              <div className="card-desc">Based on findings and scores</div>
            </div>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            <div style={{ padding: '20px 20px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 6 }}>
                Assurance Decision
              </div>
              <div style={{
                fontSize: 32, fontWeight: 800, color:
                  ir.decision === 'ACCEPT' ? 'var(--color-pass-text)' :
                  ir.decision === 'REVIEW' ? 'var(--color-review-text)' : 'var(--color-critical-text)',
              }}>
                {ir.decision}
              </div>
            </div>

            <div style={{ padding: '0 20px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Reasons
              </div>
              {ir.decisionReasons.slice(0, 5).map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, paddingBottom: 6, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  <AlertCircle size={13} style={{ color: 'var(--color-review-icon)', flexShrink: 0, marginTop: 1 }} />
                  {r}
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--color-pass-bg)', borderTop: '1px solid var(--color-pass-border)', padding: '12px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-pass-text)', marginBottom: 6 }}>
                Verified
              </div>
              {ir.verifiedItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, paddingBottom: 4, fontSize: 12, color: 'var(--color-pass-text)' }}>
                  <CheckCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  {item}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Data metrics + Contributor risk */}
      <div className="grid-2">
        <Card>
          <CardHeader>
            <div className="card-title">Dataset Summary</div>
          </CardHeader>
          <CardBody>
            {v.dataset && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Total Samples', value: v.dataset.totalSamples },
                  { label: 'Valid Samples', value: v.dataset.validSamples },
                  { label: 'Suspicious Samples', value: v.dataset.suspiciousSamples },
                  { label: 'Exact Duplicate Groups', value: v.dataset.duplicateGroups.length },
                  { label: 'Near-Duplicate Clusters', value: v.dataset.nearDuplicateClusters.length },
                  { label: 'Label Anomalies', value: v.dataset.labelAnomalies },
                  { label: 'OOD Samples', value: v.dataset.oodSamples },
                  { label: 'Contributors', value: v.dataset.contributors.length },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="card-title">Contributor Risk</div>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-muted)' }}>
                  {['Contributor', 'Samples', 'Findings', 'Risk'].map(h => (
                    <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(v.dataset?.contributors ?? []).map(c => (
                  <tr key={c.contributorId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.contributorId}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--color-text-secondary)' }}>{c.sampleCount}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--color-text-secondary)' }}>{c.findingIds.length}</td>
                    <td style={{ padding: '10px 16px' }}><RiskBadge risk={c.riskLevel} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>

      {/* Recent Findings */}
      <Card>
        <CardHeader>
          <div className="card-title">Recent Findings</div>
          <Link to="/findings" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            View all <ArrowRight size={13} />
          </Link>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-muted)' }}>
                {['ID', 'Finding', 'Asset', 'Severity', 'Confidence', 'Action'].map(h => (
                  <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {v.findings.slice(0, 5).map(f => (
                <tr key={f.findingId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>{f.findingId}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--color-text-primary)', fontWeight: 500, maxWidth: 260 }}>{f.title}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--color-text-muted)', fontSize: 12 }}>{f.affectedAsset}</td>
                  <td style={{ padding: '10px 16px' }}><SeverityBadge severity={f.severity} /></td>
                  <td style={{ padding: '10px 16px', color: 'var(--color-text-secondary)' }}>{Math.round(f.confidence * 100)}%</td>
                  <td style={{ padding: '10px 16px' }}><Badge variant={f.recommendedAction === 'ACCEPT' ? 'pass' : f.recommendedAction === 'REVIEW' ? 'review' : 'quarantine'}>{f.recommendedAction}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Recent Audit Events */}
      <Card>
        <CardHeader>
          <div className="card-title">Recent Audit Events</div>
          <Link to="/audit" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            View all <ArrowRight size={13} />
          </Link>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {v.auditTrail.slice(-5).reverse().map(ev => (
            <div key={ev.eventId} style={{ display: 'flex', gap: 16, padding: '10px 20px', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}>
              {ev.status === 'OK'
                ? <CheckCircle size={14} style={{ color: 'var(--color-pass-icon)', flexShrink: 0 }} />
                : <XCircle size={14} style={{ color: 'var(--color-critical-icon)', flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{ev.action}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{ev.asset}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                {new Date(ev.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
