import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { cardShadow } from '@/components/ui';
import { FONT, RADIUS } from '@/constants/colors';
import { useTheme } from '@/features/theme/theme-context';
import { getDepartment, resolveDepartmentForReport } from '@/lib/orizaba';
import type { Report } from '@/types';

import { EstadoBadge } from './estado-badge';

export function ReportCard({ r, onPress }: { r: Report; onPress: () => void }) {
  const { colors } = useTheme();
  const firstPhoto = r.fotos?.[0];
  const photoCount = r.fotos?.length ?? 0;
  const dept = getDepartment(r.department || resolveDepartmentForReport(r.categoria, r.title));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${r.title}. ${r.address}. Estado: ${r.estado}. Prioridad ${r.prioridad}. Área: ${dept?.shortName ?? r.categoria}. ${r.date}.`}
      accessibilityHint="Abre el detalle del reporte"
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        { backgroundColor: colors.white, borderColor: colors.border },
        pressed && { backgroundColor: colors.blueSoft },
      ]}>
      <View
        style={[s.thumb, { backgroundColor: colors.blueIcon }]}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden>
        {firstPhoto ? (
          <>
            <Image source={{ uri: firstPhoto }} style={StyleSheet.absoluteFill} contentFit="cover" />
            {photoCount > 1 ? (
              <View style={s.photoCount}>
                <Text style={s.photoCountText}>+{photoCount - 1}</Text>
              </View>
            ) : null}
          </>
        ) : (
          <Text style={{ fontSize: 26 }}>{r.icon}</Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={s.top}>
          <Text numberOfLines={2} style={[s.title, { color: colors.text1 }]}>
            {r.title}
          </Text>
          <EstadoBadge estado={r.estado} />
        </View>
        <Text numberOfLines={1} style={[s.addr, { color: colors.text2 }]}>
          {r.address}
        </Text>
        <View style={s.bottom}>
          <Text style={[s.date, { color: colors.text3 }]}>
            {r.date}
            {photoCount > 0 ? ` · 📷 ${photoCount}` : ''}
          </Text>
          <Text style={[s.cat, { color: colors.blue, backgroundColor: colors.blueSoft }]}>
            {dept ? dept.shortName : r.categoria}
          </Text>
        </View>
      </View>
      <Icon name="chevronRight" size={16} color={colors.text3} strokeWidth={2.4} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, alignItems: 'center', marginHorizontal: 18, marginBottom: 10, padding: 10, borderRadius: RADIUS, borderWidth: 1, ...cardShadow },
  thumb: { width: 60, height: 60, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoCount: { position: 'absolute', bottom: 0, right: 0, backgroundColor: 'rgba(11,23,54,0.82)', paddingHorizontal: 5, paddingVertical: 1 },
  photoCountText: { fontFamily: FONT.sansBold, fontSize: 10.5, color: '#fff' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 },
  title: { flex: 1, fontFamily: FONT.sansBold, fontSize: 14.5 },
  addr: { fontFamily: FONT.sans, fontSize: 13, marginTop: 2 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 6, flexWrap: 'wrap' },
  date: { flexShrink: 1, fontFamily: FONT.sans, fontSize: 12 },
  cat: { fontFamily: FONT.sansSemi, fontSize: 11.5, paddingVertical: 2, paddingHorizontal: 8, borderRadius: RADIUS, overflow: 'hidden' },
});
