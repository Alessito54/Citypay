import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/components/icon';
import { FieldMessage, InputFrame } from '@/components/ui';
import { C, FONT, TOUCH } from '@/constants/colors';

/** Visible label + bordered input + inline error. */
export function AuthField({ label, icon, error, children }: { label: string; icon: IconName; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label} importantForAccessibility="no" accessibilityElementsHidden>
        {label}
      </Text>
      <InputFrame icon={icon} error={!!error}>
        {children}
      </InputFrame>
      <FieldMessage text={error} />
    </View>
  );
}

export function TextLink({ label, onPress, align, bold }: { label: string; onPress: () => void; align?: 'flex-end' | 'center'; bold?: boolean }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={6} style={[s.link, align ? { alignSelf: align } : null]}>
      <Text style={[s.linkText, bold && { fontFamily: FONT.sansBold }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: FONT.sansSemi, fontSize: 13.5, color: C.text1 },
  link: { minHeight: TOUCH, justifyContent: 'center' },
  linkText: { fontFamily: FONT.sansSemi, fontSize: 14, color: C.blue, textDecorationLine: 'underline' },
});
