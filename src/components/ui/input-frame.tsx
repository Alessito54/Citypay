import { StyleSheet, View } from 'react-native';

import { C, FONT, RADIUS } from '@/constants/colors';
import { useTheme } from '@/features/theme/theme-context';

import { Icon, type IconName } from '../icon';

/** Bordered row that hosts a TextInput plus a leading icon and optional trailing buttons. */
export function InputFrame({ icon, error, children }: { icon?: IconName; error?: boolean; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        s.frame,
        { backgroundColor: colors.white, borderColor: colors.inputBorder },
        error && { borderColor: colors.danger, borderWidth: 1.5, backgroundColor: colors.dangerSoft },
      ]}>
      {icon ? <Icon name={icon} size={18} color={error ? colors.danger : colors.blueMid} /> : null}
      {children}
    </View>
  );
}

/** Style for the TextInput inside an InputFrame. */
export const inputText = {
  flex: 1,
  minWidth: 0,
  minHeight: 48,
  fontFamily: FONT.sans,
  fontSize: 16,
  color: C.text1,
  paddingVertical: 0,
  paddingRight: 12,
} as const;

/** Error look for standalone inputs (e.g. multiline) that do not use InputFrame. */
export const inputError = { borderColor: C.danger, borderWidth: 1.5, backgroundColor: C.dangerSoft } as const;

const s = StyleSheet.create({
  frame: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 12, minHeight: 50, borderRadius: RADIUS, borderWidth: 1 },
});
