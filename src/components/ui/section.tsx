import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C, FONT, TOUCH } from '@/constants/colors';

export function Section({
  label,
  link,
  linkHint,
  onLinkPress,
  children,
}: {
  label: string;
  link?: string;
  linkHint?: string;
  onLinkPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={s.section}>
      <View style={s.head}>
        <Text accessibilityRole="header" style={s.label}>
          {label}
        </Text>
        {link ? (
          <Pressable
            onPress={onLinkPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${link}: ${label}`}
            accessibilityHint={linkHint}
            style={s.linkBtn}>
            <Text style={s.link}>{link}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  section: { paddingHorizontal: 18, paddingTop: 16 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontFamily: FONT.sansBold, fontSize: 16, color: C.text1, flexShrink: 1 },
  linkBtn: { minHeight: TOUCH, justifyContent: 'center', paddingLeft: 12 },
  link: { fontFamily: FONT.sansSemi, fontSize: 14, color: C.blue, textDecorationLine: 'underline' },
});
