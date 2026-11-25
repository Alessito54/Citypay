import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { FONT, RADIUS, TOUCH } from '@/constants/colors';
import { useTheme } from '@/features/theme/theme-context';

/**
 * Top strip: logo · dark mode toggle · avatar (opens the profile).
 * Safe-area padding is applied by the parent.
 */
export function AppHeader({
  logo,
  initial,
  onAvatarPress,
}: {
  logo: React.ReactNode;
  initial?: string;
  onAvatarPress?: () => void;
}) {
  const { dark, colors, toggleDark } = useTheme();
  return (
    <View style={[s.header, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
      <View accessible accessibilityRole="header" accessibilityLabel="CityPay">
        {logo}
      </View>
      <View style={s.right}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          onPress={toggleDark}
          style={[s.themeBtn, { backgroundColor: colors.blueSoft, borderColor: colors.border }]}>
          <Icon name={dark ? 'sun' : 'moon'} size={17} color={colors.blue} strokeWidth={2.2} />
        </Pressable>
        {onAvatarPress ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Ir a mi perfil" onPress={onAvatarPress} style={s.btn}>
            <View style={[s.avatar, { backgroundColor: colors.blue }]}>
              <Text style={[s.avatarText, { color: dark ? '#0B1220' : '#FFFFFF' }]}>{initial || '?'}</Text>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingLeft: 18,
    paddingRight: 8,
    paddingTop: 4,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  themeBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 34, height: 34, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONT.displayBold, fontSize: 14 },
});
