import type React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { cardShadow } from '@/components/ui';
import { C, FONT } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { TransactionReviewHost } from '@/features/reconciliation/transaction-review';

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; icon: IconName; staffOnly?: boolean }> = {
  index: { label: 'Inicio', icon: 'home' },
  payments: { label: 'Pagos', icon: 'card', staffOnly: true },
  reports: { label: 'Reportes', icon: 'chat' },
  profile: { label: 'Perfil', icon: 'user' },
};

function TabBar({ state, emitter, navigateToTab, staff }: BottomTabBarProps & { staff: boolean }) {
  const insets = useSafeAreaInsets();
  const visible = state.routes.filter((r) => TABS[r.name] && (staff || !TABS[r.name].staffOnly));
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
              const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!active && !e.defaultPrevented) navigateToTab(route.key);
            }}
            style={[s.item, active && s.itemOn]}>
            <Icon name={cfg.icon} size={22} color={color} />
            <Text style={[s.label, { color, fontFamily: active ? FONT.sansBold : FONT.sansMedium }]}>{cfg.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { session, staff } = useAuth();
  if (!session) return <Redirect href="/login" />;
  return (
    <>
      <Tabs tabBar={(p) => <TabBar {...p} staff={staff} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="payments" />
        <Tabs.Screen name="reports" />
        <Tabs.Screen name="profile" />
      </Tabs>
      {staff ? <TransactionReviewHost /> : null}
    </>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border, ...cardShadow },
  // Active tab: square accent bar on top instead of the former round dot.
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4, paddingTop: 8, minHeight: 56, borderTopWidth: 3, borderTopColor: 'transparent' },
  itemOn: { borderTopColor: C.blue, backgroundColor: C.blueSoft },
  label: { fontSize: 12 },
});
