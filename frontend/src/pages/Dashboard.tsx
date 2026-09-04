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
import { TruncatedHash } from '../components/TruncatedHash';
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight flex items-center gap-2.5">
            Forensic Custody Ledger
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-mono">
            Privacy-preserving evidence repository powered by Zero-Knowledge commitments & Ethereum smart contracts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Intake Evidence</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Cases"
          value={totalCases}
          subtitle="Open investigative matters"
          icon={<FolderLock className="w-5 h-5 text-blue-600" />}
          variant="cyan"
        />
        <StatsCard
          title="Evidence Artifacts"
          value={totalEvidence}
          subtitle="Sealed on-disk vaults"
          icon={<FileCheck2 className="w-5 h-5 text-purple-600" />}
          variant="amber"
        />
        <StatsCard
          title="Verified Records"
          value={verifiedCount}
          subtitle="Immutable chain confirmed"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
          variant="emerald"
        />
        <StatsCard
          title="Tamper Alerts"
          value={tamperedCount}
          subtitle={tamperedCount > 0 ? 'CRITICAL DISCREPANCIES' : 'Zero compromises'}
          icon={<ShieldAlert className="w-5 h-5 text-rose-600" />}
          variant="crimson"
        />
      </div>

      {/* Architecture System Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 font-mono">Solidity Ledger</div>
            <div className="text-[11px] text-slate-500 font-mono">LexVaultRegistry (Chain ID 31337)</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 font-mono">ZK-SNARK Prover</div>
            <div className="text-[11px] text-slate-500 font-mono">Poseidon BN128 Groth16 Circuit</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 font-mono">Storage Engine</div>
            <div className="text-[11px] text-slate-500 font-mono">AES-256-GCM (Up to 200MB Video)</div>
          </div>
        </div>
      </div>

      {/* Recent Evidence Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-900 uppercase tracking-wider">
              Recent Evidence Intakes
            </h3>
            <p className="text-xs text-slate-500 font-mono">Latest cryptographic custody registrations</p>
          </div>
          <Link
            to="/vault"
            className="text-xs font-mono font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View All Vaults
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider border-b border-slate-200 font-bold">
              <tr>
                <th className="px-6 py-3">Evidence ID</th>
                <th className="px-6 py-3">File / Case</th>
                <th className="px-6 py-3">SHA-256 Checksum</th>
                <th className="px-6 py-3">ZK Commitment</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {evidenceList.slice(0, 6).map((item) => (
                <tr key={item.evidenceId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                    {item.evidenceId}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{item.filename}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.caseId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <TruncatedHash hash={item.sha256} variant="blue" />
                  </td>
                  <td className="px-6 py-4">
                    <TruncatedHash hash={item.commitment} variant="purple" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TamperBadge status={item.status} size="sm" />
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link
                      to="/vault"
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all text-[11px] font-semibold"
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

