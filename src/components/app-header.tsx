import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C, FONT } from '@/constants/colors';
import { notAvailable } from '@/components/not-available';

import { Icon } from './icon';

/** White top strip: menu · logo · notifications · avatar. Safe-area padding is applied by the parent. */
export function AppHeader({
  logo,
  initial,
  badgeCount,
  dot,
  onAvatarPress,
}: {
  logo: React.ReactNode;
  initial?: string;
  badgeCount?: number;
  dot?: boolean;
  onAvatarPress?: () => void;
}) {
  return (
    <View style={s.header}>
      <Pressable accessibilityLabel="Menú" hitSlop={8} onPress={() => notAvailable('Menú')} style={s.burger}>
        <View style={[s.bar, { width: 22 }]} />
        <View style={[s.bar, { width: 15 }]} />
        <View style={[s.bar, { width: 22 }]} />
      </Pressable>
      {logo}
      <View style={s.right}>
        <Pressable accessibilityLabel="Notificaciones" hitSlop={8} onPress={() => notAvailable('Notificaciones')}>
          <Icon name="bell" size={22} color={C.text1} />
          {dot ? <View style={s.dot} /> : null}
          {badgeCount ? (
            <View style={s.badge}>
              <Text style={s.badgeText}>{badgeCount}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable accessibilityLabel="Perfil" onPress={onAvatarPress} style={[s.avatar, initial ? { backgroundColor: C.blue } : null]}>
          {initial ? <Text style={s.avatarText}>{initial}</Text> : <Icon name="user" size={16} color={C.blue} />}
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: C.white, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  burger: { gap: 4.5, paddingVertical: 2 },
  bar: { height: 2, borderRadius: 2, backgroundColor: C.text1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { position: 'absolute', top: 1, right: 1, width: 7, height: 7, borderRadius: 4, backgroundColor: C.blueMid, borderWidth: 1.5, borderColor: C.white },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 14, height: 14, borderRadius: 7, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  badgeText: { fontFamily: FONT.sansBold, fontSize: 8.5, color: '#fff' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONT.displayBold, fontSize: 13, color: C.white },
});
