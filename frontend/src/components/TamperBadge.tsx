import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface TamperBadgeProps {
  status: 'VERIFIED' | 'TAMPERED';
  size?: 'sm' | 'md' | 'lg';
}

export const TamperBadge: React.FC<TamperBadgeProps> = ({ status, size = 'md' }) => {
  const isVerified = status === 'VERIFIED';

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  };

  if (isVerified) {
    return (
      <span
        className={`inline-flex items-center rounded-full font-mono font-semibold uppercase tracking-wider bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 glow-emerald ${sizeClasses[size]}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>VERIFIED</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono font-semibold uppercase tracking-wider bg-tampered-950/90 border border-tampered-500/80 text-tampered-400 glow-crimson animate-pulse ${sizeClasses[size]}`}
    >
      <ShieldAlert className="w-3.5 h-3.5 text-tampered-400" />
      <span>TAMPERED</span>
    </span>
  );
};
