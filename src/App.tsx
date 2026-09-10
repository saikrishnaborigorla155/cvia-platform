// CVIA — App Router
// SIH26228 · Ministry of Defence / DGIS

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AssuranceProvider } from './context/AssuranceContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { Landing } from './pages/Landing';
import { Console } from './pages/Console';
import { Verify } from './pages/Verify';
import { DataIntegrity } from './pages/DataIntegrity';
import { ModelIntegrity } from './pages/ModelIntegrity';
import { Provenance } from './pages/Provenance';
import { InferenceIntegrity } from './pages/InferenceIntegrity';
import { DistributionShift } from './pages/DistributionShift';
import { Findings } from './pages/Findings';
import { Audit } from './pages/Audit';

export default function App() {
  return (
    <AssuranceProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing page — no layout shell */}
          <Route path="/" element={<Landing />} />

          {/* All other pages use AppLayout (sidebar + topbar) */}
          <Route element={<AppLayout />}>
            <Route path="/console" element={<Console />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/data" element={<DataIntegrity />} />
            <Route path="/model" element={<ModelIntegrity />} />
            <Route path="/provenance" element={<Provenance />} />
            <Route path="/inference" element={<InferenceIntegrity />} />
            <Route path="/drift" element={<DistributionShift />} />
            <Route path="/findings" element={<Findings />} />
            <Route path="/audit" element={<Audit />} />
            {/* Redirect unknown paths to console */}
            <Route path="*" element={<Navigate to="/console" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AssuranceProvider>
  );
}
