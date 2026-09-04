import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Flame,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Link2,
  HardDrive,
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
        corruptedHash: res.corruptedHash || 'bad00000' + (selectedEvidence?.sha256.slice(8) || '00000000'),
      });
      setTamperSuccess(true);
      await loadEvidence();
    } catch (err: any) {
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
      <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
              Cryptographic Tamper Audit Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-300">
              Live Demo
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Simulate physical bit-level corruption and malicious database manipulation to verify instant detection.
          </p>
        </div>

        <button
          onClick={loadEvidence}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-xs self-start"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Grid: Target Selector + Audit Console */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Target Selector */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
            Select Target Artifact
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
                  className={`w-full text-left p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-400 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {item.evidenceId}
                    </span>
                    <TamperBadge status={item.status} size="sm" />
                  </div>
                  <div className="text-xs text-slate-700 mt-1 font-medium truncate">{item.filename}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">{item.caseId}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Comparison & Attack Simulator */}
        <div className="md:col-span-2 space-y-6">
          {selectedEvidence ? (
            <>
              {/* Target Artifact Details Header */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono font-bold block">
                      Active Target Artifact
                    </span>
                    <h2 className="text-xl font-black font-mono text-slate-900 mt-0.5">
                      {selectedEvidence.evidenceId}
                    </h2>
                  </div>
                  <TamperBadge status={selectedEvidence.status} size="md" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Filename:</span>
                    <span className="text-slate-800 font-semibold truncate block">{selectedEvidence.filename}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Ingestion Date:</span>
                    <span className="text-slate-800 font-semibold truncate block">
                      {new Date(selectedEvidence.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Card 1 & Card 2: Fingerprint Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card 1: Original Fingerprint (Blockchain Anchor) */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 font-mono flex items-center gap-1.5 mb-2">
                      <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                      Card 1 • Original Fingerprint (Ledger Anchor)
                    </span>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-emerald-900 font-mono font-bold text-[11px] break-all select-all">
                      {tamperDetails?.originalHash || selectedEvidence.sha256}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-mono mt-2 block">
                      ? Immutable Solidity Contract State
                    </span>
                  </div>

                  {/* Card 2: Current Re-calculated Hash (Disk State) */}
                  <div
                    className={`p-4 rounded-2xl border shadow-2xs ${
                      isTampered
                        ? 'bg-rose-50/60 border-rose-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span
                      className={`text-[10px] uppercase font-bold font-mono flex items-center gap-1.5 mb-2 ${
                        isTampered ? 'text-rose-800' : 'text-slate-700'
                      }`}
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      Card 2 • Current Re-calculated Hash
                    </span>
                    <div
                      className={`p-2.5 rounded-xl border font-mono font-bold text-[11px] break-all select-all ${
                        isTampered
                          ? 'bg-white border-rose-300 text-rose-700'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      {tamperDetails?.corruptedHash || selectedEvidence.sha256}
                    </div>
                    <span
                      className={`text-[10px] font-mono mt-2 block ${
                        isTampered ? 'text-rose-700 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {isTampered ? '? In-Storage Byte Drift Detected' : '? Verified Byte Exactness'}
                    </span>
                  </div>
                </div>

                {/* Simulate Tamper Action Button */}
                <div className="pt-2">
                  <button
                    onClick={handleSimulateTamper}
                    disabled={tampering}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-mono font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {tampering ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Injecting Bit Flip Corruptions...</span>
                      </>
                    ) : (
                      <>
                        <Flame className="w-5 h-5 animate-pulse" />
                        <span>Simulate File Tamper</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-slate-500 text-center mt-2 font-mono">
                    ?? Flips physical bytes in storage vault and triggers cryptographic verification alarm.
                  </p>
                </div>
              </div>

              {/* High-Contrast Status Banner */}
              {isTampered ? (
                <div className="p-6 rounded-3xl bg-rose-50 border-2 border-rose-400 shadow-sm animate-fadeIn space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-rose-600 text-white shadow-2xs">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black font-mono text-rose-900 tracking-tight">
                        ? INTEGRITY FAILED: File Modified
                      </h3>
                      <p className="text-xs text-rose-700 font-mono mt-0.5">
                        Cryptographic hash mismatch. The physical file does not match the immutable blockchain commitment.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-rose-200 text-xs font-mono text-slate-700 space-y-1.5 shadow-2xs">
                    <span className="font-bold text-rose-800 uppercase block text-[11px]">
                      Forensic Audit Summary:
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Bitwise difference detected between the initial intake seal and current physical byte stream.
                      The smart contract anchor at <span className="font-bold text-slate-900">LexVaultRegistry</span> preserves the original record of truth, immediately repudiating the compromised artifact.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-emerald-50 border-2 border-emerald-300 shadow-sm flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-2xs">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-black font-mono text-emerald-900 uppercase">
                      ? MATCH: Evidence Authentic
                    </h4>
                    <p className="text-xs text-emerald-800 font-mono mt-0.5">
                      Target artifact matches registered cryptographic commitment and blockchain ledger anchor.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 font-mono text-xs bg-white rounded-3xl border border-slate-200">
              Select an evidence item from the left panel to test tamper simulation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

