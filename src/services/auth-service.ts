import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { Platform } from 'react-native';

import { getFirebaseAuth } from '@/config/firebase';
import { isEmail, MIN_PASSWORD } from '@/lib/validation';
import type { Session } from '@/types';

import { apiClient } from './api-client';

interface Profile {
  id: string;
  email: string;
  displayName: string;
  role: string;
  department?: string | null;
}

const PREVIEW_STORAGE_KEY = 'citypay_role_preview_v1';

export interface RolePreviewOverride {
  uid: string;
  role: string;
  department: string | null;
}

export async function saveRolePreviewOverride(override: RolePreviewOverride | null): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      if (!override) window.localStorage.removeItem(PREVIEW_STORAGE_KEY);
      else window.localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(override));
      return;
    }
    if (!override) await AsyncStorage.removeItem(PREVIEW_STORAGE_KEY);
    else await AsyncStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(override));
  } catch {
    // non-blocking
  }
}

async function readRolePreviewOverride(uid: string): Promise<RolePreviewOverride | null> {
  try {
    const raw =
      Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem(PREVIEW_STORAGE_KEY)
        : await AsyncStorage.getItem(PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RolePreviewOverride;
    return parsed?.uid === uid ? parsed : null;
  } catch {
    return null;
  }
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

let inflightProfilePromise: Promise<Profile> | null = null;

async function fetchProfileWithRetry(): Promise<Profile> {
  if (inflightProfilePromise) return inflightProfilePromise;
  inflightProfilePromise = (async () => {
    try {
      return await apiClient<Profile>('/users/me');
    } catch {
      await new Promise((r) => setTimeout(r, 400));
      return await apiClient<Profile>('/users/me');
    } finally {
      inflightProfilePromise = null;
    }
  })();
  return inflightProfilePromise;
}

/**
 * Construye la sesión verificando el rol y departamento en el backend.
 * Si en desarrollo el usuario activó una simulación de rol/coordinación, la respeta.
 */
async function toSession(user: FirebaseUser): Promise<Session> {
  const fallbackName = user.displayName || user.email?.split('@')[0] || 'Usuario';
  const override = __DEV__ ? await readRolePreviewOverride(user.uid) : null;
  try {
    const p = await fetchProfileWithRetry();
    return {
      uid: user.uid,
      email: p.email || user.email || '',
      displayName: p.displayName || fallbackName,
      role: override?.role ?? (p.role || 'citizen'),
      department: override ? override.department : (p.department ?? null),
    };
  } catch {
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: fallbackName,
      role: override?.role ?? 'citizen',
      department: override ? override.department : null,
    };
  }
}

function assertEmail(email: string) {
  if (!isEmail(email)) throw new Error('Ingresa un correo electrónico válido.');
}

export const authService = {
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
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      } catch (createErr: any) {
        if (createErr?.code === 'auth/email-already-in-use') {
          try {
            cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
          } catch {
            throw createErr;
          }
        } else {
          throw createErr;
        }
      }
      const name = displayName?.trim() || email.trim().split('@')[0];
      await updateProfile(cred.user, { displayName: name }).catch(() => {});
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
      if ((err as { code?: string })?.code === 'auth/user-not-found') return;
      throw friendly(err, 'No se pudo enviar el correo de recuperación.');
    }
  },

  async signOut(): Promise<void> {
    await saveRolePreviewOverride(null);
    await signOut(getFirebaseAuth()).catch(() => {});
  },
};
