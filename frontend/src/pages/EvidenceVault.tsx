import React, { useState, useEffect } from 'react';
import {
  Search,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Upload,
} from 'lucide-react';
import { TamperBadge } from '../components/TamperBadge';
import { CustodyTimeline } from '../components/CustodyTimeline';
import { ZkProofCard } from '../components/ZkProofCard';
import {
  getEvidence,
  getEvidenceDetails,
  getCases,
  recordCustody,
  checkFile,
  EvidenceData,
  CustodyEventData,
  CaseData,
} from '../services/api';

export const EvidenceVault: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<EvidenceData[]>([]);
  const [cases, setCases] = useState<CaseData[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected item inspection drawer
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceData | null>(null);
  const [custodyLogs, setCustodyLogs] = useState<CustodyEventData[]>([]);
  const [onChainStatus, setOnChainStatus] = useState<boolean>(true);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Custody log action append
  const [newAction, setNewAction] = useState('VERIFIED');
  const [isAppendingAction, setIsAppendingAction] = useState(false);

  // Re-verification file check inside drawer
  const [checkFileLoading, setCheckFileLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evList, casesList] = await Promise.all([getEvidence(), getCases()]);
      setEvidenceList(evList);
      setCases(casesList);
      if (evList.length > 0 && !selectedEvidence) {
        handleInspect(evList[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInspect = async (item: EvidenceData) => {
    setSelectedEvidence(item);
    setDrawerLoading(true);
    setCheckResult(null);
    try {
      const details = await getEvidenceDetails(item.evidenceId);
      setCustodyLogs(details.custodyEvents || []);
      setOnChainStatus(details.onChainVerified);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleAddCustody = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvidence) return;
    setIsAppendingAction(true);
    try {
      await recordCustody(selectedEvidence.evidenceId, newAction);
      const details = await getEvidenceDetails(selectedEvidence.evidenceId);
      setCustodyLogs(details.custodyEvents || []);
    } finally {
      setIsAppendingAction(false);
    }
  };

  const handleReverifyFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedEvidence) return;
    setCheckFileLoading(true);
    setCheckResult(null);
    try {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      formData.append('evidenceId', selectedEvidence.evidenceId);
      const result = await checkFile(formData);
      setCheckResult(result);
    } catch (err: any) {
      setCheckResult({
        status: 'TAMPERED',
        match: false,
        error: err.response?.data?.error || err.message,
      });
    } finally {
      setCheckFileLoading(false);
    }
  };

  const filteredEvidence = evidenceList.filter((item) => {
    const matchesCase = selectedCaseId === 'ALL' || item.caseId === selectedCaseId;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      item.evidenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sha256.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCase && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-800">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white tracking-tight flex items-center gap-2">
            Evidence Vault & Verifiable Register
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse encrypted forensic artifacts, inspect custody chains, and verify cryptographic proofs.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-dark-900 border border-dark-750 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by ID, filename, or SHA-256..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-950 border border-dark-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
          />
        </div>

        {/* Case Filter */}
        <div className="relative">
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
          >
            <option value="ALL">All Associated Cases</option>
            {cases.map((c) => (
              <option key={c.caseId} value={c.caseId}>
                {c.caseId} — {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">VERIFIED ONLY</option>
            <option value="TAMPERED">TAMPERED ONLY</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Left List + Right Inspection Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Evidence Table List */}
        <div className="lg:col-span-5 bg-dark-900 border border-dark-750 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-5 py-3.5 border-b border-dark-800 flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
              Artifacts ({filteredEvidence.length})
            </span>
          </div>

          <div className="divide-y divide-dark-800/80 max-h-[720px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading evidence registry...</span>
              </div>
            ) : filteredEvidence.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                No matching evidence items found in registry.
              </div>
            ) : (
              filteredEvidence.map((item) => {
                const isSelected = selectedEvidence?.evidenceId === item.evidenceId;
                return (
                  <div
                    key={item.evidenceId}
                    onClick={() => handleInspect(item)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-dark-800/90 border-l-4 border-emerald-500'
                        : 'hover:bg-dark-850/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs font-mono text-white">
                        {item.evidenceId}
                      </span>
                      <TamperBadge status={item.status} size="sm" />
                    </div>

                    <div className="text-xs text-slate-300 font-medium mt-1 truncate">
                      {item.filename}
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 mt-2 truncate">
                      SHA-256: {item.sha256.slice(0, 16)}...
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-mono">
                      <span>{item.caseId}</span>
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Inspection Drawer */}
        <div className="lg:col-span-7 bg-dark-900 border border-dark-750 rounded-2xl p-6 shadow-xl space-y-6">
          {selectedEvidence ? (
            <>
              {/* Evidence Banner */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-dark-800">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold font-mono text-white">
                      {selectedEvidence.evidenceId}
                    </h2>
                    <TamperBadge status={selectedEvidence.status} size="md" />
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-1">
                    {selectedEvidence.filename} ({selectedEvidence.mimeType})
                  </p>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="text-slate-500">Case Identifier</div>
                  <div className="text-emerald-400 font-bold">{selectedEvidence.caseId}</div>
                </div>
              </div>

              {/* Cryptographic Hashes Details */}
              <div className="p-4 rounded-xl bg-dark-950 border border-dark-750 font-mono text-xs space-y-2">
                <div>
                  <span className="text-slate-500 block">Registered SHA-256 Checksum:</span>
                  <span className="text-cyan-400 break-all select-all font-semibold">
                    {selectedEvidence.sha256}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Encrypted Storage Path:</span>
                  <span className="text-slate-400 break-all">{selectedEvidence.storagePath}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Smart Contract Integrity Anchor:</span>
                  <span className={onChainStatus ? 'text-emerald-400' : 'text-tampered-400'}>
                    {onChainStatus
                      ? '✓ ON-CHAIN ANCHOR CONFIRMED (Ethers / Hardhat 31337)'
                      : '❌ ON-CHAIN ANCHOR MISMATCH'}
                  </span>
                </div>
              </div>

              {/* ZK Proof Card */}
              <ZkProofCard commitment={selectedEvidence.commitment} />

              {/* Custody Timeline */}
              <div className="pt-2">
                <h3 className="text-sm font-bold font-mono text-white mb-4 uppercase tracking-wider">
                  Verifiable Chain of Custody History
                </h3>
                {drawerLoading ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading custody log trail...
                  </div>
                ) : (
                  <CustodyTimeline events={custodyLogs} />
                )}
              </div>

              {/* Append Custody Transition Action */}
              <div className="p-4 rounded-xl bg-dark-950 border border-dark-750">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  Append Custody Transition
                </h4>
                <form onSubmit={handleAddCustody} className="flex gap-3">
                  <select
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    className="bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
                  >
                    <option value="ANALYZED">ANALYZED</option>
                    <option value="TRANSFERRED">TRANSFERRED</option>
                    <option value="VERIFIED">VERIFIED</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isAppendingAction}
                    className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-600 text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isAppendingAction ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Sign & Append Action</span>
                    )}
                  </button>
                </form>
              </div>

              {/* File Re-verification Tool */}
              <div className="p-4 rounded-xl bg-dark-950 border border-dark-750">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  Live Re-Verification (File Integrity Check)
                </h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  Re-upload original file to test live against DB hash & blockchain anchor.
                </p>
                <input
                  type="file"
                  onChange={handleReverifyFile}
                  className="text-xs font-mono text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:bg-dark-800 file:text-slate-200 hover:file:bg-dark-700"
                />

                {checkFileLoading && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-mono text-cyan-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Comparing file hashes against on-chain ledger...</span>
                  </div>
                )}

                {checkResult && (
                  <div
                    className={`mt-3 p-3 rounded-xl border text-xs font-mono ${
                      checkResult.status === 'VERIFIED'
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                        : 'bg-tampered-950/60 border-tampered-500/60 text-tampered-300'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-2">
                      {checkResult.status === 'VERIFIED' ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>INTEGRITY VERIFIED — EXACT HASH MATCH</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-4 h-4 text-tampered-400" />
                          <span>INTEGRITY COMPROMISED — HASH MISMATCH</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 font-mono text-xs">
              Select an evidence item from the list to inspect its custody chain.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
