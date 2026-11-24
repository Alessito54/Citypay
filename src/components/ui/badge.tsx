import { StyleSheet, Text, View } from 'react-native';

import { FONT, RADIUS } from '@/constants/colors';

/** Status label: always text plus a symbol, so meaning never depends on color alone. */
export function Badge({ label, symbol, bg, fg }: { label: string; symbol?: string; bg: string; fg: string }) {
  return (
    <View style={[s.badge, { backgroundColor: bg, borderLeftColor: fg }]}>
      <Text style={[s.text, { color: fg }]}>
        {symbol ? `${symbol} ` : ''}
        {label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { paddingVertical: 3, paddingLeft: 6, paddingRight: 8, borderRadius: RADIUS, borderLeftWidth: 3, alignSelf: 'flex-start' },
  text: { fontFamily: FONT.sansBold, fontSize: 12 },
});
