import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from '../lib/api';
import { registerForPushNotifications, unregisterPushToken } from '../lib/push';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    unregisterPushToken();
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); return; }
    const me = await api.auth.me();
    setUser(me);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    (async () => {
      try { await refresh(); }
      catch { setToken(null); setUser(null); }
      finally { setLoading(false); }
    })();
  }, [refresh]);

  // Registers this device for push once there's an authenticated session to attach the token
  // to — a no-op on web, and harmless if it's still pending Firebase credentials (see
  // src/lib/push.ts).
  useEffect(() => { if (user) registerForPushNotifications(); }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { token, user: loggedInUser } = await api.auth.login(email, password);
      setToken(token);
      const me = await api.auth.me();
      setUser(me ?? { ...loggedInUser, institutional_id: loggedInUser.institutionalId, full_name: loggedInUser.name, status: 'active', avatar_url: null } as AuthUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
