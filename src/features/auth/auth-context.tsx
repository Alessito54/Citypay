import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getPermissions, isStaff, type RolePermissions } from '@/lib/roles';
import { authService, saveRolePreviewOverride } from '@/services/auth-service';
import { usersService } from '@/services/users-service';
import type { Session } from '@/types';

interface AuthValue {
  session: Session | null;
  loading: boolean;
  staff: boolean;
  permissions: RolePermissions;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Cambia el rol/coordinación activo para evaluar permisos por área del Ayuntamiento de Orizaba. */
  switchRolePreview: (role: string, department: string | null) => Promise<void>;
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

  const switchRolePreview = useCallback(async (role: string, department: string | null) => {
    const cleanDept = role === 'citizen' ? null : department;
    try {
      await usersService.updateMyPreviewRole({ role, department: cleanDept });
      await saveRolePreviewOverride(null);
    } catch {
      // Si el servidor remoto está en producción o aún no expone /me/role-preview, guarda vista previa local en dev
    }
    setSession((prev) => {
      if (!prev) return prev;
      const next: Session = { ...prev, role, department: cleanDept };
      if (__DEV__) {
        void saveRolePreviewOverride({ uid: prev.uid, role, department: cleanDept });
      }
      return next;
    });
  }, []);

  const permissions = useMemo(() => getPermissions(session), [session]);

  const value = useMemo(
    () => ({
      session,
      loading,
      staff: isStaff(session?.role),
      permissions,
      signIn,
      signUp,
      sendPasswordReset: authService.sendPasswordReset,
      signOut,
      switchRolePreview,
    }),
    [session, loading, permissions, signIn, signUp, signOut, switchRolePreview],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
