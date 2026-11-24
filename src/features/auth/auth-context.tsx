import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isStaff } from '@/lib/roles';
import { authService } from '@/services/auth-service';
import type { Session } from '@/types';

interface AuthValue {
  session: Session | null;
  /** true until Firebase reports whether a stored session exists. */
  loading: boolean;
  /** Staff roles see payments and reconciliation; citizens only reports. */
  staff: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      authService.subscribe((s) => {
        setSession(s);
        setLoading(false);
      }),
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    setSession(await authService.signIn(email, password));
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setSession(await authService.signUp(email, password, displayName));
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      staff: isStaff(session?.role),
      signIn,
      signUp,
      sendPasswordReset: authService.sendPasswordReset,
      signOut,
    }),
    [session, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
