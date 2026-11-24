import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { C, FONT, RADIUS } from '@/constants/colors';

import { Icon, type IconName } from '../icon';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

/**
 * The only button style in the app. Variants:
 * - primary: the main action of a screen or sheet (filled).
 * - secondary: alternative action (outlined).
 * - quiet: cancel / dismiss (neutral outline).
 */
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
  const inactive = disabled || loading;
  const v = VARIANTS[variant];
  const fg = disabled && !loading ? C.disabledText : v.fg;
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
        disabled && !loading && s.disabled,
        style,
      ]}>
      {loading ? <ActivityIndicator color={fg} size="small" /> : icon ? <Icon name={icon} size={18} color={fg} strokeWidth={2.2} /> : null}
      <Text style={[s.text, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const VARIANTS = {
  primary: { box: { backgroundColor: C.blue, borderColor: C.blue }, pressed: { backgroundColor: C.navy }, fg: '#fff' },
  secondary: { box: { backgroundColor: '#fff', borderColor: C.blue }, pressed: { backgroundColor: C.blueSoft }, fg: C.blue },
  quiet: { box: { backgroundColor: '#fff', borderColor: C.inputBorder }, pressed: { backgroundColor: C.screen }, fg: C.text1 },
} as const;

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
  disabled: { backgroundColor: C.disabledBg, borderColor: C.disabledBg },
  text: { fontFamily: FONT.sansBold, fontSize: 15, flexShrink: 1, textAlign: 'center' },
});
