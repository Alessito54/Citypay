import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function getMissingConfigKeys() {
  return Object.entries(firebaseConfig)
    .filter(([key, value]) => key !== 'measurementId' && !value)
    .map(([key]) => key);
}

/**
 * Initializes Firebase only when a caller explicitly requests it.
 * Server-only credentials must never be placed in this client bundle.
 */
export function getFirebaseApp(): FirebaseApp {
  const missingKeys = getMissingConfigKeys();
  if (missingKeys.length > 0) {
    throw new Error(`Faltan variables de Firebase: ${missingKeys.join(', ')}`);
  }

  return getApps()[0] ?? initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

