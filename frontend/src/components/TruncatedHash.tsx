import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface TruncatedHashProps {
  hash: string;
  startChars?: number;
  endChars?: number;
  showCopy?: boolean;
  className?: string;
  variant?: 'default' | 'emerald' | 'crimson' | 'purple' | 'blue';
}

export const TruncatedHash: React.FC<TruncatedHashProps> = ({
  hash,
  startChars = 8,
  endChars = 7,
  showCopy = true,
  className = '',
  variant = 'default',
}) => {
  const [copied, setCopied] = useState(false);

  if (!hash) {
    return <span className="text-slate-400 font-mono text-xs">N/A</span>;
  }

  const truncated =
    hash.length > startChars + endChars + 3
      ? `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`
      : hash;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200/70',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70',
    crimson: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/70',
    purple: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100/70',
    blue: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/70',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all group relative ${variantStyles[variant]} ${className}`}
      title={hash}
    >
      <span className="select-all font-semibold tracking-tight">{truncated}</span>
      {showCopy && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy full hash"
          className="p-0.5 rounded hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
          title={copied ? 'Copied!' : 'Click to copy full hash'}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 animate-fadeIn" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      )}
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-sans font-bold shadow-md animate-fadeIn pointer-events-none whitespace-nowrap z-30">
          Copied!
        </span>
      )}
    </div>
  );
};
