import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { cardShadow, surface } from '@/components/ui';
import { C, FONT, RADIUS } from '@/constants/colors';
import type { Report } from '@/types';

import { EstadoBadge } from './estado-badge';

export function ReportCard({ r, onPress }: { r: Report; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${r.title}. ${r.address}. Estado: ${r.estado}. Prioridad ${r.prioridad}. ${r.categoria}. ${r.date}.`}
      accessibilityHint="Abre el detalle del reporte"
      onPress={onPress}
      style={({ pressed }) => [s.card, pressed && { backgroundColor: C.blueSoft }]}>
      <View style={s.thumb} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text style={{ fontSize: 26 }}>{r.icon}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={s.top}>
          <Text numberOfLines={2} style={s.title}>
            {r.title}
          </Text>
          <EstadoBadge estado={r.estado} />
        </View>
        <Text numberOfLines={1} style={s.addr}>
          {r.address}
        </Text>
        <View style={s.bottom}>
          <Text style={s.date}>{r.date}</Text>
          <Text style={s.cat}>{r.categoria}</Text>
        </View>
      </View>
      <Icon name="chevronRight" size={16} color={C.text3} strokeWidth={2.4} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, alignItems: 'center', marginHorizontal: 18, marginBottom: 10, padding: 10, ...surface, ...cardShadow },
  thumb: { width: 60, height: 60, borderRadius: RADIUS, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 },
  title: { flex: 1, fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  addr: { fontFamily: FONT.sans, fontSize: 13, color: C.text2, marginTop: 2 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 6, flexWrap: 'wrap' },
  date: { flexShrink: 1, fontFamily: FONT.sans, fontSize: 12, color: C.text3 },
  cat: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.blue, backgroundColor: C.blueSoft, paddingVertical: 2, paddingHorizontal: 8, borderRadius: RADIUS, overflow: 'hidden' },
});
