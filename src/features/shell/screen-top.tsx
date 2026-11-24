import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { AdminLogo, HeaderLogo } from '@/components/brand';
import { C } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';

/** Header shared by the tab screens: logo by role and the avatar that opens the profile. */
export function ScreenTop() {
  const insets = useSafeAreaInsets();
  const { session, staff } = useAuth();
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: C.white }}>
      <AppHeader
        logo={staff ? <AdminLogo /> : <HeaderLogo />}
        initial={session?.displayName.charAt(0).toUpperCase()}
        onAvatarPress={() => router.navigate('/profile')}
      />
    </View>
  );
}
