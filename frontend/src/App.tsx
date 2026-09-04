import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { EvidenceVault } from './pages/EvidenceVault';
import { TamperAudit } from './pages/TamperAudit';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans">
          {/* Top Navigation & Role Switcher */}
          <Navbar />

          {/* Main Content Viewport */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vault" element={<EvidenceVault />} />
              <Route path="/audit" element={<TamperAudit />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Forensic Footer */}
          <footer className="border-t border-dark-800 bg-dark-900/60 py-6 text-center text-xs font-mono text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>LEXVAULT Security Core • Zero-Knowledge Chain of Custody</span>
              </div>
              <div className="text-slate-600">
                AES-256-GCM • Circom Groth16 • Solidity Hardhat Ledger
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
