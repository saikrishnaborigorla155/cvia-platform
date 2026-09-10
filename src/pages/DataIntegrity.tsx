// CVIA — Data Integrity Page

import { useState } from 'react';
import { Database } from 'lucide-react';
import { useAssurance } from '../context/AssuranceContext';
import {
  Card, CardHeader, CardBody, MetricCard, SectionHeader, DemoBanner,
  Badge, RiskBadge, ProgressBar, EmptyState, HashDisplay,
} from '../components/ui/index';

export function DataIntegrity() {
  const { state } = useAssurance();
  const v = state.activeVerification;
  const ds = v?.dataset;
  const [activeTab, setActiveTab] = useState<'overview' | 'duplicates' | 'labels' | 'contributors'>('overview');

  if (!ds) {
    return (
      <div>
        <SectionHeader title="Data Integrity" description="No dataset loaded. Run a verification first." />
        <EmptyState icon={<Database size={24} />} title="No dataset analysed" description="Load a dataset from the Verify page and run verification." />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'duplicates', label: `Duplicates (${ds.duplicateGroups.length + ds.nearDuplicateClusters.length})` },
    { id: 'labels', label: `Labels & Classes` },
    { id: 'contributors', label: `Contributors (${ds.contributors.length})` },
  ] as const;

  return (
    <div className="section-grid">
      {v?.isSimulation && <DemoBanner />}

      <SectionHeader
        title="Data Integrity"
        description={`${ds.datasetId} · ${ds.format} · ${ds.totalSamples.toLocaleString()} samples`}
        badge={<Badge variant="neutral">{ds.datasetId}</Badge>}
      />

      {/* Metrics */}
      <div className="metric-grid">
        <MetricCard label="Total Samples" value={ds.totalSamples.toLocaleString()} />
        <MetricCard label="Valid Samples" value={ds.validSamples.toLocaleString()} variant="pass" />
        <MetricCard label="Suspicious" value={ds.suspiciousSamples} variant={ds.suspiciousSamples > 0 ? 'review' : 'pass'} />
        <MetricCard label="Duplicate Groups" value={ds.duplicateGroups.length} variant={ds.duplicateGroups.length > 0 ? 'review' : 'pass'} />
        <MetricCard label="Near-Dup Clusters" value={ds.nearDuplicateClusters.length} variant={ds.nearDuplicateClusters.length > 0 ? 'review' : 'pass'} />
        <MetricCard label="Label Anomalies" value={ds.labelAnomalies} variant={ds.labelAnomalies > 10 ? 'high' : 'review'} />
        <MetricCard label="OOD Samples" value={ds.oodSamples} variant={ds.oodSamples > 0 ? 'review' : 'pass'} />
        <MetricCard label="Contributors" value={ds.contributors.length} />
      </div>

      {/* Dataset hash */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-4">
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', minWidth: 100 }}>Dataset ID</span>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 13 }}>{ds.datasetId}</span>
            <span style={{ marginLeft: 'auto' }} />
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', minWidth: 60 }}>Hash</span>
            <HashDisplay hash={ds.hash} />
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--color-border)', paddingBottom: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className="btn btn-ghost btn-sm"
            style={{
              borderRadius: '6px 6px 0 0', borderBottom: activeTab === tab.id ? '2px solid var(--color-brand-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === tab.id ? 600 : 400, paddingBottom: 8,
            }}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid-2">
          <Card>
            <CardHeader><div className="card-title">Class Distribution</div></CardHeader>
            <CardBody>
              {ds.classDistribution.map(cls => (
                <div key={cls.className} style={{ marginBottom: 14 }}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{cls.className}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{cls.count} ({cls.percentage.toFixed(1)}%)</span>
                  </div>
                  <ProgressBar value={cls.percentage} variant="brand" showValue={false} />
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><div className="card-title">Integrity Summary</div></CardHeader>
            <CardBody>
              {[
                { label: 'Exact duplicates detected', value: ds.duplicateGroups.length > 0, count: ds.duplicateGroups.reduce((a, g) => a + g.samples.length, 0) },
                { label: 'Near-duplicate clusters', value: ds.nearDuplicateClusters.length > 0, count: ds.nearDuplicateClusters.length },
                { label: 'Label anomalies found', value: ds.labelAnomalies > 0, count: ds.labelAnomalies },
                { label: 'OOD samples detected', value: ds.oodSamples > 0, count: ds.oodSamples },
                { label: 'Contributor risk elevated', value: ds.contributors.some(c => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL'), count: ds.contributors.filter(c => c.riskLevel === 'HIGH').length },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: row.value ? 'var(--color-review-text)' : 'var(--color-pass-text)' }}>
                    {row.value ? `⚠ ${row.count}` : '✓ None'}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Duplicates tab */}
      {activeTab === 'duplicates' && (
        <div className="section-grid">
          <Card>
            <CardHeader>
              <div><div className="card-title">Exact Duplicate Groups</div><div className="card-desc">SHA-256 hash collision</div></div>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              {ds.duplicateGroups.length === 0
                ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>No exact duplicates detected</div>
                : ds.duplicateGroups.map(g => (
                  <div key={g.groupId} style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{g.groupId}</span>
                      <RiskBadge risk={g.riskLevel} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                      <HashDisplay hash={g.hash} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {g.samples.map(s => (
                        <span key={s.sampleId} style={{ fontSize: 11, background: 'var(--color-bg-muted)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '2px 8px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {s.filename} ({s.contributorId})
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              }
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div><div className="card-title">Near-Duplicate Clusters</div><div className="card-desc">Perceptual hash — Hamming distance</div></div>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              {ds.nearDuplicateClusters.map(c => (
                <div key={c.clusterId} style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.clusterId}</span>
                    <RiskBadge risk={c.riskLevel} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                    Max similarity: {(c.maxSimilarity * 100).toFixed(0)}% · Avg: {(c.averageSimilarity * 100).toFixed(0)}%
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {c.samples.map(s => (
                      <span key={s.sampleId} style={{ fontSize: 11, background: 'var(--color-bg-muted)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '2px 8px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {s.filename} ({s.contributorId})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Labels tab */}
      {activeTab === 'labels' && (
        <Card>
          <CardHeader><div className="card-title">Class Distribution Analysis</div></CardHeader>
          <CardBody style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-muted)' }}>
                  {['Class', 'Count', 'Observed %', 'Reference %', 'Deviation', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ds.classDistribution.map(cls => (
                  <tr key={cls.className} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>{cls.className}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--color-text-secondary)' }}>{cls.count}</td>
                    <td style={{ padding: '10px 16px' }}>{cls.percentage.toFixed(1)}%</td>
                    <td style={{ padding: '10px 16px', color: 'var(--color-text-muted)' }}>{cls.referencePercentage?.toFixed(1)}%</td>
                    <td style={{ padding: '10px 16px', color: (cls.deviation ?? 0) > 10 ? 'var(--color-review-text)' : 'var(--color-text-secondary)' }}>
                      {cls.deviation !== undefined ? `${cls.deviation > 0 ? '+' : ''}${cls.deviation.toFixed(1)}pp` : '—'}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <Badge variant={(cls.deviation ?? 0) > 10 ? 'review' : 'pass'}>
                        {(cls.deviation ?? 0) > 10 ? 'Anomalous' : 'Normal'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {/* Contributors tab */}
      {activeTab === 'contributors' && (
        <div className="section-grid">
          <Card>
            <CardHeader><div className="card-title">Contributor Risk Summary</div></CardHeader>
            <CardBody style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-muted)' }}>
                    {['Contributor', 'Samples', 'Dup Rate', 'Near-Dup', 'Label Anom', 'OOD', 'Risk Score', 'Risk'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ds.contributors.map(c => (
                    <tr key={c.contributorId} style={{ borderBottom: '1px solid var(--color-border)', background: c.riskLevel === 'HIGH' ? 'var(--color-high-bg)' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{c.contributorId}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>{c.sampleCount}</td>
                      <td style={{ padding: '10px 12px', color: c.duplicateRate > 0 ? 'var(--color-review-text)' : 'var(--color-text-muted)' }}>{(c.duplicateRate * 100).toFixed(1)}%</td>
                      <td style={{ padding: '10px 12px', color: c.nearDuplicateRate > 0.05 ? 'var(--color-review-text)' : 'var(--color-text-muted)' }}>{(c.nearDuplicateRate * 100).toFixed(1)}%</td>
                      <td style={{ padding: '10px 12px', color: c.labelAnomalyRate > 0.05 ? 'var(--color-review-text)' : 'var(--color-text-muted)' }}>{(c.labelAnomalyRate * 100).toFixed(1)}%</td>
                      <td style={{ padding: '10px 12px', color: c.oodRate > 0 ? 'var(--color-review-text)' : 'var(--color-text-muted)' }}>{(c.oodRate * 100).toFixed(1)}%</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: c.riskScore > 60 ? 'var(--color-critical-text)' : c.riskScore > 30 ? 'var(--color-review-text)' : 'var(--color-text-primary)' }}>{c.riskScore}</td>
                      <td style={{ padding: '10px 12px' }}><RiskBadge risk={c.riskLevel} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>

          {/* C07 detail */}
          {ds.contributors.filter(c => c.riskLevel === 'HIGH').map(c => (
            <Card key={c.contributorId}>
              <CardHeader>
                <div>
                  <div className="card-title">Contributor {c.contributorId} — Risk Factor Detail</div>
                  <div className="card-desc">{c.name}</div>
                </div>
                <RiskBadge risk={c.riskLevel} />
              </CardHeader>
              <CardBody>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Risk Factors</div>
                  {c.riskFactors.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13, color: 'var(--color-review-text)' }}>
                      <span>⚠</span><span>{f}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Label Distribution</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Class', 'Count', 'Observed %', 'Reference %', 'Deviation'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {c.labelDistribution.map(ld => (
                      <tr key={ld.className} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>{ld.className}</td>
                        <td style={{ padding: '7px 10px', color: 'var(--color-text-secondary)' }}>{ld.count}</td>
                        <td style={{ padding: '7px 10px', color: (ld.deviation ?? 0) > 10 ? 'var(--color-critical-text)' : 'inherit', fontWeight: (ld.deviation ?? 0) > 10 ? 700 : 400 }}>{ld.percentage.toFixed(1)}%</td>
                        <td style={{ padding: '7px 10px', color: 'var(--color-text-muted)' }}>{ld.referencePercentage?.toFixed(1)}%</td>
                        <td style={{ padding: '7px 10px', color: (ld.deviation ?? 0) > 10 ? 'var(--color-critical-text)' : 'var(--color-text-muted)', fontWeight: (ld.deviation ?? 0) > 10 ? 700 : 400 }}>
                          {(ld.deviation ?? 0) > 0 ? '+' : ''}{(ld.deviation ?? 0).toFixed(1)}pp
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
