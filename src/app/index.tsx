import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth/auth-context';

export default function Index() {
  const { session, loading } = useAuth();
  if (loading) return null;
  return session ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}
