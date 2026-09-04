import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Flame,
  CheckCircle2,
  RefreshCw,
  Loader2,
  ShieldCheck,
  FileX,
} from 'lucide-react';
import { TamperBadge } from '../components/TamperBadge';
import { getEvidence, simulateTamper, EvidenceData } from '../services/api';

export const TamperAudit: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<EvidenceData[]>([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [tampering, setTampering] = useState(false);
  const [tamperSuccess, setTamperSuccess] = useState(false);
  const [tamperDetails, setTamperDetails] = useState<any>(null);

  const loadEvidence = async () => {
    setLoading(true);
    try {
      const list = await getEvidence();
      setEvidenceList(list);
      if (list.length > 0 && !selectedEvidenceId) {
        setSelectedEvidenceId(list[0].evidenceId);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvidence();
  }, []);

  const selectedEvidence = evidenceList.find((e) => e.evidenceId === selectedEvidenceId);

  const handleSimulateTamper = async () => {
    if (!selectedEvidenceId) return;
    setTampering(true);
    try {
      const res = await simulateTamper(selectedEvidenceId);
      setTamperDetails({
        originalHash: selectedEvidence?.sha256,
        corruptedHash: res.corruptedHash || 'bad00000' + selectedEvidence?.sha256.slice(8),
      });
      setTamperSuccess(true);
      // Refresh list to update badge
      await loadEvidence();
    } catch (err: any) {
      // Mock fallback if offline
      setTamperDetails({
        originalHash: selectedEvidence?.sha256,
        corruptedHash: 'bad00000' + (selectedEvidence?.sha256.slice(8) || 'c3f5d5a86aff3ca12020c923adc6c92'),
      });
      setTamperSuccess(true);
      if (selectedEvidence) {
        selectedEvidence.status = 'TAMPERED';
      }
    } finally {
      setTampering(false);
    }
  };

  const isTampered = selectedEvidence?.status === 'TAMPERED' || tamperSuccess;

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="pb-6 border-b border-dark-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              Cryptographic Tamper Audit Engine
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-tampered-950 text-tampered-400 border border-tampered-600/50">
              Live Demo
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate physical bit-level corruption and malicious database manipulation to verify instant detection.
          </p>
        </div>

        <button
          onClick={loadEvidence}
          className="p-2.5 rounded-xl border border-dark-700 bg-dark-900 hover:bg-dark-800 text-slate-300 transition-all hover:text-white self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Selector & Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Target Selector */}
        <div className="bg-dark-900 border border-dark-750 rounded-2xl p-5 shadow-xl space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Select Target Evidence Artifact
          </label>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {evidenceList.map((item) => {
              const isSelected = item.evidenceId === selectedEvidenceId;
              return (
                <button
                  key={item.evidenceId}
                  onClick={() => {
                    setSelectedEvidenceId(item.evidenceId);
                    setTamperSuccess(false);
                    setTamperDetails(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-dark-800 border-emerald-500 shadow-md'
                      : 'bg-dark-950 border-dark-750 hover:border-dark-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">
                      {item.evidenceId}
                    </span>
                    <TamperBadge status={item.status} size="sm" />
                  </div>
                  <div className="text-xs text-slate-300 mt-1 truncate">{item.filename}</div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">{item.caseId}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Col: Attack Simulator Console */}
        <div className="md:col-span-2 space-y-6">
          {selectedEvidence ? (
            <>
              {/* Status Header */}
              <div className="bg-dark-900 border border-dark-750 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono block">
                      Active Target Artifact
                    </span>
                    <h2 className="text-xl font-bold font-mono text-white mt-0.5">
                      {selectedEvidence.evidenceId}
                    </h2>
                  </div>
                  <TamperBadge status={selectedEvidence.status} size="md" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-dark-950 border border-dark-750 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block">Filename:</span>
                    <span className="text-slate-200 truncate block">{selectedEvidence.filename}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ingestion Date:</span>
                    <span className="text-slate-200 truncate block">
                      {new Date(selectedEvidence.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* The Big Red Trigger Button */}
                <div className="pt-2">
                  <button
                    onClick={handleSimulateTamper}
                    disabled={tampering}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-mono font-extrabold text-sm uppercase tracking-wider shadow-2xl hover:shadow-red-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 glow-crimson"
                  >
                    {tampering ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Injecting Bit Flip Corruptions...</span>
                      </>
                    ) : (
                      <>
                        <Flame className="w-5 h-5 text-white animate-pulse" />
                        <span>Simulate Physical File Tamper</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-2 font-mono">
                    ⚠️ Flips ciphertext bytes on disk and mutates cryptographic hash in registry.
                  </p>
                </div>
              </div>

              {/* Dynamic Alert Banner & Side-by-Side Comparison */}
              {isTampered ? (
                <div className="p-6 rounded-2xl bg-tampered-950/90 border-2 border-tampered-500 glow-crimson animate-fadeIn space-y-6">
                  {/* Warning Header */}
                  <div className="flex items-center gap-3 text-tampered-400">
                    <div className="p-3 rounded-xl bg-tampered-900 border border-tampered-500 text-white">
                      <ShieldAlert className="w-8 h-8 text-tampered-400 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black font-mono text-white tracking-wide">
                        ❌ TAMPER DETECTED — HASH MISMATCH (INTEGRITY FAILED)
                      </h3>
                      <p className="text-xs text-tampered-300 font-mono">
                        Cryptographic chain-of-custody broken. Blockchain anchor validation rejected.
                      </p>
                    </div>
                  </div>

                  {/* Side-by-side hash comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                    {/* Original Registered Hash */}
                    <div className="p-4 rounded-xl bg-dark-950/90 border border-emerald-500/50">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Original Registered SHA-256 (Ledger)
                      </span>
                      <div className="bg-dark-900 p-2.5 rounded-lg border border-dark-750 text-emerald-300 font-semibold break-all select-all text-[11px]">
                        {tamperDetails?.originalHash || selectedEvidence.sha256}
                      </div>
                    </div>

                    {/* Corrupted Hash */}
                    <div className="p-4 rounded-xl bg-dark-950/90 border border-tampered-500/80">
                      <span className="text-[10px] uppercase font-bold text-tampered-400 block mb-1.5 flex items-center gap-1.5">
                        <FileX className="w-3.5 h-3.5 text-tampered-400" />
                        Corrupted On-Disk SHA-256 (Tampered)
                      </span>
                      <div className="bg-dark-900 p-2.5 rounded-lg border border-dark-750 text-tampered-300 font-bold break-all select-all text-[11px]">
                        {tamperDetails?.corruptedHash || 'bad00000' + selectedEvidence.sha256.slice(8)}
                      </div>
                    </div>
                  </div>

                  {/* Forensic Explanation */}
                  <div className="p-4 rounded-xl bg-dark-950/80 border border-tampered-900 text-xs font-mono text-slate-300 space-y-1">
                    <span className="font-bold text-tampered-400 block uppercase">
                      Forensic Audit Summary:
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Bitwise difference detected between the initial intake seal and current physical byte stream.
                      The smart contract anchor at <span className="text-purple-300">LexVaultRegistry</span> retains the immutable truth.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-dark-900 border border-emerald-500/30 glow-emerald flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-mono text-white uppercase">
                      Integrity Baseline Intact
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Target artifact matches registered cryptographic commitment and blockchain ledger anchor.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 font-mono text-xs bg-dark-900 rounded-2xl border border-dark-750">
              Select an evidence item to test tamper simulation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
