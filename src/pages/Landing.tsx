// CVIA — Landing Page

import { Link } from 'react-router-dom';
import {
  ShieldCheck, Database, Cpu, GitBranch, TrendingUp, Zap,
  AlertTriangle, Lock, ArrowRight, CheckCircle2, Wifi,
} from 'lucide-react';

const capabilities = [
  { icon: <Database size={20} />, label: 'Data Integrity', desc: 'Detect duplicates, label anomalies, contributor risk, OOD injection' },
  { icon: <Cpu size={20} />, label: 'Model Integrity', desc: 'Hash verification, behavioural fingerprint, access-level transparency' },
  { icon: <GitBranch size={20} />, label: 'Provenance Chain', desc: 'Cryptographic binding: contributor → dataset → model → inference → output' },
  { icon: <TrendingUp size={20} />, label: 'Distribution Shift', desc: 'Statistical comparison — brightness, contrast, class, contributor distributions' },
  { icon: <Zap size={20} />, label: 'Inference Integrity', desc: 'Tamper detection, replay protection, model substitution detection' },
  { icon: <AlertTriangle size={20} />, label: 'Evidence & Findings', desc: 'Structured findings with severity, confidence, evidence, and recommended actions' },
];

const principles = [
  'Collect evidence — do not blindly trust artifacts',
  'Verify integrity cryptographically',
  'Identify anomalies statistically',
  'Bind input → model → output immutably',
  'Assess risk with traceable scores',
  'Make an auditable, explainable decision',
];

export function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-surface)' }}>
      {/* Nav */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 60, borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)', position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: 'var(--color-brand-primary)',
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <ShieldCheck size={17} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>CVIA</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SIH26228 · DGIS
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
            background: 'var(--color-info-bg)', border: '1px solid var(--color-info-border)',
            borderRadius: 4, fontSize: 11, fontWeight: 600, color: 'var(--color-info-text)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            <Wifi size={10} /> Offline Mode
          </div>
          <Link to="/console" style={{
            padding: '7px 18px', background: 'var(--color-brand-primary)', color: 'white',
            borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            Open Console <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '80px 48px 60px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            padding: '3px 10px', background: 'var(--color-brand-subtle)',
            border: '1px solid var(--color-border-brand)', borderRadius: 4,
            fontSize: 11, fontWeight: 700, color: 'var(--color-brand-primary)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Smart India Hackathon 2026 · SIH26228
          </span>
          <span style={{
            padding: '3px 10px', background: 'var(--color-bg-muted)',
            border: '1px solid var(--color-border)', borderRadius: 4,
            fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Ministry of Defence · DGIS
          </span>
        </div>

        <h1 style={{
          fontSize: 42, fontWeight: 800, color: 'var(--color-text-primary)',
          lineHeight: 1.15, maxWidth: 820, marginBottom: 20,
        }}>
          Trustworthy Computer Vision{' '}
          <span style={{ color: 'var(--color-brand-primary)' }}>Integrity Assurance</span>
        </h1>

        <p style={{
          fontSize: 17, color: 'var(--color-text-secondary)', lineHeight: 1.7,
          maxWidth: 680, marginBottom: 36,
        }}>
          Verify the integrity of computer vision datasets, models, and inference outputs
          across multi-contributor pipelines. Collect evidence. Detect anomalies. Make
          auditable decisions. Operate completely offline.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/verify" style={{
            padding: '11px 24px', background: 'var(--color-brand-primary)', color: 'white',
            borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <ShieldCheck size={16} /> Start Verification
          </Link>
          <Link to="/console" style={{
            padding: '11px 24px', background: 'white', color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border-strong)', borderRadius: 6,
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            View Dashboard <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Warning banner */}
      <section style={{ padding: '0 48px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          background: 'var(--color-review-bg)', border: '1px solid var(--color-review-border)',
          borderRadius: 8, padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <Lock size={16} style={{ color: 'var(--color-review-text)', marginTop: 2, flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: 13, color: 'var(--color-review-text)' }}>
              Do not blindly trust a contributed computer-vision pipeline.
            </strong>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.6 }}>
              Contributed datasets may contain poisoned samples, mislabelled images, or adversarial triggers.
              Models may be modified or substituted. Inference outputs may be tampered or replayed.
              CVIA provides structured evidence to support assurance decisions — it is not an oracle.
            </p>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section style={{ padding: '0 48px 60px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 24 }}>
          Five Assurance Capability Areas
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {capabilities.map(cap => (
            <div key={cap.label} style={{
              background: 'white', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '20px 20px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 36, height: 36, background: 'var(--color-brand-subtle)',
                border: '1px solid var(--color-border-brand)',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-brand-primary)', flexShrink: 0,
              }}>
                {cap.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                  {cap.label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {cap.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Principle */}
      <section style={{
        padding: '40px 48px 60px', maxWidth: 1100, margin: '0 auto',
        borderTop: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
              Assurance Workflow
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
              Every analyst should be able to answer: what was checked, what was found,
              which asset is affected, what evidence supports the finding, how confident
              is the system, what should I do, and what can the system NOT determine?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {principles.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle2 size={15} style={{ color: 'var(--color-pass-icon)', marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
              Decision Framework
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
              Every verification run produces a deterministic, traceable assurance score
              and a three-value decision.
            </p>
            {[
              { label: 'ACCEPT', color: 'var(--color-pass-text)', bg: 'var(--color-pass-bg)', border: 'var(--color-pass-border)', desc: 'Score ≥ 80 · No critical or high findings' },
              { label: 'REVIEW', color: 'var(--color-review-text)', bg: 'var(--color-review-bg)', border: 'var(--color-review-border)', desc: 'Score 60–79 · High findings present' },
              { label: 'QUARANTINE', color: 'var(--color-critical-text)', bg: 'var(--color-critical-bg)', border: 'var(--color-critical-border)', desc: 'Score < 60 · Critical findings present' },
            ].map(d => (
              <div key={d.label} style={{
                background: d.bg, border: `1px solid ${d.border}`, borderRadius: 8,
                padding: '12px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: d.color }}>{d.label}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{d.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)', padding: '20px 48px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--color-bg-muted)',
      }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          CVIA — SIH26228 · Ministry of Defence / DGIS · MVP v1.0
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          Completely Offline · No Cloud Dependencies · Air-Gap Compatible
        </span>
      </footer>
    </div>
  );
}
