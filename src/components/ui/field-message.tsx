import { StyleSheet, Text, View } from 'react-native';

import { C, FONT } from '@/constants/colors';

import { Icon, type IconName } from '../icon';

export type MessageTone = 'error' | 'info' | 'success';

/** Inline validation / status message. Announced by screen readers when it appears. */
export function FieldMessage({ text, tone = 'error' }: { text?: string | null; tone?: MessageTone }) {
  if (!text) return null;
  const color = tone === 'error' ? C.danger : tone === 'success' ? C.success : C.blue;
  const icon: IconName = tone === 'error' ? 'warn' : tone === 'success' ? 'check' : 'bulb';
  return (
    <View style={s.msg} accessibilityLiveRegion="polite" accessibilityRole={tone === 'error' ? 'alert' : 'text'} accessible>
      <Icon name={icon} size={14} color={color} strokeWidth={2.2} />
      <Text style={[s.text, { color }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  msg: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 2 },
  text: { flex: 1, fontFamily: FONT.sansSemi, fontSize: 13, lineHeight: 18 },
});
