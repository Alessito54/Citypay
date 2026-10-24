import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C, FONT, TOUCH } from '@/constants/colors';
import { notAvailable } from '@/components/not-available';

import { Icon } from './icon';

/**
 * White top strip: logo · notifications · avatar. Safe-area padding is applied by the parent.
 *
 * The former hamburger menu was removed: it only opened a "not available" alert and
 * duplicated the bottom tab bar, so it was a dead end in usability tests.
 */
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
  const unread = badgeCount ?? (dot ? 1 : 0);
  const bellLabel = unread > 0 ? `Notificaciones, ${badgeCount ? `${badgeCount} nuevas` : 'hay nuevas'}` : 'Notificaciones';
  return (
    <View style={s.header}>
      <View accessible accessibilityRole="header" accessibilityLabel="CityPay">
        {logo}
      </View>
      <View style={s.right}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={bellLabel}
          onPress={() => notAvailable('Notificaciones')}
          style={s.iconBtn}>
          <View>
            <Icon name="bell" size={22} color={C.text1} />
            {dot && !badgeCount ? <View style={s.dot} /> : null}
            {badgeCount ? (
              <View style={s.badge}>
                <Text style={s.badgeText}>{badgeCount}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
        {onAvatarPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ir a mi perfil"
            onPress={onAvatarPress}
            style={s.iconBtn}>
            <View style={[s.avatar, initial ? { backgroundColor: C.blue } : null]}>
              {initial ? <Text style={s.avatarText}>{initial}</Text> : <Icon name="user" size={16} color={C.blue} />}
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: C.white, paddingLeft: 18, paddingRight: 8, paddingTop: 4, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.border },
  right: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 1, right: 1, width: 8, height: 8, borderRadius: 4, backgroundColor: C.danger, borderWidth: 1.5, borderColor: C.white },
  badge: { position: 'absolute', top: -5, right: -7, minWidth: 18, height: 18, paddingHorizontal: 3, borderRadius: 9, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  badgeText: { fontFamily: FONT.sansBold, fontSize: 11, color: '#fff' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONT.displayBold, fontSize: 14, color: C.white },
});
