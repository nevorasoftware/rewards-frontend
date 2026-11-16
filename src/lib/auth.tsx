'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, session } from './api';
import type { AuthResponse, Role, User } from './types';

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { businessName: string; slug?: string; email: string; password: string }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function homeFor(role: Role): string {
  if (role === 'SUPER_ADMIN') return '/admin';
  if (role === 'BUSINESS_STAFF') return '/dashboard/scanner';
  return '/dashboard';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(session.getUser());
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const auth = await api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false });
    session.save(auth);
    setUser(auth.user);
    return auth.user;
  }, []);

  const register = useCallback(async (data: { businessName: string; slug?: string; email: string; password: string }) => {
    const auth = await api<AuthResponse>('/auth/register', { method: 'POST', body: data, auth: false });
    session.save(auth);
    setUser(auth.user);
    return auth.user;
  }, []);

  const logout = useCallback(() => {
    session.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** Redirects to /login (or the user's home) when the role is not allowed. */
export function useRequireRole(roles: Role[]): User | null {
  const { user, ready } = useAuth();
  const router = useRouter();
  const allowed = Boolean(user && roles.includes(user.role));
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login');
    else if (!roles.includes(user.role)) router.replace(homeFor(user.role));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, router]);
  return allowed ? user : null;
}
