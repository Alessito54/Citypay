import { StyleSheet, Text, View } from 'react-native';

import { C, FONT } from '@/constants/colors';

import { surface } from './styles';

export type InfoRow = { label: string; value: string; mono?: boolean };

/** Label/value table used by the detail sheets. Each row is read as one sentence. */
export function InfoList({ rows }: { rows: InfoRow[] }) {
  return (
    <View style={s.box}>
      {rows.map((row, i) => (
        <View
          key={row.label}
          accessible
          accessibilityLabel={`${row.label}: ${row.value}`}
          style={[s.row, i < rows.length - 1 && s.divider]}>
          <Text style={s.label}>{row.label}</Text>
          <Text style={[s.value, row.mono && { fontFamily: FONT.monoMedium }]}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  box: { ...surface, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: C.border },
  label: { fontFamily: FONT.sans, fontSize: 14, color: C.text2 },
  value: { fontFamily: FONT.sansSemi, fontSize: 14, color: C.text1, textAlign: 'right', flexShrink: 1 },
});
