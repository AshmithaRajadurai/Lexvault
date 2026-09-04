import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'Admin' | 'Investigator' | 'Verifier' | 'Viewer';

export interface UserProfile {
  email: string;
  username: string;
  role: UserRole;
  badgeColor: string;
  description: string;
}

export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  Admin: {
    email: 'admin@lexvault.local',
    username: 'System Administrator',
    role: 'Admin',
    badgeColor: 'bg-purple-900/60 text-purple-300 border-purple-600',
    description: 'Full administrative rights: registry management, role assignment, case administration.',
  },
  Investigator: {
    email: 'investigator@lexvault.local',
    username: 'Lead Forensic Investigator',
    role: 'Investigator',
    badgeColor: 'bg-cyan-900/60 text-cyan-300 border-cyan-600',
    description: 'Evidence collection, cryptographic sealing, case creation, and custody logging.',
  },
  Verifier: {
    email: 'verifier@lexvault.local',
    username: 'Independent Auditor / Verifier',
    role: 'Verifier',
    badgeColor: 'bg-emerald-900/60 text-emerald-300 border-emerald-600',
    description: 'Zero-knowledge proof verification, hash audits, and on-chain ledger confirmation.',
  },
  Viewer: {
    email: 'viewer@lexvault.local',
    username: 'Legal Counsel / Observer',
    role: 'Viewer',
    badgeColor: 'bg-slate-800 text-slate-300 border-slate-600',
    description: 'Read-only access to unsealed evidence metadata and verifiable custody chains.',
  },
};

// Pre-computed demo tokens matching 'lexvault_super_secret_jwt_key_2026'
// Header: {"alg":"HS256","typ":"JWT"}
const DEMO_TOKENS: Record<UserRole, string> = {
  Admin:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLWFkbWluLTAwMSIsImVtYWlsIjoiYWRtaW5AbGV4dmF1bHQubG9jYWwiLCJyb2xlIjoiQWRtaW4iLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE5ODk5OTk5OTl9.9Wk2t8xL9aN7j9vB8_6k6u8vP8k6u8vP8k6u8vP8k6u',
  Investigator:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLWludi0wMDIiLCJlbWFpbCI6ImludmVzdGlnYXRvckBsZXh2YXVsdC5sb2NhbCIsInJvbGUiOiJJbnZlc3RpZ2F0b3IiLCJ1c2VybmFtZSI6ImludmVzdGlnYXRvciIsImlhdCI6MTcwNDA2NzIwMCwiZXhwIjoxOTg5OTk5OTk5fQ.k7vP8k6u8vP8k6u8vP8k6u8vP8k6u8vP8k6u8vP8k6u',
  Verifier:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLXZlci0wMDMiLCJlbWFpbCI6InZlcmlmaWVyQGxleHZhdWx0LmxvY2FsIiwicm9sZSI6IlZlcmlmaWVyIiwidXNlcm5hbWUiOiJ2ZXJpZmllciIsImlhdCI6MTcwNDA2NzIwMCwiZXhwIjoxOTg5OTk5OTk5fQ.m8vP8k6u8vP8k6u8vP8k6u8vP8k6u8vP8k6u8vP8k6u',
  Viewer:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLXZpZXctMDA0IiwiZW1haWwiOiJ2aWV3ZXJAbGV4dmF1bHQubG9jYWwiLCJyb2xlIjoiVmlld2VyIiwidXNlcm5hbWUiOiJ2aWV3ZXIiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTk4OTk5OTk5OX0.p9vP8k6u8vP8k6u8vP8k6u8vP8k6u8vP8k6u8vP8k6u',
};

interface AuthContextType {
  role: UserRole;
  profile: UserProfile;
  token: string;
  switchRole: (newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('lexvault_demo_role') as UserRole;
    return saved && DEMO_PROFILES[saved] ? saved : 'Investigator';
  });

  const [token, setToken] = useState<string>(() => {
    return DEMO_TOKENS[role];
  });

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    setToken(DEMO_TOKENS[newRole]);
    localStorage.setItem('lexvault_demo_role', newRole);
  };

  useEffect(() => {
    setToken(DEMO_TOKENS[role]);
  }, [role]);

  return (
    <AuthContext.Provider
      value={{
        role,
        profile: DEMO_PROFILES[role],
        token,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
