import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, UserCheck, ChevronDown, Database, Activity } from 'lucide-react';
import { useAuth, UserRole, DEMO_PROFILES } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { role, profile, switchRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const availableRoles: UserRole[] = ['Admin', 'Investigator', 'Verifier', 'Viewer'];

  return (
    <header className="sticky top-0 z-50 bg-dark-900/90 backdrop-blur-md border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <NavLink to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center group-hover:border-emerald-400 group-hover:glow-emerald transition-all">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-wider text-white flex items-center gap-1.5 font-mono">
                  LEX<span className="text-emerald-400">VAULT</span>
                </span>
                <span className="text-[10px] tracking-widest text-slate-400 block -mt-1 uppercase">
                  Zero-Knowledge Forensic Registry
                </span>
              </div>
            </NavLink>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-dark-800 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-dark-800/60'
                }`
              }
            >
              <Activity className="w-4 h-4" />
              Dashboard
            </NavLink>
            <NavLink
              to="/vault"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-dark-800 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-dark-800/60'
                }`
              }
            >
              <Database className="w-4 h-4" />
              Evidence Vault
            </NavLink>
            <NavLink
              to="/audit"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-dark-800 text-tampered-400 border border-tampered-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-dark-800/60'
                }`
              }
            >
              <ShieldAlert className="w-4 h-4 text-tampered-400" />
              Tamper Audit (Demo)
            </NavLink>
          </nav>

          {/* Demo Role Switcher Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline-block">Simulated Role:</span>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all ${profile.badgeColor} hover:brightness-110`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{role}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-72 rounded-xl bg-dark-900 border border-dark-700 shadow-2xl p-2 z-50"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-dark-700 mb-1">
                  <div className="text-xs font-semibold text-slate-200">Switch Demo Role</div>
                  <div className="text-[11px] text-slate-400">Instantly test role-based access control</div>
                </div>
                {availableRoles.map((r) => {
                  const p = DEMO_PROFILES[r];
                  const isSelected = r === role;
                  return (
                    <button
                      key={r}
                      onClick={() => switchRole(r)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-start justify-between ${
                        isSelected
                          ? 'bg-dark-800 border border-dark-600'
                          : 'hover:bg-dark-800/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${p.badgeColor}`}>
                            {r}
                          </span>
                          <span className="text-xs text-slate-200 font-medium">{p.username}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">
                          {p.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
