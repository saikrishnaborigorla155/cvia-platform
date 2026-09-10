// CVIA — UI Primitives
// Card, MetricCard, Badge, StatusBadge, Button, ProgressBar,
// DataTable, EmptyState, ScoreGauge, HashDisplay, Alert

import React from 'react';
import type { Severity, Decision, RiskLevel, RecommendedAction } from '../../types/cvia';

// ============================================================
// CARD
// ============================================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className = '', style }: CardProps) {
  return <div className={`card ${className}`} style={style}>{children}</div>;
}

export function CardHeader({ children, className = '' }: CardProps) {
  return <div className={`card-header ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }: CardProps) {
  return <div className={`card-body ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: CardProps) {
  return <div className={`card-footer ${className}`}>{children}</div>;
}

// ============================================================
// METRIC CARD
// ============================================================

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  variant?: 'default' | 'critical' | 'high' | 'review' | 'pass';
  icon?: React.ReactNode;
}

export function MetricCard({ label, value, sub, variant = 'default', icon }: MetricCardProps) {
  return (
    <div className={`metric-card ${variant}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="metric-label">{label}</span>
        {icon && <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>}
      </div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

// ============================================================
// BADGE
// ============================================================

type BadgeVariant = 'pass' | 'accept' | 'review' | 'quarantine' | 'critical' | 'high' | 'medium' | 'low' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({ children, variant = 'neutral', dot }: BadgeProps) {
  return (
    <span className={`badge ${variant}`}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />}
      {children}
    </span>
  );
}

// ============================================================
// STATUS BADGE — for Decision / RiskLevel
// ============================================================

export function DecisionBadge({ decision }: { decision: Decision }) {
  const map: Record<Decision, BadgeVariant> = {
    ACCEPT: 'pass', REVIEW: 'review', QUARANTINE: 'quarantine', UNKNOWN: 'neutral',
  };
  return <Badge variant={map[decision]}>{decision}</Badge>;
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const map: Record<RiskLevel, BadgeVariant> = {
    LOW: 'pass', MEDIUM: 'review', HIGH: 'high', CRITICAL: 'critical', UNKNOWN: 'neutral',
  };
  return <Badge variant={map[risk]}>{risk}</Badge>;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const map: Record<Severity, BadgeVariant> = {
    CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low', INFO: 'info',
  };
  return <Badge variant={map[severity]}>{severity}</Badge>;
}

export function ActionBadge({ action }: { action: RecommendedAction }) {
  const map: Record<RecommendedAction, BadgeVariant> = {
    ACCEPT: 'pass', REVIEW: 'review', QUARANTINE: 'quarantine',
  };
  return <Badge variant={map[action]}>{action}</Badge>;
}

// ============================================================
// BUTTON
// ============================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

export function Button({
  children, variant = 'secondary', size = 'md', icon, iconRight, loading, className = '', disabled, ...rest
}: ButtonProps) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  return (
    <button
      className={`btn btn-${variant} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="spinner sm" /> : icon}
      {children}
      {iconRight && !loading && iconRight}
    </button>
  );
}

// ============================================================
// PROGRESS BAR
// ============================================================

interface ProgressBarProps {
  label?: string;
  value: number; // 0-100
  variant?: 'pass' | 'review' | 'critical' | 'high' | 'brand';
  showValue?: boolean;
  suffix?: string;
}

export function ProgressBar({ label, value, variant = 'brand', showValue = true, suffix = '%' }: ProgressBarProps) {
  return (
    <div className="progress-container">
      {(label || showValue) && (
        <div className="progress-header">
          {label && <span className="progress-label">{label}</span>}
          {showValue && <span className="progress-value">{value}{suffix}</span>}
        </div>
      )}
      <div className="progress-track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`progress-fill ${variant}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// SCORE GAUGE
// ============================================================

interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

function scoreVariant(score: number): 'pass' | 'review' | 'high' | 'critical' {
  if (score >= 80) return 'pass';
  if (score >= 60) return 'review';
  if (score >= 40) return 'high';
  return 'critical';
}

export function ScoreGauge({ score, label, size = 'md' }: ScoreGaugeProps) {
  const variant = scoreVariant(score);
  const px = size === 'sm' ? 60 : size === 'lg' ? 100 : 80;
  return (
    <div className="score-gauge-wrapper">
      <div
        className={`score-circle ${variant}`}
        style={{ width: px, height: px }}
        role="img"
        aria-label={`Score: ${score} out of 100`}
      >
        <span className="score-number">{score}</span>
        <span className="score-label" style={{ fontSize: 9 }}>/ 100</span>
      </div>
      {label && <span className="text-xs text-muted font-medium">{label}</span>}
    </div>
  );
}

// ============================================================
// HASH DISPLAY
// ============================================================

interface HashDisplayProps {
  hash: string;
  maxLength?: number;
  copyable?: boolean;
}

export function HashDisplay({ hash, maxLength = 42 }: HashDisplayProps) {
  const display = hash.length > maxLength ? `${hash.slice(0, maxLength)}…` : hash;
  return (
    <span className="hash-display" title={hash}>
      <span className="hash-value">{display}</span>
    </span>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {description && <p className="empty-state-desc">{description}</p>}
      {action}
    </div>
  );
}

// ============================================================
// UNAVAILABLE BANNER
// ============================================================

interface UnavailableBannerProps {
  title: string;
  description?: string;
  available?: string[];
  unavailable?: string[];
  icon?: React.ReactNode;
}

export function UnavailableBanner({ title, description, available, unavailable, icon }: UnavailableBannerProps) {
  return (
    <div className="unavailable-banner">
      <div className="unavailable-banner-icon">{icon}</div>
      <div className="unavailable-banner-content">
        <div className="unavailable-banner-title">{title}</div>
        {description && <div className="unavailable-banner-desc">{description}</div>}
        {available && available.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {available.map(a => (
              <div key={a} style={{ fontSize: 12, color: 'var(--color-pass-text)' }}>✓ {a}</div>
            ))}
          </div>
        )}
        {unavailable && unavailable.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {unavailable.map(u => (
              <div key={u} style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>✗ {u}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// DEMO BANNER
// ============================================================

export function DemoBanner({ label = 'DEMO / LOCAL SIMULATION' }: { label?: string }) {
  return (
    <div className="demo-banner" role="status">
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
      {label}
    </div>
  );
}

// ============================================================
// ALERT
// ============================================================

interface AlertProps {
  variant: 'info' | 'warning' | 'danger' | 'success';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function Alert({ variant, children, icon }: AlertProps) {
  return (
    <div className={`alert ${variant}`} role="alert">
      {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
      <div>{children}</div>
    </div>
  );
}

// ============================================================
// DATA TABLE
// ============================================================

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, rows, keyExtractor, emptyMessage = 'No data' }: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={keyExtractor(row)}>
              {columns.map(col => (
                <td key={col.key}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// SECTION HEADER
// ============================================================

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export function SectionHeader({ title, description, actions, badge }: SectionHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-inner">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="page-title">{title}</h2>
            {badge}
          </div>
          {description && <p className="page-subtitle">{description}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </div>
  );
}
