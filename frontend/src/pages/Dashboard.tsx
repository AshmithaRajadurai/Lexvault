import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  UploadCloud,
  ArrowUpRight,
  RefreshCw,
  Cpu,
  Layers,
} from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { TamperBadge } from '../components/TamperBadge';
import { EvidenceUploadModal } from '../components/EvidenceUploadModal';
import { getCases, getEvidence, CaseData, EvidenceData } from '../services/api';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [casesData, evidenceData] = await Promise.all([getCases(), getEvidence()]);
      setCases(casesData);
      setEvidenceList(evidenceData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCases = cases.length;
  const totalEvidence = evidenceList.length;
  const verifiedCount = evidenceList.filter((e) => e.status === 'VERIFIED').length;
  const tamperedCount = evidenceList.filter((e) => e.status === 'TAMPERED').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-dark-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight flex items-center gap-2">
            Forensic Custody Ledger
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Privacy-preserving evidence repository powered by Zero-Knowledge commitments & Ethereum smart contracts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-dark-700 bg-dark-900 hover:bg-dark-800 text-slate-300 transition-all hover:text-white"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Intake Evidence</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Active Cases"
          value={totalCases}
          subtitle="Open investigative matters"
          icon={<FolderLock className="w-5 h-5 text-cyan-400" />}
          variant="cyan"
        />
        <StatsCard
          title="Evidence Artifacts"
          value={totalEvidence}
          subtitle="Encrypted on-disk vaults"
          icon={<FileCheck2 className="w-5 h-5 text-purple-400" />}
          variant="amber"
        />
        <StatsCard
          title="Verified Records"
          value={verifiedCount}
          subtitle="Immutable chain confirmed"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
          variant="emerald"
        />
        <StatsCard
          title="Tamper Alerts"
          value={tamperedCount}
          subtitle={tamperedCount > 0 ? 'CRITICAL DISCREPANCIES' : 'Zero compromises'}
          icon={<ShieldAlert className="w-5 h-5 text-tampered-400" />}
          variant="crimson"
        />
      </div>

      {/* Architecture System Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-dark-900 border border-dark-750 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200 font-mono">Solidity Ledger</div>
            <div className="text-[11px] text-slate-400">LexVaultRegistry (Chain ID 31337)</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-dark-750 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-950/80 border border-purple-500/30 text-purple-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200 font-mono">ZK-SNARK Prover</div>
            <div className="text-[11px] text-slate-400">Poseidon BN128 Groth16 Circuit</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-dark-750 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200 font-mono">Storage Engine</div>
            <div className="text-[11px] text-slate-400">AES-256-GCM Encrypted Disk Vault</div>
          </div>
        </div>
      </div>

      {/* Recent Evidence Table */}
      <div className="rounded-2xl border border-dark-750 bg-dark-900 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-dark-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-mono text-white">Recent Evidence Intakes</h3>
            <p className="text-xs text-slate-400">Latest cryptographic custody registrations</p>
          </div>
          <Link
            to="/vault"
            className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            View All Vaults
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-dark-950/80 text-slate-400 uppercase tracking-wider border-b border-dark-800">
              <tr>
                <th className="px-6 py-3">Evidence ID</th>
                <th className="px-6 py-3">File / Case</th>
                <th className="px-6 py-3">SHA-256 Checksum</th>
                <th className="px-6 py-3">ZK Commitment</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800/80 text-slate-300">
              {evidenceList.slice(0, 6).map((item) => (
                <tr key={item.evidenceId} className="hover:bg-dark-850/60 transition-colors">
                  <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                    {item.evidenceId}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-200">{item.filename}</div>
                    <div className="text-[10px] text-slate-500">{item.caseId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-cyan-400/90 font-mono bg-dark-950 px-2 py-1 rounded border border-dark-750 select-all text-[11px]">
                      {item.sha256.slice(0, 10)}...{item.sha256.slice(-8)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-purple-400/90 font-mono bg-dark-950 px-2 py-1 rounded border border-dark-750 select-all text-[11px]">
                      {item.commitment.slice(0, 10)}...{item.commitment.slice(-6)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TamperBadge status={item.status} size="sm" />
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link
                      to="/vault"
                      className="px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 transition-all text-[11px]"
                    >
                      Audit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Upload Modal */}
      <EvidenceUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
