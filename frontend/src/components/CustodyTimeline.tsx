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
        return <Search className="w-4 h-4 text-cyan-400" />;
      case 'UPLOADED':
        return <UploadCloud className="w-4 h-4 text-blue-400" />;
      case 'HASHED':
      case 'ANALYZED':
        return <KeyRound className="w-4 h-4 text-amber-400" />;
      case 'ON-CHAIN ANCHORED':
        return <Link2 className="w-4 h-4 text-purple-400" />;
      case 'VERIFIED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'COLLECTED':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-600/40';
      case 'UPLOADED':
        return 'bg-blue-950/60 text-blue-300 border-blue-600/40';
      case 'HASHED':
      case 'ANALYZED':
        return 'bg-amber-950/60 text-amber-300 border-amber-600/40';
      case 'ON-CHAIN ANCHORED':
        return 'bg-purple-950/60 text-purple-300 border-purple-600/40';
      case 'VERIFIED':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-600/40';
    }
  };

  if (!events || events.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-slate-400 font-mono bg-dark-900 rounded-xl border border-dark-700">
        No custody logs recorded yet for this evidence.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:top-3 before:bottom-3 before:left-[17px] before:w-[2px] before:bg-gradient-to-b before:from-cyan-500 before:via-purple-500 before:to-emerald-500">
      {events.map((ev, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === events.length - 1;

        return (
          <div key={idx} className="relative group">
            {/* Timeline node icon */}
            <div className="absolute -left-[31px] top-1.5 w-7 h-7 rounded-full bg-dark-900 border-2 border-slate-600 group-hover:border-emerald-400 flex items-center justify-center transition-colors shadow-md">
              {getActionIcon(ev.action)}
            </div>

            {/* Event Card */}
            <div className="bg-dark-850 border border-dark-700 rounded-xl p-4 transition-all hover:border-dark-600 hover:bg-dark-800/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border uppercase tracking-wider ${getActionBadgeColor(
                      ev.action
                    )}`}
                  >
                    {ev.action}
                  </span>
                  {isFirst && (
                    <span className="text-[10px] uppercase font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800 px-1.5 py-0.5 rounded">
                      Genesis
                    </span>
                  )}
                  {isLast && (
                    <span className="text-[10px] uppercase font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-1.5 py-0.5 rounded">
                      Current State
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(ev.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Actor */}
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-300 font-mono">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">Actor:</span>
                <span className="text-slate-200 truncate">{ev.actorId}</span>
              </div>

              {/* Hash Chain Details */}
              <div className="mt-3 pt-3 border-t border-dark-700/60 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="truncate">
                  <span className="text-slate-500 block">Prev Hash:</span>
                  <span className="text-slate-300 truncate block">
                    {ev.previousHash.slice(0, 18)}...{ev.previousHash.slice(-8)}
                  </span>
                </div>
                <div className="truncate">
                  <span className="text-slate-500 block">Current Hash:</span>
                  <span className="text-emerald-400/90 truncate block">
                    {ev.currentHash.slice(0, 18)}...{ev.currentHash.slice(-8)}
                  </span>
                </div>
              </div>

              {/* Digital Signature */}
              <div className="mt-2 text-[11px] font-mono text-slate-400 bg-dark-900/60 p-2 rounded border border-dark-750 flex items-center gap-2 truncate">
                <KeyRound className="w-3 h-3 text-purple-400 shrink-0" />
                <span className="text-slate-500 shrink-0">Signature:</span>
                <span className="text-purple-300/80 truncate">
                  {ev.digitalSignature ? `${ev.digitalSignature.slice(0, 32)}...` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
