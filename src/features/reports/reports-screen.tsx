import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { HeaderLogo } from '@/components/brand';
import { Icon, type IconName } from '@/components/icon';
import { notAvailable } from '@/components/not-available';
import { cardShadow, PrimaryButton, SelectField } from '@/components/ui';
import { C, FONT } from '@/constants/colors';
import type { Report, ReportEstado } from '@/types';

import { useReports } from './reports-context';

const ESTADO_STYLE: Record<ReportEstado, { bg: string; fg: string; dot: string }> = {
  Nuevo: { bg: C.blueSoft, fg: C.blue, dot: C.blue },
  'En proceso': { bg: C.blueIcon, fg: C.blue, dot: C.blueMid },
  Asignado: { bg: C.blueChip, fg: C.blueChipText, dot: C.blueChipText },
  Resuelto: { bg: C.blue, fg: '#fff', dot: '#fff' },
};

const ESTADOS = ['Todos', 'Nuevo', 'Asignado', 'En proceso', 'Resuelto'];
const PRIORIDADES = ['Todas', 'Alta', 'Media', 'Baja'];
const PERIODOS = ['Últimos 30 días', 'Últimos 7 días', 'Hoy'];

export function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { reports } = useReports();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Todos');
  const [est, setEst] = useState('Todos');
  const [pri, setPri] = useState('Todas');
  const [per, setPer] = useState(PERIODOS[0]);

  const categorias = useMemo(() => ['Todos', ...Array.from(new Set(reports.map((r) => r.categoria)))], [reports]);

  const list = useMemo(
    () =>
      reports.filter(
        (r) =>
          (cat === 'Todos' || r.categoria === cat) &&
          (est === 'Todos' || r.estado === est) &&
          (pri === 'Todas' || r.prioridad === pri) &&
          (!q || `${r.title} ${r.address}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [reports, q, cat, est, pri],
  );

  const count = (e: ReportEstado) => reports.filter((r) => r.estado === e).length;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.white }}>
        <AppHeader logo={<HeaderLogo />} badgeCount={3} onAvatarPress={() => router.navigate('/profile')} />
      </View>
      <FlatList
        data={list}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
              <Text style={s.h1}>Reportes</Text>
              <Text style={s.sub}>Gestiona y da seguimiento a los reportes ciudadanos.</Text>
            </View>
            <View style={s.kpis}>
              <Kpi label="Total de reportes" value={`${reports.length}`} icon="file" />
              <Kpi label="Nuevos" value={`${count('Nuevo')}`} icon="clock" />
              <Kpi label="En proceso" value={`${count('En proceso')}`} icon="settings" />
              <Kpi label="Resueltos" value={`${count('Resuelto')}`} icon="check" />
            </View>
            <View style={s.filters}>
              <View style={s.search}>
                <Icon name="search" size={16} color={C.text3} />
                <TextInput
                  value={q}
                  onChangeText={setQ}
                  placeholder="Buscar por reporte o ubicación"
                  placeholderTextColor={C.text3}
                  style={s.searchInput}
                />
              </View>
              <View style={s.pair}>
                <SelectField label="Categoría" value={cat} onChange={setCat} options={categorias} />
                <SelectField label="Estado" value={est} onChange={setEst} options={ESTADOS} />
              </View>
              <View style={s.pair}>
                <SelectField label="Prioridad" value={pri} onChange={setPri} options={PRIORIDADES} />
                <SelectField label="Periodo" value={per} onChange={setPer} options={PERIODOS} />
              </View>
              <PrimaryButton label="+ Nuevo reporte" onPress={() => router.push('/new-report')} />
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={s.empty}>No hay reportes con esos filtros.</Text>}
        renderItem={({ item }) => <ReportCard r={item} />}
      />
    </View>
  );
}

function ReportCard({ r }: { r: Report }) {
  const st = ESTADO_STYLE[r.estado];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => notAvailable('Detalle del reporte')}
      style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]}>
      <View style={s.thumb}>
        <Text style={{ fontSize: 26 }}>{r.icon}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={s.cardTop}>
          <Text numberOfLines={1} style={s.cardTitle}>{r.title}</Text>
          <View style={[s.badge, { backgroundColor: st.bg }]}>
            <View style={[s.badgeDot, { backgroundColor: st.dot }]} />
            <Text style={[s.badgeText, { color: st.fg }]}>{r.estado}</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={s.addr}>{r.address}</Text>
        <View style={s.cardBottom}>
          <Text style={s.date}>{r.date}{r.localOnly ? ' · solo en este dispositivo' : ''}</Text>
          <Text style={s.cat}>{r.categoria}</Text>
        </View>
      </View>
      <Icon name="chevronRight" size={14} color={C.text3} />
    </Pressable>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  return (
    <View style={s.kpi}>
      <View style={s.kpiIcon}>
        <Icon name={icon} size={18} color={C.blue} />
      </View>
      <View style={{ minWidth: 0 }}>
        <Text style={s.kpiLabel}>{label}</Text>
        <Text style={s.kpiValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: FONT.displayXBold, fontSize: 26, color: C.navy },
  sub: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text2, marginTop: 3 },
  kpis: { paddingHorizontal: 18, paddingTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, ...cardShadow },
  kpiIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  kpiLabel: { fontFamily: FONT.sansSemi, fontSize: 10.5, color: C.text2 },
  kpiValue: { fontFamily: FONT.displayXBold, fontSize: 22, color: C.navy },
  filters: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12, gap: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, minWidth: 0, fontFamily: FONT.sans, fontSize: 12.5, color: C.text1, paddingVertical: 0 },
  pair: { flexDirection: 'row', gap: 8 },
  empty: { textAlign: 'center', fontFamily: FONT.sans, fontSize: 12.5, color: C.text2, padding: 24 },
  card: { flexDirection: 'row', gap: 12, alignItems: 'center', marginHorizontal: 18, marginBottom: 10, padding: 10, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, ...cardShadow },
  thumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 },
  cardTitle: { flex: 1, fontFamily: FONT.sansBold, fontSize: 13.5, color: C.text1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999 },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontFamily: FONT.sansBold, fontSize: 10 },
  addr: { fontFamily: FONT.sans, fontSize: 11, color: C.text2, marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 6 },
  date: { flexShrink: 1, fontFamily: FONT.sans, fontSize: 10, color: C.text3 },
  cat: { fontFamily: FONT.sansSemi, fontSize: 10, color: C.blue, backgroundColor: C.blueSoft, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, overflow: 'hidden' },
});
