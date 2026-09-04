import React, { useState, useEffect } from 'react';
import {
  Search,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Upload,
  Lock,
  Link2,
} from 'lucide-react';
import { TamperBadge } from '../components/TamperBadge';
import { CustodyTimeline } from '../components/CustodyTimeline';
import { ZkProofCard } from '../components/ZkProofCard';
import { TruncatedHash } from '../components/TruncatedHash';
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
  // loading state handled via detailsLoading

  // Active selected evidence item for 3-column detail view
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceData | null>(null);
  const [custodyLogs, setCustodyLogs] = useState<CustodyEventData[]>([]);
  const [onChainStatus, setOnChainStatus] = useState<boolean>(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Custody log action append
  const [newAction, setNewAction] = useState('ANALYZED');
  const [isAppendingAction, setIsAppendingAction] = useState(false);

  // Re-verification file check inside Column 1
  const [checkFileLoading, setCheckFileLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);

  const loadData = async () => {
    
    try {
      const [evList, casesList] = await Promise.all([getEvidence(), getCases()]);
      setEvidenceList(evList);
      setCases(casesList);
      if (evList.length > 0 && !selectedEvidence) {
        handleSelectEvidence(evList[0]);
      }
    } finally {
      
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectEvidence = async (item: EvidenceData) => {
    setSelectedEvidence(item);
    setDetailsLoading(true);
    setCheckResult(null);
    try {
      const details = await getEvidenceDetails(item.evidenceId);
      setCustodyLogs(details.custodyEvents || []);
      setOnChainStatus(details.onChainVerified);
    } finally {
      setDetailsLoading(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black font-mono text-slate-900 tracking-tight flex items-center gap-2">
            Evidence Vault & Verifiable Register
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            3-Column Forensic Workbench: Artifact Inspection • Chain of Custody • Cryptographic & ZK Proofs.
          </p>
        </div>
      </div>

      {/* Filters Bar & Artifact Picker */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by ID, filename, or SHA-256..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none font-mono"
            />
          </div>

          {/* Case Filter */}
          <div className="relative">
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none font-mono"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none font-mono"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">VERIFIED ONLY</option>
              <option value="TAMPERED">TAMPERED ONLY</option>
            </select>
          </div>
        </div>

        {/* Sleek Active Artifact Selector Dropdown */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              Active Artifact:
            </span>
            {selectedEvidence && (
              <TamperBadge status={selectedEvidence.status} size="sm" />
            )}
          </div>
          <div className="flex-1 max-w-2xl">
            <select
              value={selectedEvidence?.evidenceId || ''}
              onChange={(e) => {
                const found = evidenceList.find((ev) => ev.evidenceId === e.target.value);
                if (found) handleSelectEvidence(found);
              }}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-emerald-500 focus:outline-none transition-all shadow-2xs cursor-pointer"
            >
              {filteredEvidence.map((item) => (
                <option key={item.evidenceId} value={item.evidenceId}>
                  [{item.evidenceId}] — {item.filename} ({item.caseId}) • {item.status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3-Column Layout: Evidence Info | Chain of Custody | Cryptographic & ZK Proofs */}
      {selectedEvidence ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Evidence Info (Left - 4 Cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-5">
            <div className="flex items-start justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">
                  Artifact Metadata
                </span>
                <h2 className="text-lg font-black font-mono text-slate-900 mt-0.5">
                  {selectedEvidence.evidenceId}
                </h2>
                <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                  {selectedEvidence.filename}
                </p>
              </div>
              <TamperBadge status={selectedEvidence.status} size="md" />
            </div>

            {/* Details Fields */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Case Identifier:</span>
                  <span className="font-bold text-slate-800">{selectedEvidence.caseId}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">MIME Type:</span>
                  <span className="text-slate-700">{selectedEvidence.mimeType}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Intake Date:</span>
                  <span className="text-slate-700">{new Date(selectedEvidence.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* SHA-256 Digest */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Registered SHA-256 Checksum:
                </span>
                <div className="pt-0.5">
                  <TruncatedHash
                    hash={selectedEvidence.sha256}
                    startChars={10}
                    endChars={8}
                    variant="blue"
                  />
                </div>
              </div>

              {/* On-Chain Confirmation */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Solidity Ledger Status:
                </span>
                <span
                  className={`font-bold flex items-center gap-1.5 text-xs ${
                    onChainStatus ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {onChainStatus
                    ? '? ON-CHAIN ANCHOR CONFIRMED (Chain 31337)'
                    : '? ON-CHAIN ANCHOR MISMATCH'}
                </span>
              </div>
            </div>

            {/* Live Re-Verification Check */}
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-600" />
                Live Integrity Re-Check
              </h4>
              <p className="text-[11px] text-slate-500 mb-3">
                Re-upload original file to verify against on-chain ledger & DB hash.
              </p>
              <input
                type="file"
                onChange={handleReverifyFile}
                className="text-xs font-mono text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-slate-200 file:text-xs file:font-mono file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
              />

              {checkFileLoading && (
                <div className="mt-3 flex items-center gap-2 text-xs font-mono text-emerald-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing live hash & comparing against anchor...</span>
                </div>
              )}

              {checkResult && (
                <div
                  className={`mt-3 p-3 rounded-xl border text-xs font-mono shadow-2xs ${
                    checkResult.status === 'VERIFIED'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {checkResult.status === 'VERIFIED' ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>INTEGRITY VERIFIED — EXACT HASH MATCH</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>INTEGRITY COMPROMISED — HASH MISMATCH</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Chain of Custody Timeline (Center - 4 Cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                Verifiable Chain of Custody
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                {custodyLogs.length} Signed Events
              </span>
            </div>

            {/* Timeline component */}
            <div className="max-h-[620px] overflow-y-auto pr-1">
              {detailsLoading ? (
                <div className="p-8 text-center text-xs text-slate-400 font-mono flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                  <span>Loading custody logs...</span>
                </div>
              ) : (
                <CustodyTimeline events={custodyLogs} />
              )}
            </div>

            {/* Append Custody Action Form */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                Append Custody Transition
              </h4>
              <form onSubmit={handleAddCustody} className="flex gap-2">
                <select
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none font-mono flex-1"
                >
                  <option value="ANALYZED">ANALYZED</option>
                  <option value="TRANSFERRED">TRANSFERRED</option>
                  <option value="VERIFIED">VERIFIED</option>
                </select>
                <button
                  type="submit"
                  disabled={isAppendingAction}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                >
                  {isAppendingAction ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Sign Action</span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Column 3: Cryptographic & ZK Proofs (Right - 4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* ZkProofCard Component */}
            <ZkProofCard commitment={selectedEvidence.commitment} />

            {/* Additional Cryptographic Parameters Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs font-mono text-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-2.5">
                <Lock className="w-4 h-4 text-purple-600" />
                <span>Envelope Encryption Parameters</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Encryption Algorithm:</span>
                <span className="font-semibold text-slate-800">AES-256-GCM (Authenticated)</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Initialization Vector (IV):</span>
                <span className="text-slate-600 break-all text-[11px] block bg-slate-50 p-2 rounded-lg border border-slate-200">
                  {selectedEvidence.iv || '96-bit Random Nonce Sealed in Storage'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Auth Tag:</span>
                <span className="text-slate-600 break-all text-[11px] block bg-slate-50 p-2 rounded-lg border border-slate-200">
                  {selectedEvidence.authTag || '128-bit MAC Tag Sealed in Storage'}
                </span>
              </div>
              <div className="pt-2 text-[11px] text-slate-500 font-sans">
                ??? Guarantees confidentiality at rest and cryptographically repudiates any unauthorized tampering.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 font-mono text-xs bg-white rounded-2xl border border-slate-200">
          Select an evidence item from the list above to open the 3-column forensic inspection workbench.
        </div>
      )}
    </div>
  );
};

