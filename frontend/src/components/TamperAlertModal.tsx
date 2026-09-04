import React from 'react';
import { ShieldAlert, X, AlertTriangle } from 'lucide-react';

interface TamperAlertModalProps {
  isOpen: boolean;
  evidenceId: string;
  expectedHash?: string;
  actualHash?: string;
  onClose: () => void;
}

export const TamperAlertModal: React.FC<TamperAlertModalProps> = ({
  isOpen,
  evidenceId,
  expectedHash,
  actualHash,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border-2 border-rose-400 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-rose-700">
          <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200">
            <ShieldAlert className="w-7 h-7 text-rose-600 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black font-mono text-slate-900 tracking-wide">
              CRITICAL INTEGRITY FAILURE
            </h3>
            <p className="text-xs text-rose-600 font-mono font-bold">
              UNAUTHORIZED TAMPER DETECTED
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-3">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Evidence ID:</span>
            <span className="text-slate-900 font-bold">{evidenceId}</span>
          </div>

          {expectedHash && (
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Original Ledger Hash:</span>
              <span className="text-emerald-700 font-bold break-all select-all block bg-white p-2 rounded-lg border border-slate-200">
                {expectedHash}
              </span>
            </div>
          )}

          {actualHash && (
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Corrupted Hash:</span>
              <span className="text-rose-700 font-bold break-all select-all block bg-white p-2 rounded-lg border border-rose-200">
                {actualHash}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-slate-600 bg-rose-50/70 border border-rose-200 p-3 rounded-xl font-mono">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p>
            Cryptographic chain-of-custody broken. Blockchain records verify that the physical data has been altered since original intake.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-mono uppercase tracking-wider font-bold transition-all shadow-xs"
          >
            Acknowledge Alert
          </button>
        </div>
      </div>
    </div>
  );
};
