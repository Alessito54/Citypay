import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';

import { getFirebaseAuth } from '@/config/firebase';
import { isEmail, MIN_PASSWORD } from '@/lib/validation';
import type { Session } from '@/types';

import { apiClient } from './api-client';

interface Profile {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.',
  'auth/invalid-email': 'El formato del correo no es válido.',
  'auth/email-already-in-use': 'Ya existe una cuenta con este correo.',
  'auth/weak-password': `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`,
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet e inténtalo de nuevo.',
};

function friendly(err: unknown, fallback: string): Error {
  const code = (err as { code?: string })?.code;
  if (code && FIREBASE_ERRORS[code]) return new Error(FIREBASE_ERRORS[code]);
  return err instanceof Error && err.message ? err : new Error(fallback);
}

/**
 * The role always comes from the backend. If the backend cannot be reached the session is
 * still created as a citizen (least privilege), never as staff.
 */
async function toSession(user: FirebaseUser): Promise<Session> {
  const fallbackName = user.displayName || user.email?.split('@')[0] || 'Usuario';
  try {
    const p = await apiClient<Profile>('/users/me');
    return { uid: user.uid, email: p.email || user.email || '', displayName: p.displayName || fallbackName, role: p.role || 'citizen' };
  } catch {
    return { uid: user.uid, email: user.email || '', displayName: fallbackName, role: 'citizen' };
  }
}

function assertEmail(email: string) {
  if (!isEmail(email)) throw new Error('Ingresa un correo electrónico válido.');
}

export const authService = {
  /** Restores the session on app launch and reports sign-in / sign-out. */
  subscribe(callback: (session: Session | null) => void): () => void {
    try {
      return onAuthStateChanged(getFirebaseAuth(), async (user) => callback(user ? await toSession(user) : null));
    } catch {
      callback(null);
      return () => {};
    }
  },

  async signIn(email: string, password: string): Promise<Session> {
    assertEmail(email);
    if (!password) throw new Error('Ingresa tu contraseña.');
    try {
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      return await toSession(cred.user);
    } catch (err) {
      throw friendly(err, 'No se pudo iniciar sesión.');
    }
  },

  async signUp(email: string, password: string, displayName?: string): Promise<Session> {
    assertEmail(email);
    if (password.length < MIN_PASSWORD) throw new Error(FIREBASE_ERRORS['auth/weak-password']);
    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      const name = displayName?.trim() || email.trim().split('@')[0];
      await updateProfile(cred.user, { displayName: name }).catch(() => {});
      // Refresh the token so the backend receives the new display name.
      await cred.user.getIdToken(true).catch(() => {});
      return await toSession(cred.user);
    } catch (err) {
      throw friendly(err, 'No se pudo crear la cuenta.');
    }
  },

  async sendPasswordReset(email: string): Promise<void> {
    assertEmail(email);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
    } catch (err) {
      // Do not reveal whether an account exists for this email.
      if ((err as { code?: string })?.code === 'auth/user-not-found') return;
      throw friendly(err, 'No se pudo enviar el correo de recuperación.');
    }
  },

  async signOut(): Promise<void> {
    await signOut(getFirebaseAuth()).catch(() => {});
  },
};
