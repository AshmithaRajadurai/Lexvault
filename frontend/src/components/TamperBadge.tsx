import React from 'react';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

interface TamperBadgeProps {
  status: 'VERIFIED' | 'TAMPERED' | 'IN PROCESS' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const TamperBadge: React.FC<TamperBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  };

  if (normalized === 'VERIFIED') {
    return (
      <span
        className={`inline-flex items-center rounded-full font-mono font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-300 text-emerald-700 shadow-2xs ${sizeClasses[size]}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>VERIFIED</span>
      </span>
    );
  }

  if (normalized === 'IN PROCESS') {
    return (
      <span
        className={`inline-flex items-center rounded-full font-mono font-bold uppercase tracking-wider bg-blue-50 border border-blue-300 text-blue-700 shadow-2xs ${sizeClasses[size]}`}
      >
        <Clock className="w-3.5 h-3.5 text-blue-600" />
        <span>IN PROCESS</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono font-bold uppercase tracking-wider bg-rose-50 border border-rose-300 text-rose-700 shadow-2xs ${sizeClasses[size]}`}
    >
      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
      <span>TAMPERED</span>
    </span>
  );
};
