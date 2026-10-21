import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authService } from '@/services/auth-service';
import type { Session } from '@/types';

interface AuthValue {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((userSession) => {
      setSession(userSession);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await authService.signIn(email, password);
    setSession(res);
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const res = await authService.signUp(email, password, displayName);
    setSession(res);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    await authService.sendPasswordReset(email);
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, loading, signIn, signUp, sendPasswordReset, signOut }),
    [session, loading, signIn, signUp, sendPasswordReset, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
