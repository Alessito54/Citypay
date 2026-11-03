import type React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { cardShadow } from '@/components/ui';
import { C, FONT } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { TransactionReviewHost } from '@/features/reconciliation/transaction-review';
import { isStaffRole } from '@/types';

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Inicio', icon: 'home' },
  payments: { label: 'Pagos', icon: 'card' },
  reports: { label: 'Reportes', icon: 'chat' },
  departments: { label: 'Áreas', icon: 'settings' },
  profile: { label: 'Perfil', icon: 'user' },
};

/** Departments are a municipal workspace, so the tab is only shown to staff. */
const STAFF_ONLY = new Set(['departments']);

function TabBar({ state, navigation, staff }: BottomTabBarProps & { staff: boolean }) {
  const insets = useSafeAreaInsets();
  const visible = state.routes.filter(
    (route) => TABS[route.name] && (staff || !STAFF_ONLY.has(route.name)),
  );
  return (
    <View style={[s.bar, { paddingBottom: 8 + insets.bottom }]}>
      {visible.map((route, i) => {
        const cfg = TABS[route.name];
        const active = state.routes[state.index]?.key === route.key;
        const color = active ? C.blue : C.text3;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={`${cfg.label}, pestaña ${i + 1} de ${visible.length}`}
            accessibilityState={{ selected: active }}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!active && !e.defaultPrevented) navigation.navigate(route.name);
            }}
            style={s.item}>
            <Icon name={cfg.icon} size={22} color={color} fill={active && cfg.icon === 'chat' ? C.blueIcon : 'none'} />
            <Text style={[s.label, { color, fontFamily: active ? FONT.sansBold : FONT.sansMedium }]}>{cfg.label}</Text>
            {active ? <View style={s.dot} /> : <View style={[s.dot, { backgroundColor: 'transparent' }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { session } = useAuth();
  if (!session) return <Redirect href="/login" />;
  const staff = isStaffRole(session.role);
  return (
    <>
      <Tabs tabBar={(p) => <TabBar {...p} staff={staff} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="payments" />
        <Tabs.Screen name="reports" />
        <Tabs.Screen name="departments" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <TransactionReviewHost />
    </>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6, ...cardShadow },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4, minHeight: 52 },
  label: { fontSize: 12 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.blue },
});
