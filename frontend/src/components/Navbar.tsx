import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, UserCheck, ChevronDown, Database, Activity, LogOut } from 'lucide-react';
import { useAuth, UserRole, DEMO_PROFILES } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { role, profile, user, isAuthenticated, switchRole, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const availableRoles: UserRole[] = ['Admin', 'Investigator', 'Verifier', 'Viewer'];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <NavLink to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-center group-hover:border-emerald-500 transition-all shadow-xs">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1 font-mono">
                  LEX<span className="text-emerald-600">VAULT</span>
                </span>
                <span className="text-[10px] tracking-wider text-slate-500 block -mt-1 uppercase font-mono font-medium">
                  Zero-Knowledge Registry
                </span>
              </div>
            </NavLink>
          </div>

          {/* Navigation Links (Visible when authenticated) */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1.5">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl text-xs font-semibold font-mono tracking-wide transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-100 text-emerald-700 border border-slate-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Activity className="w-4 h-4 text-emerald-600" />
                Dashboard
              </NavLink>
              <NavLink
                to="/vault"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl text-xs font-semibold font-mono tracking-wide transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-100 text-emerald-700 border border-slate-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Database className="w-4 h-4 text-blue-600" />
                Evidence Vault
              </NavLink>
              <NavLink
                to="/audit"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl text-xs font-semibold font-mono tracking-wide transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-100 text-rose-700 border border-slate-200 shadow-2xs'
                      : 'text-slate-600 hover:text-rose-700 hover:bg-slate-50'
                  }`
                }
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Tamper Audit
              </NavLink>
            </nav>
          )}

          {/* User Identity, Role Switcher, & Logout */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Identity banner */}
                <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl">
                  <span>Logged in as:</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${profile.badgeColor}`}>
                    {role}
                  </span>
                  <span className="text-slate-400">({user?.email || profile.email})</span>
                </div>

                {/* Role Switcher Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold font-mono tracking-wide transition-all shadow-2xs ${profile.badgeColor} hover:brightness-95`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{role}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fadeIn"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <div className="text-xs font-bold text-slate-800 font-mono">Switch Persona</div>
                        <div className="text-[11px] text-slate-500">Test role-based permissions immediately</div>
                      </div>
                      {availableRoles.map((r) => {
                        const p = DEMO_PROFILES[r];
                        const isSelected = r === role;
                        return (
                          <button
                            key={r}
                            onClick={() => switchRole(r)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start justify-between ${
                              isSelected
                                ? 'bg-slate-50 border border-slate-200'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${p.badgeColor}`}>
                                  {r}
                                </span>
                                <span className="text-xs text-slate-800 font-semibold">{p.username}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1 leading-snug line-clamp-2">
                                {p.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                  title="Logout from LEXVAULT"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-sm transition-all"
              >
                Sign In
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
