import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/features/auth/auth-context';
import { ReconciliationProvider } from '@/features/reconciliation/reconciliation-context';
import { ReportsProvider } from '@/features/reports/reports-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ReconciliationProvider>
          <ReportsProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" options={{ animation: 'fade' }} />
              <Stack.Screen name="loading" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="new-report" />
            </Stack>
          </ReportsProvider>
        </ReconciliationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
