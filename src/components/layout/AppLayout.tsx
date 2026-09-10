// CVIA — AppLayout (Main shell)

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAssurance } from '../../context/AssuranceContext';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export function AppLayout() {
  const { state } = useAssurance();
  const v = state.activeVerification;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar
          datasetId={v?.dataset?.datasetId}
          modelId={v?.model?.modelId}
          verificationId={v?.verificationId}
        />
        <main className="page-content" id="main-content" tabIndex={-1}>
          <ErrorBoundary fallbackTitle="Verification temporarily unavailable">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
