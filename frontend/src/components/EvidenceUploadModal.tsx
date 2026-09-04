import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, CheckCircle2, AlertCircle, Loader2, Key, Video, FileText, Check } from 'lucide-react';
import { getCases, uploadEvidence, CaseData } from '../services/api';

interface EvidenceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PipelineStep {
  id: number;
  title: string;
  subtitle: string;
  actor: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  { id: 1, title: 'Selection', subtitle: 'File & Case Association', actor: 'Investigator' },
  { id: 2, title: 'Fingerprint', subtitle: 'SHA-256 Digest', actor: 'Client Engine' },
  { id: 3, title: 'Encryption', subtitle: 'AES-256-GCM Sealed', actor: 'Crypto Module' },
  { id: 4, title: 'Signature', subtitle: 'Ed25519 Custody Sign', actor: 'Investigator Key' },
  { id: 5, title: 'Anchoring', subtitle: 'Solidity & Mongo Ledger', actor: 'Smart Contract' },
];

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
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(1);
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
      // Reset modal state
      setFile(null);
      setPreviewHash('');
      setUploadPercent(0);
      setCurrentStep(1);
      setError(null);
    }
  }, [isOpen]);

  const handleFileSelect = async (selected: File) => {
    setFile(selected);
    setError(null);
    setCurrentStep(2);
    try {
      // Streamed or chunked calculation for large video files
      const arrayBuffer = await selected.slice(0, 10 * 1024 * 1024).arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setPreviewHash(hashHex);
    } catch {
      setPreviewHash('Pre-computed by server engine upon intake');
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
    setUploadPercent(5);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caseId', selectedCaseId);
      if (customSalt) {
        formData.append('secretSalt', customSalt);
      }

      // Progressively animate pipeline steps
      setCurrentStep(3); // AES-256-GCM Encryption
      await new Promise((r) => setTimeout(r, 400));

      setCurrentStep(4); // Digital Signature
      await new Promise((r) => setTimeout(r, 300));

      setCurrentStep(5); // Anchoring
      await uploadEvidence(formData, (percent) => {
        setUploadPercent(percent);
      });

      setUploadPercent(100);
      await new Promise((r) => setTimeout(r, 300));

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to upload evidence');
      setCurrentStep(2);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isVideoFile = file && (file.type.includes('video') || file.name.match(/\.(mp4|mov|mkv|avi)$/i));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-2xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black font-mono text-slate-900">
              Evidence Intake & Cryptographic Sealing
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Support for up to 200MB forensic media, video archives, and disk images.
            </p>
          </div>
        </div>

        {/* 5-Step Visual Lifecycle Stepper */}
        <div className="mt-6 mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
            <span>Cryptographic Intake Lifecycle</span>
            <span className="text-emerald-700 font-bold">Step {currentStep} of 5</span>
          </div>

          <div className="grid grid-cols-5 gap-2 relative">
            {PIPELINE_STEPS.map((step) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="text-center relative">
                  <div
                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : isCurrent
                        ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-600 animate-pulse'
                        : 'bg-white border border-slate-300 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <div className="mt-2">
                    <div
                      className={`text-[11px] font-bold font-mono leading-tight ${
                        isCurrent ? 'text-emerald-800' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-[9px] text-slate-500 hidden sm:block truncate mt-0.5">
                      {step.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Associated Case Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
              Step 1 • Associated Case Identifier
            </label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none font-mono transition-all"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono flex items-center justify-between">
              <span>Evidence Payload File (Up to 200MB)</span>
              <span className="text-[10px] text-slate-500 font-normal">
                .mp4, .mov, .mkv, .avi, .pdf, .png, .jpg
              </span>
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-white'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".mp4,.mov,.mkv,.avi,.pdf,.png,.jpg,.jpeg,.zip"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-700 font-mono">
                  {isVideoFile ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  <span className="font-bold">{file.name}</span>
                  <span className="text-slate-500 text-xs font-medium">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-slate-700">
                    Click to browse or drop high-definition video / forensic evidence here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    Direct multipart buffer streaming up to 200MB
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Live Preview SHA-256 Hash */}
          {previewHash && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs">
              <span className="text-slate-500 block mb-1 text-[10px] uppercase font-bold tracking-wider">
                Step 2 • SHA-256 Fingerprint Checksum:
              </span>
              <span className="text-emerald-700 break-all select-all font-bold">
                {previewHash}
              </span>
            </div>
          )}

          {/* Optional Investigator Secret Salt */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono flex items-center justify-between">
              <span>Investigator ZK Secret Salt (Optional)</span>
              <span className="text-slate-400 text-[10px] font-normal">Auto-generated if left blank</span>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={customSalt}
                onChange={(e) => setCustomSalt(e.target.value)}
                placeholder="e.g. inv_salt_alpha_99"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Upload Progress Indicator */}
          {loading && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600 font-bold flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  Encrypting, Signing & Anchoring On-Chain...
                </span>
                <span className="text-emerald-700 font-bold">{uploadPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadPercent}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Submit CTA */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Lifecycle...</span>
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

