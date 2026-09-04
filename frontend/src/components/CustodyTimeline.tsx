import React from 'react';
import { ShieldCheck, UploadCloud, Link2, Search, CheckCircle2, User, KeyRound, Clock } from 'lucide-react';
import { CustodyEventData } from '../services/api';

interface CustodyTimelineProps {
  events: CustodyEventData[];
}

export const CustodyTimeline: React.FC<CustodyTimelineProps> = ({ events }) => {
  const getActionIcon = (action: string) => {
    switch (action.toUpperCase()) {
      case 'COLLECTED':
        return <Search className="w-4 h-4 text-blue-600" />;
      case 'UPLOADED':
        return <UploadCloud className="w-4 h-4 text-sky-600" />;
      case 'HASHED':
      case 'ANALYZED':
        return <KeyRound className="w-4 h-4 text-amber-600" />;
      case 'ON-CHAIN ANCHORED':
        return <Link2 className="w-4 h-4 text-purple-600" />;
      case 'VERIFIED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-slate-500" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'COLLECTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'UPLOADED':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'HASHED':
      case 'ANALYZED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ON-CHAIN ANCHORED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'VERIFIED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (!events || events.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 font-mono bg-white rounded-2xl border border-slate-200">
        No custody logs recorded yet for this evidence.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-5 before:absolute before:top-3 before:bottom-3 before:left-[17px] before:w-[2px] before:bg-gradient-to-b before:from-blue-400 before:via-purple-400 before:to-emerald-400">
      {events.map((ev, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === events.length - 1;

        return (
          <div key={idx} className="relative group">
            {/* Timeline node icon */}
            <div className="absolute -left-[31px] top-1.5 w-7 h-7 rounded-full bg-white border-2 border-slate-300 group-hover:border-emerald-500 flex items-center justify-center transition-colors shadow-2xs">
              {getActionIcon(ev.action)}
            </div>

            {/* Event Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs transition-all hover:border-slate-300">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border uppercase tracking-wider ${getActionBadgeColor(
                      ev.action
                    )}`}
                  >
                    {ev.action}
                  </span>
                  {isFirst && (
                    <span className="text-[10px] uppercase font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                      Genesis
                    </span>
                  )}
                  {isLast && (
                    <span className="text-[10px] uppercase font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Current State
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(ev.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Actor */}
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-700 font-mono">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Actor:</span>
                <span className="font-semibold text-slate-800 truncate">{ev.actorId}</span>
              </div>

              {/* Hash Chain Details */}
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="truncate">
                  <span className="text-slate-400 block text-[10px]">Prev Hash:</span>
                  <span className="text-slate-600 truncate block font-medium">
                    {ev.previousHash.slice(0, 18)}...{ev.previousHash.slice(-8)}
                  </span>
                </div>
                <div className="truncate">
                  <span className="text-slate-400 block text-[10px]">Current Hash:</span>
                  <span className="text-emerald-700 truncate block font-bold">
                    {ev.currentHash.slice(0, 18)}...{ev.currentHash.slice(-8)}
                  </span>
                </div>
              </div>

              {/* Digital Signature */}
              <div className="mt-2.5 text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center gap-2 truncate">
                <KeyRound className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="text-slate-400 shrink-0 text-[10px] uppercase font-bold">Signature:</span>
                <span className="text-purple-700 truncate text-[11px] font-medium">
                  {ev.digitalSignature ? `${ev.digitalSignature.slice(0, 34)}...` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
