import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { FONT, RADIUS } from '@/constants/colors';
import { useTheme } from '@/features/theme/theme-context';

import { Icon, type IconName } from '../icon';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

export function Button({
  label,
  variant = 'primary',
  icon,
  onPress,
  disabled,
  loading,
  accessibilityLabel,
  accessibilityHint,
  style,
}: {
  label: string;
  variant?: ButtonVariant;
  icon?: IconName;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { dark, colors } = useTheme();
  const inactive = disabled || loading;

  const variants = {
    primary: {
      box: { backgroundColor: colors.blue, borderColor: colors.blue },
      pressed: { backgroundColor: dark ? colors.blueMid : colors.navy },
      fg: dark ? '#0B1220' : '#FFFFFF',
    },
    secondary: {
      box: { backgroundColor: colors.white, borderColor: colors.blue },
      pressed: { backgroundColor: colors.blueSoft },
      fg: colors.blue,
    },
    quiet: {
      box: { backgroundColor: colors.white, borderColor: colors.inputBorder },
      pressed: { backgroundColor: colors.screen },
      fg: colors.text1,
    },
  } as const;

  const v = variants[variant];
  const fg = disabled && !loading ? colors.disabledText : v.fg;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        s.base,
        v.box,
        pressed && v.pressed,
        disabled && !loading && { backgroundColor: colors.disabledBg, borderColor: colors.disabledBg },
        style,
      ]}>
      {loading ? <ActivityIndicator color={fg} size="small" /> : icon ? <Icon name={icon} size={18} color={fg} strokeWidth={2.2} /> : null}
      <Text style={[s.text, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: RADIUS,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  text: { fontFamily: FONT.sansBold, fontSize: 15, flexShrink: 1, textAlign: 'center' },
});
