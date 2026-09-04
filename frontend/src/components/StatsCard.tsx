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
  const iconStyles = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    crimson: 'bg-rose-50 text-rose-600 border-rose-200',
    cyan: 'bg-blue-50 text-blue-600 border-blue-200',
    amber: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border shadow-2xs ${iconStyles[variant]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <span className="text-3xl font-black font-mono tracking-tight text-slate-900">
          {value}
        </span>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
