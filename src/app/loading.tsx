import { Redirect, router } from 'expo-router';
import { useCallback } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { LoadingScreen } from '@/features/auth/loading-screen';

export default function Loading() {
  const { session } = useAuth();
  const done = useCallback(() => router.replace('/(tabs)'), []);
  if (!session) return <Redirect href="/login" />;
  return <LoadingScreen onDone={done} />;
}
