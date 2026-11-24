import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/auth-context';
import { PaymentsScreen } from '@/features/reconciliation/payments-screen';

export default function Payments() {
  const { staff } = useAuth();
  // The tab is hidden for citizens; this also covers deep links to /payments.
  if (!staff) return <Redirect href="/" />;
  return <PaymentsScreen />;
}
