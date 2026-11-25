import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/auth-context';
import { CitizenPaymentsScreen } from '@/features/citizen-payments/citizen-payments-screen';
import { PaymentsScreen } from '@/features/reconciliation/payments-screen';

export default function Payments() {
  const { staff, permissions } = useAuth();
  if (!staff) return <CitizenPaymentsScreen />;
  if (!permissions.canViewPayments) return <Redirect href="/" />;
  return <PaymentsScreen />;
}
