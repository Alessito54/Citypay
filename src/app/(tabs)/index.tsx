import { useAuth } from '@/features/auth/auth-context';
import { HomeScreen } from '@/features/reconciliation/home-screen';
import { CitizenHomeScreen } from '@/features/reports/citizen-home-screen';

/** Staff see the reconciliation dashboard; citizens see their reports. */
export default function Home() {
  const { staff } = useAuth();
  return staff ? <HomeScreen /> : <CitizenHomeScreen />;
}
