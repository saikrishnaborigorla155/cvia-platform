// CVIA — Findings Page

import { useState } from 'react';
import { AlertTriangle, Filter } from 'lucide-react';
import { useAssurance } from '../context/AssuranceContext';
import {
  SectionHeader, DemoBanner, EmptyState, MetricCard,
} from '../components/ui/index';
import { FindingCard } from '../components/domain/FindingCard';
import type { Severity } from '../types/cvia';

type FilterSeverity = 'ALL' | Severity;
type FilterCategory = 'ALL' | 'DATA' | 'MODEL' | 'PROVENANCE' | 'INFERENCE' | 'DISTRIBUTION';

export function Findings() {
  const { state } = useAssurance();
  const v = state.activeVerification;
  const findings = v?.findings ?? [];

  const [severityFilter, setSeverityFilter] = useState<FilterSeverity>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('ALL');

  const filtered = findings.filter(f => {
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
    return true;
  });

  const counts = {
    CRITICAL: findings.filter(f => f.severity === 'CRITICAL').length,
    HIGH: findings.filter(f => f.severity === 'HIGH').length,
    MEDIUM: findings.filter(f => f.severity === 'MEDIUM').length,
    LOW: findings.filter(f => f.severity === 'LOW').length,
  };

  if (findings.length === 0) {
    return (
      <div>
        <SectionHeader title="Findings" description="No findings generated yet." />
        <EmptyState icon={<AlertTriangle size={24} />} title="No findings" description="Run a verification to generate findings." />
      </div>
    );
  }

  return (
    <div className="section-grid">
      {v?.isSimulation && <DemoBanner />}

      <SectionHeader
        title="Findings"
        description={`${findings.length} findings generated · ${filtered.length} shown after filters`}
      />

      {/* Severity summary */}
      <div className="metric-grid">
        <MetricCard label="Total Findings" value={findings.length} />
        <MetricCard label="Critical" value={counts.CRITICAL} variant={counts.CRITICAL > 0 ? 'critical' : 'pass'} />
        <MetricCard label="High" value={counts.HIGH} variant={counts.HIGH > 0 ? 'high' : 'pass'} />
        <MetricCard label="Medium" value={counts.MEDIUM} variant={counts.MEDIUM > 0 ? 'review' : 'pass'} />
        <MetricCard label="Low" value={counts.LOW} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', padding: '12px 16px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Severity</span>
        </div>
        {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as FilterSeverity[]).map(s => (
          <button
            key={s}
            className={`btn btn-sm ${severityFilter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSeverityFilter(s)}
          >
            {s} {s !== 'ALL' && s in counts ? `(${counts[s as keyof typeof counts]})` : ''}
          </button>
        ))}

        <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />

        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</span>
        {(['ALL', 'DATA', 'MODEL', 'PROVENANCE', 'INFERENCE', 'DISTRIBUTION'] as FilterCategory[]).map(c => (
          <button
            key={c}
            className={`btn btn-sm ${categoryFilter === c ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setCategoryFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Finding cards */}
      {filtered.length === 0 ? (
        <EmptyState icon={<AlertTriangle size={24} />} title="No findings match filters" description="Adjust your severity or category filters." />
      ) : (
        <div className="section-grid">
          {filtered.map(f => (
            <FindingCard
              key={f.findingId}
              finding={f}
              onAction={(id, action) => {
                console.log(`Finding ${id} action: ${action}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
