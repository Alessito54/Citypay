import type React from 'react';
import { Redirect, router, Tabs, usePathname } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { cardShadow } from '@/components/ui';
import { FONT } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { TransactionReviewHost } from '@/features/reconciliation/transaction-review';
import { useTheme } from '@/features/theme/theme-context';

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Inicio', icon: 'home' },
  payments: { label: 'Pagos', icon: 'card' },
  reports: { label: 'Reportes', icon: 'chat' },
  orizaba: { label: 'Guía', icon: 'bulb' },
  profile: { label: 'Perfil', icon: 'user' },
};

type TabPath = '/' | '/payments' | '/reports' | '/orizaba' | '/profile';

function TabBar({ state, emitter, navigateToTab, showPaymentsTab }: BottomTabBarProps & { showPaymentsTab: boolean }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const visible = state.routes.filter(
    (r) => TABS[r.name] && (r.name !== 'payments' || showPaymentsTab),
  );
  return (
    <View
      style={[
        s.bar,
        {
          paddingBottom: 8 + insets.bottom,
          backgroundColor: colors.white,
          borderTopColor: colors.border,
        },
      ]}>
      {visible.map((route, i) => {
        const cfg = TABS[route.name];
        const active = state.routes[state.index]?.key === route.key;
        const color = active ? colors.blue : colors.text3;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={`${cfg.label}, pestaña ${i + 1} de ${visible.length}`}
            accessibilityState={{ selected: active }}
            onPress={() => {
              const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!active && !e.defaultPrevented) navigateToTab(route.key);
            }}
            style={[s.item, active && { borderTopColor: colors.blue }]}>
            <Icon name={cfg.icon} size={22} color={color} />
            <Text style={[s.label, { color, fontFamily: active ? FONT.sansBold : FONT.sansMedium }]}>{cfg.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { session, staff, permissions } = useAuth();
  const { colors } = useTheme();
  const pathname = usePathname();

  const showPaymentsTab = !staff || permissions.canViewPayments;
  const tabPaths = useMemo<TabPath[]>(
    () => (showPaymentsTab ? ['/', '/payments', '/reports', '/orizaba', '/profile'] : ['/', '/reports', '/orizaba', '/profile']),
    [showPaymentsTab],
  );

  const normalizedPath: TabPath = useMemo(() => {
    if (pathname === '/payments') return '/payments';
    if (pathname === '/reports') return '/reports';
    if (pathname === '/orizaba') return '/orizaba';
    if (pathname === '/profile') return '/profile';
    return '/';
  }, [pathname]);

  const currentIdx = Math.max(0, tabPaths.indexOf(normalizedPath));
  const prevIdxRef = useRef(currentIdx);
  const [slideX] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const prev = prevIdxRef.current;
    if (prev !== currentIdx) {
      const dir = currentIdx > prev ? 1 : -1;
      prevIdxRef.current = currentIdx;
      slideX.setValue(dir * 28);
      fade.setValue(0.86);
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: 0,
          duration: 190,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 190,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentIdx, slideX, fade]);

  const stepTab = useCallback(
    (delta: number) => {
      const nextIdx = currentIdx + delta;
      if (nextIdx >= 0 && nextIdx < tabPaths.length) {
        router.navigate(tabPaths[nextIdx]);
      }
    },
    [currentIdx, tabPaths],
  );

  const swipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-24, 24])
        .failOffsetY([-18, 18])
        .onEnd((e) => {
          if (e.translationX < -50 || e.velocityX < -420) {
            stepTab(1);
          } else if (e.translationX > 50 || e.velocityX > 420) {
            stepTab(-1);
          }
        }),
    [stepTab],
  );

  if (!session) return <Redirect href="/login" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateX: slideX }] }}>
          <Tabs
            tabBar={(p) => <TabBar {...p} showPaymentsTab={showPaymentsTab} />}
            screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
            <Tabs.Screen name="index" />
            <Tabs.Screen name="payments" />
            <Tabs.Screen name="reports" />
            <Tabs.Screen name="orizaba" />
            <Tabs.Screen name="profile" />
          </Tabs>
        </Animated.View>
      </GestureDetector>
      {staff && permissions.canViewPayments ? <TransactionReviewHost /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, ...cardShadow },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4, paddingTop: 8, minHeight: 56, borderTopWidth: 3, borderTopColor: 'transparent' },
  label: { fontSize: 11.5 },
});
