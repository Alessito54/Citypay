import type React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { cardShadow } from '@/components/ui';
import { C, FONT } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { TransactionReviewHost } from '@/features/reconciliation/transaction-review';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Inicio', icon: 'home' },
  payments: { label: 'Pagos', icon: 'card' },
  reports: { label: 'Reportes', icon: 'chat' },
  profile: { label: 'Perfil', icon: 'user' },
};

function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingBottom: 8 + insets.bottom }]}>
      {state.routes.map((route, i) => {
        const cfg = TABS[route.name];
        if (!cfg) return null;
        const active = state.index === i;
        const color = active ? C.blue : C.text3;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
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
  return (
    <>
      <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="payments" />
        <Tabs.Screen name="reports" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <TransactionReviewHost />
    </>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, ...cardShadow },
  item: { alignItems: 'center', gap: 3, paddingHorizontal: 8, minWidth: 64 },
  label: { fontSize: 10 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.blue },
});
