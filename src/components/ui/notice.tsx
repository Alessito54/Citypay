import { StyleSheet, Text, View } from 'react-native';

import { C, FONT, RADIUS } from '@/constants/colors';

/** Full-width strip that explains the state of the data shown (e.g. demo data, offline). */
export function Notice({ text, tone = 'info' }: { text: string; tone?: 'info' | 'warning' }) {
  const warn = tone === 'warning';
  return (
    <View style={[s.box, warn && s.warn]} accessibilityRole="text" accessibilityLiveRegion="polite">
      <Text style={[s.text, warn && { color: '#7F1D1D' }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIUS, backgroundColor: C.blueIcon, borderLeftWidth: 4, borderLeftColor: C.blue },
  warn: { backgroundColor: C.dangerSoft, borderLeftColor: C.danger },
  text: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.blue, lineHeight: 18 },
});
