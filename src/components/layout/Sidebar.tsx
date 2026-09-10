// CVIA — Sidebar Navigation Component

import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShieldCheck, Database, Cpu,
  GitBranch, TrendingUp, Zap, AlertTriangle,
  ClipboardList, Wifi, CheckCircle2,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { path: '/console', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
      { path: '/verify', label: 'Verify', icon: <ShieldCheck size={15} /> },
    ],
  },
  {
    label: 'Assurance',
    items: [
      { path: '/data', label: 'Data Integrity', icon: <Database size={15} /> },
      { path: '/model', label: 'Model Integrity', icon: <Cpu size={15} /> },
      { path: '/provenance', label: 'Provenance', icon: <GitBranch size={15} /> },
      { path: '/drift', label: 'Distribution Shift', icon: <TrendingUp size={15} /> },
      { path: '/inference', label: 'Inference Integrity', icon: <Zap size={15} /> },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { path: '/findings', label: 'Findings', icon: <AlertTriangle size={15} /> },
      { path: '/audit', label: 'Audit Trail', icon: <ClipboardList size={15} /> },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <ShieldCheck size={18} />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">CVIA</span>
            <span className="sidebar-logo-sub">SIH26228 · DGIS</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navSections.map((section) => (
          <div key={section.label} className="mb-1">
            <span className="sidebar-section-label">{section.label}</span>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-nav-item${isActive || location.pathname === item.path ? ' active' : ''}`
                }
                aria-current={location.pathname === item.path ? 'page' : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer Status */}
      <div className="sidebar-footer">
        <div className="sidebar-status-badge">
          <Wifi size={11} />
          <div>
            <div className="sidebar-status-text">Offline Mode</div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2" style={{ paddingLeft: 2 }}>
          <div className="sidebar-status-dot" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="sidebar-status-text" style={{ textTransform: 'none', fontSize: 11, color: 'var(--color-text-muted)' }}>
              Local Assurance Engine
            </span>
            <span className="sidebar-status-sub">System Ready</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2" style={{ paddingLeft: 2 }}>
          <CheckCircle2 size={11} style={{ color: 'var(--color-pass-icon)' }} />
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>SIH26228 MVP v1.0</span>
        </div>
      </div>
    </aside>
  );
}
