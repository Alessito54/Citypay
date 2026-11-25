import { StyleSheet, Text, View } from 'react-native';

import { FONT, RADIUS } from '@/constants/colors';
import { useTheme } from '@/features/theme/theme-context';

export type InfoRow = { label: string; value: string; mono?: boolean };

export function InfoList({ rows }: { rows: InfoRow[] }) {
  const { colors } = useTheme();
  return (
    <View style={[s.box, { backgroundColor: colors.white, borderColor: colors.border }]}>
      {rows.map((row, i) => (
        <View
          key={row.label}
          accessible
          accessibilityLabel={`${row.label}: ${row.value}`}
          style={[s.row, i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
          <Text style={[s.label, { color: colors.text2 }]}>{row.label}</Text>
          <Text style={[s.value, { color: colors.text1 }, row.mono && { fontFamily: FONT.monoMedium }]}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  box: { borderRadius: RADIUS, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 10 },
  label: { fontFamily: FONT.sans, fontSize: 14 },
  value: { fontFamily: FONT.sansSemi, fontSize: 14, textAlign: 'right', flexShrink: 1 },
});
