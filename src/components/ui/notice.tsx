import { StyleSheet, Text, View } from 'react-native';

import { FONT, RADIUS } from '@/constants/colors';
import { useTheme } from '@/features/theme/theme-context';

/** Full-width strip that explains the state of the data shown (e.g. demo data, offline). */
export function Notice({ text, tone = 'info' }: { text: string; tone?: 'info' | 'warning' }) {
  const { dark, colors } = useTheme();
  const warn = tone === 'warning';
  return (
    <View
      style={[
        s.box,
        {
          backgroundColor: warn ? colors.dangerSoft : colors.blueIcon,
          borderLeftColor: warn ? colors.danger : colors.blue,
        },
      ]}
      accessibilityRole="text"
      accessibilityLiveRegion="polite">
      <Text style={[s.text, { color: warn ? (dark ? colors.danger : '#7F1D1D') : colors.blue }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIUS, borderLeftWidth: 4 },
  text: { fontFamily: FONT.sansSemi, fontSize: 13, lineHeight: 18 },
});
