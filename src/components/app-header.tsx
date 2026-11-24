import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C, FONT, RADIUS, TOUCH } from '@/constants/colors';

/**
 * White top strip: logo · avatar (opens the profile). Safe-area padding is applied by the parent.
 *
 * The bell was removed: it only opened a "not available" alert and showed an invented
 * unread count. It comes back when the backend has notifications.
 */
export function AppHeader({ logo, initial, onAvatarPress }: { logo: React.ReactNode; initial?: string; onAvatarPress?: () => void }) {
  return (
    <View style={s.header}>
      <View accessible accessibilityRole="header" accessibilityLabel="CityPay">
        {logo}
      </View>
      {onAvatarPress ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Ir a mi perfil" onPress={onAvatarPress} style={s.btn}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial || '?'}</Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: C.white, paddingLeft: 18, paddingRight: 8, paddingTop: 4, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.border },
  btn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 34, height: 34, borderRadius: RADIUS, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONT.displayBold, fontSize: 14, color: C.white },
});
