import { Redirect, useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/features/auth/auth-context';
import { InformesScreen } from '@/features/analytics/informes-screen';
import { isStaffRole } from '@/types';

export default function Informes() {
  const { session } = useAuth();
  const { department } = useLocalSearchParams<{ department?: string }>();
  if (!session) return <Redirect href="/login" />;
  // The Centro de Informes is a municipal tool; a citizen has no figures there.
  if (!isStaffRole(session.role)) return <Redirect href="/(tabs)" />;
  return <InformesScreen initialDepartment={department} />;
}
