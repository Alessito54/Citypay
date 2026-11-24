import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { C, FONT, RADIUS } from '@/constants/colors';
import type { ReportPrioridad } from '@/types';

import { PRIORIDADES } from './report-form';

export function PriorityPicker({ value, onChange }: { value: ReportPrioridad; onChange: (p: ReportPrioridad) => void }) {
  return (
    <View style={s.row} accessibilityRole="radiogroup">
      {PRIORIDADES.map((p) => {
        const on = value === p.id;
        return (
          <Pressable
            key={p.id}
            accessibilityRole="radio"
            accessibilityLabel={`Prioridad ${p.id}: ${p.hint}`}
            accessibilityState={{ checked: on }}
            onPress={() => onChange(p.id)}
            style={[s.option, { borderTopColor: p.mark }, on && s.on]}>
            <View style={s.title}>
              {on ? <Icon name="check" size={14} color={C.blue} strokeWidth={3} /> : null}
              <Text style={[s.text, on && { color: C.blue }]}>{p.id}</Text>
            </View>
            <Text style={s.hint}>{p.hint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  option: { flex: 1, minHeight: 60, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: C.inputBorder, borderTopWidth: 4 },
  on: { backgroundColor: C.blueSoft, borderWidth: 2, borderTopWidth: 4, borderColor: C.blue },
  title: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  hint: { fontFamily: FONT.sans, fontSize: 12, color: C.text2, textAlign: 'center' },
});
