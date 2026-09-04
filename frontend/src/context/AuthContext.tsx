import React, { createContext, useContext, useState } from 'react';
import { loginUser } from '../services/api';

export type UserRole = 'Admin' | 'Investigator' | 'Verifier' | 'Viewer';

export interface UserProfile {
  email: string;
  username: string;
  role: UserRole;
  badgeColor: string;
  description: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export const SEED_CREDENTIALS: Record<UserRole, { email: string; password: string; roleName: string }> = {
  Admin: {
    email: 'admin@lexvault.local',
    password: 'Admin@123',
    roleName: 'System Administrator',
  },
  Investigator: {
    email: 'investigator@lexvault.local',
    password: 'Investigator@123',
    roleName: 'Lead Investigator',
  },
  Verifier: {
    email: 'verifier@lexvault.local',
    password: 'Verifier@123',
    roleName: 'Independent Auditor',
  },
  Viewer: {
    email: 'viewer@lexvault.local',
    password: 'Viewer@123',
    roleName: 'Legal Observer',
  },
};

export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  Admin: {
    email: 'admin@lexvault.local',
    username: 'System Administrator',
    role: 'Admin',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-300',
    description: 'Full administrative rights: registry management, role assignment, case administration.',
  },
  Investigator: {
    email: 'investigator@lexvault.local',
    username: 'Lead Forensic Investigator',
    role: 'Investigator',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-300',
    description: 'Evidence collection, cryptographic sealing, case creation, and custody logging.',
  },
  Verifier: {
    email: 'verifier@lexvault.local',
    username: 'Independent Auditor / Verifier',
    role: 'Verifier',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    description: 'Zero-knowledge proof verification, hash audits, and on-chain ledger confirmation.',
  },
  Viewer: {
    email: 'viewer@lexvault.local',
    username: 'Legal Counsel / Observer',
    role: 'Viewer',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    description: 'Read-only access to unsealed evidence metadata and verifiable custody chains.',
  },
};

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
  user: AuthUser | null;
  role: UserRole;
  profile: UserProfile;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickLogin: (targetRole: UserRole) => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('lexvault_jwt_token') || DEMO_TOKENS['Investigator'];
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem('lexvault_auth_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        // ignore
      }
    }
    const savedRole = (localStorage.getItem('lexvault_demo_role') as UserRole) || 'Investigator';
    const profile = DEMO_PROFILES[savedRole] || DEMO_PROFILES.Investigator;
    return {
      id: 'demo-user-id',
      username: profile.username,
      email: profile.email,
      role: profile.role,
    };
  });

  const role: UserRole = user?.role || 'Investigator';
  const profile: UserProfile = DEMO_PROFILES[role] || DEMO_PROFILES.Investigator;
  const isAuthenticated = !!token;

  const login = async (email: string, password: string) => {
    try {
      const data = await loginUser(email, password);
      const authenticatedUser: AuthUser = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role as UserRole,
      };
      setToken(data.token);
      setUser(authenticatedUser);
      localStorage.setItem('lexvault_jwt_token', data.token);
      localStorage.setItem('lexvault_auth_user', JSON.stringify(authenticatedUser));
      localStorage.setItem('lexvault_demo_role', data.user.role);
    } catch (err: any) {
      // Fallback matching seed credentials in case backend is in mock/offline mode
      const matchedRole = (Object.keys(SEED_CREDENTIALS) as UserRole[]).find(
        (r) => SEED_CREDENTIALS[r].email.toLowerCase() === email.toLowerCase() && SEED_CREDENTIALS[r].password === password
      );
      if (matchedRole) {
        const p = DEMO_PROFILES[matchedRole];
        const fallbackUser: AuthUser = {
          id: `usr-${matchedRole.toLowerCase()}`,
          username: p.username,
          email: p.email,
          role: matchedRole,
        };
        const demoToken = DEMO_TOKENS[matchedRole];
        setToken(demoToken);
        setUser(fallbackUser);
        localStorage.setItem('lexvault_jwt_token', demoToken);
        localStorage.setItem('lexvault_auth_user', JSON.stringify(fallbackUser));
        localStorage.setItem('lexvault_demo_role', matchedRole);
        return;
      }
      throw err;
    }
  };

  const quickLogin = async (targetRole: UserRole) => {
    const creds = SEED_CREDENTIALS[targetRole];
    await login(creds.email, creds.password);
  };

  const switchRole = (newRole: UserRole) => {
    const p = DEMO_PROFILES[newRole];
    const updatedUser: AuthUser = {
      id: `usr-${newRole.toLowerCase()}`,
      username: p.username,
      email: p.email,
      role: newRole,
    };
    const demoToken = DEMO_TOKENS[newRole];
    setToken(demoToken);
    setUser(updatedUser);
    localStorage.setItem('lexvault_jwt_token', demoToken);
    localStorage.setItem('lexvault_auth_user', JSON.stringify(updatedUser));
    localStorage.setItem('lexvault_demo_role', newRole);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('lexvault_jwt_token');
    localStorage.removeItem('lexvault_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        profile,
        token,
        isAuthenticated,
        login,
        quickLogin,
        switchRole,
        logout,
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
