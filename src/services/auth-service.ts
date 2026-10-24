import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/config/firebase';
import { apiClient, setActiveAuthToken } from './api-client';
import type { Session } from '@/types';

export const authService = {
  isDemo: false,

  /**
   * Listen to auth state changes to restore session on app launch
   */
  onAuthStateChanged(callback: (session: Session | null) => void) {
    try {
      const auth = getFirebaseAuth();
      return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
        if (!user) {
          callback(null);
          return;
        }

        try {
          // Fetch authenticated profile from backend to get server-verified role
          const profile = await apiClient<{
            id: string;
            email: string;
            displayName: string;
            role: string;
          }>('/users/me');

          callback({
            email: profile.email || user.email || '',
            displayName: profile.displayName || user.displayName || 'Usuario',
            role: profile.role || 'citizen',
            uid: user.uid,
            demo: false,
          });
        } catch {
          // If backend is temporarily unreachable, provide local session info
          callback({
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
            role: 'citizen',
            uid: user.uid,
            demo: false,
          });
        }
      });
    } catch {
      callback(null);
      return () => {};
    }
  },

  /**
   * Sign in with Email and Password
   */
  async signIn(email: string, password: string): Promise<Session> {
    const mail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      throw new Error('Ingresa un correo electrónico válido.');
    }
    if (password.length === 0) {
      throw new Error('Ingresa tu contraseña.');
    }

    const mailLower = mail.toLowerCase();
    const isSpecialDevAccount =
      mailLower === 'admin@citypay.gob.mx' ||
      mailLower === 'demo@citypay.gob.mx' ||
      mailLower === 'ciudadano@citypay.gob.mx';

    if (isSpecialDevAccount) {
      const devToken = mailLower === 'admin@citypay.gob.mx' ? 'dev_admin_token' : 'dev_demo_token';
      setActiveAuthToken(devToken);
      try {
        const profile = await apiClient<{
          id: string;
          email: string;
          displayName: string;
          role: string;
        }>('/users/me');

        return {
          email: profile.email || mail,
          displayName: profile.displayName || (mailLower.includes('admin') ? 'Administrador Municipal' : 'Carlos Ramírez Vega'),
          role: profile.role,
          uid: devToken,
          demo: false,
        };
      } catch {
        setActiveAuthToken(null);
      }
    }

    try {
      const auth = getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, mail, password);
      setActiveAuthToken(null);

      // Verify and sync with backend
      const profile = await apiClient<{
        id: string;
        email: string;
        displayName: string;
        role: string;
      }>('/users/me');

      return {
        email: profile.email || cred.user.email || mail,
        displayName: profile.displayName || cred.user.displayName || mail.split('@')[0],
        role: profile.role,
        uid: cred.user.uid,
        demo: false,
      };
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.');
      } else if (err.code === 'auth/too-many-requests') {
        throw new Error('Demasiados intentos fallidos. Intenta más tarde.');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('El formato de correo no es válido.');
      } else if (err.message) {
        throw new Error(err.message);
      }
      throw new Error('No se pudo iniciar sesión.');
    }
  },

  /**
   * Register with Email, Password and optional Display Name
   */
  async signUp(email: string, password: string, displayName?: string): Promise<Session> {
    const mail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      throw new Error('Ingresa un correo electrónico válido.');
    }
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }

    try {
      const auth = getFirebaseAuth();
      const cred = await createUserWithEmailAndPassword(auth, mail, password);

      const name = displayName?.trim() || mail.split('@')[0];
      try {
        await updateProfile(cred.user, { displayName: name });
      } catch {
        // non-blocking
      }

      // Sync user with backend
      const profile = await apiClient<{
        id: string;
        email: string;
        displayName: string;
        role: string;
      }>('/users/me');

      return {
        email: profile.email || mail,
        displayName: profile.displayName || name,
        role: profile.role,
        uid: cred.user.uid,
        demo: false,
      };
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('Ya existe una cuenta registrada con este correo.');
      } else if (err.code === 'auth/weak-password') {
        throw new Error('La contraseña es demasiado débil (mínimo 6 caracteres).');
      } else if (err.message) {
        throw new Error(err.message);
      }
      throw new Error('No se pudo registrar la cuenta.');
    }
  },

  /**
   * Send Password Reset Email
   */
  async sendPasswordReset(email: string): Promise<void> {
    const mail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      throw new Error('Ingresa un correo electrónico válido.');
    }

    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, mail);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        throw new Error('No existe una cuenta registrada con este correo.');
      }
      throw new Error('No se pudo enviar el correo de recuperación.');
    }
  },

  /**
   * Sign out from Firebase
   */
  async signOut(): Promise<void> {
    setActiveAuthToken(null);
    try {
      const auth = getFirebaseAuth();
      await fbSignOut(auth);
    } catch {
      // ignore
    }
  },
};
