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
  const cardStyles = {
    emerald: 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300',
    crimson: 'bg-rose-50/70 border-rose-200 hover:border-rose-300',
    cyan: 'bg-blue-50/70 border-blue-200 hover:border-blue-300',
    amber: 'bg-purple-50/70 border-purple-200 hover:border-purple-300',
  };

  const iconStyles = {
    emerald: 'bg-white text-emerald-700 border-emerald-300 shadow-2xs',
    crimson: 'bg-white text-rose-700 border-rose-300 shadow-2xs',
    cyan: 'bg-white text-blue-700 border-blue-300 shadow-2xs',
    amber: 'bg-white text-purple-700 border-purple-300 shadow-2xs',
  };

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 shadow-xs hover:shadow-sm ${cardStyles[variant]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border ${iconStyles[variant]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <span className="text-4xl font-black font-mono tracking-tight text-slate-900 block">
          {value}
        </span>
        {subtitle && (
          <p className="text-xs text-slate-600 mt-1 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
