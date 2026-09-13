import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/authApi';
import { getToken, setToken } from '../services/apiClient';
import type { AuthStatus, User } from '../types/domain';

export type AuthStatus2 = 'loading' | 'authed' | 'unauthed' | 'bootstrapping';

interface AuthContextValue {
  status: AuthStatus2;
  user: User | null;
  bootstrap: (payload: { name: string; email: string; password: string }) => Promise<void>;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus2>('loading');
  const [user, setUser] = useState<User | null>(null);
  const qc = useQueryClient();

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      // No token — check whether this is a fresh install (bootstrap).
      try {
        const s: AuthStatus = await authApi.status();
        setStatus(s.bootstrapped ? 'unauthed' : 'bootstrapping');
      } catch {
        setStatus('unauthed');
      }
      setUser(null);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
      setStatus('authed');
    } catch {
      setToken(null);
      setUser(null);
      setStatus('unauthed');
      qc.clear();
    }
  }, [qc]);

  useEffect(() => { void refresh(); }, [refresh]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    refresh,
    bootstrap: async (payload) => {
      const res = await authApi.bootstrap(payload);
      setToken(res.token);
      setUser(res.user);
      setStatus('authed');
    },
    login: async (payload) => {
      const res = await authApi.login(payload);
      setToken(res.token);
      setUser(res.user);
      setStatus('authed');
    },
    logout: () => {
      setToken(null);
      qc.clear();
      setUser(null);
      // Force a status re-check (covers the "fresh install" case too).
      void refresh();
    },
  }), [status, user, refresh, qc]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
