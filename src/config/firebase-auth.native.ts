import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import type { Auth, Persistence } from 'firebase/auth';

/**
 * iOS/Android: without an explicit persistence Firebase keeps the session in memory,
 * so the user had to sign in again every time the app was reopened.
 * `getReactNativePersistence` only exists in the React Native build that Metro resolves;
 * the public typings do not declare it.
 */
const { getReactNativePersistence } = FirebaseAuth as unknown as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

export function createAuth(app: FirebaseApp): Auth {
  try {
    return FirebaseAuth.initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // Already initialized (fast refresh): reuse the existing instance.
    return FirebaseAuth.getAuth(app);
  }
}
