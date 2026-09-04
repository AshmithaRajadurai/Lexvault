import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, File, X, CheckCircle2, AlertCircle, Loader2, Key } from 'lucide-react';
import { getCases, uploadEvidence, CaseData } from '../services/api';

interface EvidenceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EvidenceUploadModal: React.FC<EvidenceUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewHash, setPreviewHash] = useState<string>('');
  const [cases, setCases] = useState<CaseData[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [customSalt, setCustomSalt] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      getCases().then((list) => {
        setCases(list);
        if (list.length > 0) {
          setSelectedCaseId(list[0].caseId);
        }
      });
    }
  }, [isOpen]);

  // Compute live client-side SHA-256 hash using browser Web Crypto API
  const handleFileSelect = async (selected: File) => {
    setFile(selected);
    setError(null);
    try {
      const arrayBuffer = await selected.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setPreviewHash(hashHex);
    } catch {
      setPreviewHash('Calculating...');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an evidence file to upload');
      return;
    }
    if (!selectedCaseId) {
      setError('Please select an associated case');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caseId', selectedCaseId);
      if (customSalt) {
        formData.append('secretSalt', customSalt);
      }

      await uploadEvidence(formData);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to upload evidence');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl bg-dark-900 border border-dark-700 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-dark-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-mono text-white">Intake Evidence Artifact</h3>
            <p className="text-xs text-slate-400">
              AES-256-GCM Encryption • SHA-256 Checksum • ZK Commitment • Blockchain Anchor
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-tampered-950/80 border border-tampered-500/50 text-tampered-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Associated Case Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
              Associated Case ID
            </label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
            >
              {cases.map((c) => (
                <option key={c.caseId} value={c.caseId}>
                  [{c.caseId}] — {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop File Zone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
              Evidence Payload File
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-950/20'
                  : 'border-dark-700 bg-dark-950/60 hover:border-dark-600 hover:bg-dark-950'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-400 font-mono">
                  <File className="w-4 h-4" />
                  <span className="font-semibold">{file.name}</span>
                  <span className="text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-300">
                    Click to browse or drag evidence file here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Raw forensic dumps, network captures, memory logs, documents
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Live Preview SHA-256 Hash */}
          {previewHash && (
            <div className="p-3 bg-dark-950 border border-dark-750 rounded-xl font-mono text-xs">
              <span className="text-slate-500 block mb-1 text-[10px] uppercase tracking-wider">
                Pre-Ingestion SHA-256 Checksum:
              </span>
              <span className="text-cyan-400 break-all select-all font-semibold">
                {previewHash}
              </span>
            </div>
          )}

          {/* Optional Investigator Secret Salt */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono flex items-center justify-between">
              <span>Investigator ZK Secret Salt (Optional)</span>
              <span className="text-slate-500 text-[10px]">Auto-generated if empty</span>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={customSalt}
                onChange={(e) => setCustomSalt(e.target.value)}
                placeholder="e.g. inv_salt_alpha_99"
                className="w-full bg-dark-950 border border-dark-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Encrypting & Anchoring...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Seal & Store Evidence</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
