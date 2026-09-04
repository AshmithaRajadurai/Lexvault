import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, AlertCircle, Shield, Key, Eye } from 'lucide-react';
import { useAuth, UserRole, SEED_CREDENTIALS } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login, quickLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoadingRole, setQuickLoadingRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetRole: UserRole) => {
    setQuickLoadingRole(targetRole);
    setError(null);
    try {
      await quickLogin(targetRole);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Demo login failed');
    } finally {
      setQuickLoadingRole(null);
    }
  };

  const demoAccounts: { role: UserRole; title: string; icon: React.ReactNode; color: string }[] = [
    {
      role: 'Admin',
      title: 'Administrator',
      icon: <Shield className="w-4 h-4 text-purple-600" />,
      color: 'hover:border-purple-300 hover:bg-purple-50/50',
    },
    {
      role: 'Investigator',
      title: 'Investigator',
      icon: <Key className="w-4 h-4 text-blue-600" />,
      color: 'hover:border-blue-300 hover:bg-blue-50/50',
    },
    {
      role: 'Verifier',
      title: 'Auditor / Verifier',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
      color: 'hover:border-emerald-300 hover:bg-emerald-50/50',
    },
    {
      role: 'Viewer',
      title: 'Legal Counsel / Viewer',
      icon: <Eye className="w-4 h-4 text-slate-600" />,
      color: 'hover:border-slate-300 hover:bg-slate-100/50',
    },
  ];

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 font-mono">
            LEX<span className="text-emerald-600">VAULT</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
            Zero-Knowledge Forensic Registry & Chain of Custody
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Sign In to Evidence Vault</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your forensic credentials or select a one-click demo persona.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. investigator@lexvault.local"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 font-mono transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 font-mono transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!quickLoadingRole}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-mono text-[11px] font-medium">
                One-Click Demo Personas
              </span>
            </div>
          </div>

          {/* One-Click Demo Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            {demoAccounts.map((item) => {
              const creds = SEED_CREDENTIALS[item.role];
              const isCurrentLoading = quickLoadingRole === item.role;
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleQuickLogin(item.role)}
                  disabled={loading || !!quickLoadingRole}
                  className={`p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-left transition-all flex items-center gap-2.5 ${item.color} disabled:opacity-50`}
                >
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs shrink-0">
                    {isCurrentLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-600" /> : item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 font-mono truncate">{item.role}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{creds.password}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 font-mono">
              Default password format: <span className="font-semibold text-slate-700">[Role]@123</span> (e.g. <span className="text-emerald-700">Investigator@123</span>)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

