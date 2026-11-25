import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { AdminLogo, HeaderLogo } from '@/components/brand';
import { useAuth } from '@/features/auth/auth-context';
import { useTheme } from '@/features/theme/theme-context';

/** Header shared by the tab screens: logo by role, theme toggle and avatar. */
export function ScreenTop() {
  const insets = useSafeAreaInsets();
  const { session, staff } = useAuth();
  const { colors } = useTheme();
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.white }}>
      <AppHeader
        logo={staff ? <AdminLogo /> : <HeaderLogo />}
        initial={session?.displayName.charAt(0).toUpperCase()}
        onAvatarPress={() => router.navigate('/profile')}
      />
    </View>
  );
}
