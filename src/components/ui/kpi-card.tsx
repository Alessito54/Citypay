import { StyleSheet, Text, View } from 'react-native';

import { C, FONT, RADIUS } from '@/constants/colors';

import { Icon, type IconName } from '../icon';
import { cardShadow, surface } from './styles';

/** Metric tile. Shows only values that come from data: no invented trends. */
export function KpiCard({ icon, label, value, sub }: { icon: IconName; label: string; value: string; sub?: string }) {
  return (
    <View style={s.kpi} accessible accessibilityLabel={`${label}: ${value}${sub ? ` ${sub}` : ''}.`}>
      <View style={s.icon}>
        <Icon name={icon} color={C.blue} />
      </View>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
      {sub ? <Text style={s.sub}>{sub}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  kpi: { flex: 1, padding: 13, ...surface, ...cardShadow },
  icon: { width: 36, height: 36, borderRadius: RADIUS, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  label: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text2, lineHeight: 16, marginBottom: 4 },
  value: { fontFamily: FONT.displayXBold, fontSize: 21, color: C.text1, letterSpacing: -0.4 },
  sub: { fontFamily: FONT.sans, fontSize: 12, color: C.text3, marginTop: 2 },
});
