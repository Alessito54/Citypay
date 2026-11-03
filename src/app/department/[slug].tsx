import { Redirect, useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/features/auth/auth-context';
import { DepartmentDetailScreen } from '@/features/departments/department-detail-screen';

export default function DepartmentDetail() {
  const { session } = useAuth();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  if (!session) return <Redirect href="/login" />;
  if (!slug) return <Redirect href="/departments" />;
  return <DepartmentDetailScreen slug={slug} />;
}
