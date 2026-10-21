import { Redirect, router } from 'expo-router';

import { useAuth } from '@/features/auth/auth-context';
import { NewReportScreen } from '@/features/reports/new-report-screen';

export default function NewReport() {
  const { session } = useAuth();
  if (!session) return <Redirect href="/login" />;
  return (
    <NewReportScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/reports'))}
      onSent={() => router.replace('/reports')}
    />
  );
}
