import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'emerald' | 'crimson' | 'cyan' | 'amber';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'cyan',
}) => {
  const variantStyles = {
    emerald: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:border-emerald-500/60',
    crimson: 'border-tampered-500/30 bg-tampered-950/20 text-tampered-400 hover:border-tampered-500/60',
    cyan: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400 hover:border-cyan-500/60',
    amber: 'border-amber-500/30 bg-amber-950/20 text-amber-400 hover:border-amber-500/60',
  };

  return (
    <div
      className={`rounded-xl border p-5 bg-dark-900 transition-all duration-300 hover:-translate-y-0.5 ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-dark-800/80 border border-dark-700">
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
          {value}
        </span>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
