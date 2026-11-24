import type { FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

/** Web: Firebase keeps the session in IndexedDB by default. */
export function createAuth(app: FirebaseApp): Auth {
  return getAuth(app);
}
