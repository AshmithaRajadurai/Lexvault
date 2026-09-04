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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-dark-900 border-2 border-tampered-500 p-6 shadow-2xl glow-crimson">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-dark-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-tampered-400">
          <div className="p-2.5 rounded-xl bg-tampered-950 border border-tampered-500/50">
            <ShieldAlert className="w-7 h-7 text-tampered-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-mono text-white tracking-wide">
              CRITICAL INTEGRITY FAILURE
            </h3>
            <p className="text-xs text-tampered-400 font-mono">
              UNAUTHORIZED TAMPER DETECTED
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-dark-950 border border-tampered-500/30 text-xs font-mono space-y-3">
          <div>
            <span className="text-slate-500 block">Target Evidence ID:</span>
            <span className="text-white font-bold">{evidenceId}</span>
          </div>

          {expectedHash && (
            <div>
              <span className="text-slate-500 block">Original Ledger Hash:</span>
              <span className="text-emerald-400 break-all select-all">{expectedHash}</span>
            </div>
          )}

          {actualHash && (
            <div>
              <span className="text-slate-500 block">Current Corrupted Hash:</span>
              <span className="text-tampered-400 break-all select-all font-bold">{actualHash}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-slate-400 bg-tampered-950/40 border border-tampered-900 p-3 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-tampered-400 shrink-0 mt-0.5" />
          <p>
            Cryptographic chain-of-custody broken. Blockchain records verify that the physical data has been altered since original intake.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-white text-xs font-mono uppercase tracking-wider font-semibold border border-dark-600 transition-all"
          >
            Acknowledge Alert
          </button>
        </div>
      </div>
    </div>
  );
};
