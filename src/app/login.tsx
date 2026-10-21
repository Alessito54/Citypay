import { router } from 'expo-router';

import { LoginScreen } from '@/features/auth/login-screen';

export default function Login() {
  return <LoginScreen onSuccess={() => router.replace('/loading')} />;
}
