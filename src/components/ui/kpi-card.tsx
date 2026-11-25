import { StyleSheet, Text, View } from 'react-native';

import { FONT, RADIUS } from '@/constants/colors';
import { useTheme } from '@/features/theme/theme-context';

import { Icon, type IconName } from '../icon';
import { cardShadow } from './styles';

export function KpiCard({ icon, label, value, sub }: { icon: IconName; label: string; value: string; sub?: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={[s.kpi, { backgroundColor: colors.white, borderColor: colors.border }]}
      accessible
      accessibilityLabel={`${label}: ${value}${sub ? ` ${sub}` : ''}.`}>
      <View style={[s.icon, { backgroundColor: colors.blueIcon }]}>
        <Icon name={icon} color={colors.blue} />
      </View>
      <Text style={[s.label, { color: colors.text2 }]}>{label}</Text>
      <Text style={[s.value, { color: colors.text1 }]}>{value}</Text>
      {sub ? <Text style={[s.sub, { color: colors.text3 }]}>{sub}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  kpi: { flex: 1, padding: 13, borderRadius: RADIUS, borderWidth: 1, ...cardShadow },
  icon: { width: 36, height: 36, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  label: { fontFamily: FONT.sansSemi, fontSize: 12.5, lineHeight: 16, marginBottom: 4 },
  value: { fontFamily: FONT.displayXBold, fontSize: 21, letterSpacing: -0.4 },
  sub: { fontFamily: FONT.sans, fontSize: 12, marginTop: 2 },
});
