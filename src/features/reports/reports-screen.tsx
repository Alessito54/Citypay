import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { HeaderLogo } from '@/components/brand';
import { Icon, type IconName } from '@/components/icon';
import { LocationMap } from '@/components/map/location-map';
import { cardShadow, EmptyState, PrimaryButton, SelectField } from '@/components/ui';
import { C, FONT, TOUCH } from '@/constants/colors';
import type { Report, ReportEstado } from '@/types';

import { useReports } from './reports-context';

const ESTADO_STYLE: Record<ReportEstado, { bg: string; fg: string; dot: string }> = {
  Nuevo: { bg: C.blueSoft, fg: C.blue, dot: C.blue },
  'En proceso': { bg: '#FEF3C7', fg: '#92400E', dot: '#B45309' },
  Asignado: { bg: C.blueChip, fg: C.blueChipText, dot: C.blueChipText },
  Resuelto: { bg: C.successSoft, fg: C.success, dot: C.success },
};

const ESTADOS = ['Todos', 'Nuevo', 'Asignado', 'En proceso', 'Resuelto'];
const PRIORIDADES = ['Todas', 'Alta', 'Media', 'Baja'];

export function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { reports } = useReports();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Todos');
  const [est, setEst] = useState('Todos');
  const [pri, setPri] = useState('Todas');
  const [detail, setDetail] = useState<Report | null>(null);

  const categorias = useMemo(() => ['Todos', ...Array.from(new Set(reports.map((r) => r.categoria)))], [reports]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return reports.filter(
      (r) =>
        (cat === 'Todos' || r.categoria === cat) &&
        (est === 'Todos' || r.estado === est) &&
        (pri === 'Todas' || r.prioridad === pri) &&
        (!term || `${r.title} ${r.address} ${r.categoria}`.toLowerCase().includes(term)),
    );
  }, [reports, q, cat, est, pri]);

  const count = (e: ReportEstado) => reports.filter((r) => r.estado === e).length;
  const activeFilters = [cat !== 'Todos', est !== 'Todos', pri !== 'Todas', q.trim() !== ''].filter(Boolean).length;
  const clearAll = () => {
    setQ('');
    setCat('Todos');
    setEst('Todos');
    setPri('Todas');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.white }}>
        <AppHeader logo={<HeaderLogo />} badgeCount={3} onAvatarPress={() => router.navigate('/profile')} />
      </View>
      <FlatList
        data={list}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <View style={{ paddingHorizontal: 18, paddingTop: 16, gap: 12 }}>
              <View>
                <Text accessibilityRole="header" style={s.h1}>
                  Reportes
                </Text>
                <Text style={s.sub}>Reporta un problema de tu ciudad o consulta su seguimiento.</Text>
              </View>
              {/* Primary task first: it used to sit below four filters. */}
              <PrimaryButton accessibilityLabel="Crear nuevo reporte" onPress={() => router.push('/new-report')}>
                <Icon name="send" size={16} color="#fff" />
                <Text style={s.btnText}>Nuevo reporte</Text>
              </PrimaryButton>
            </View>

            <View style={s.kpis}>
              <Kpi label="Total" value={reports.length} icon="file" on={est === 'Todos'} onPress={() => setEst('Todos')} />
              <Kpi label="Nuevos" value={count('Nuevo')} icon="clock" on={est === 'Nuevo'} onPress={() => setEst('Nuevo')} />
              <Kpi label="En proceso" value={count('En proceso')} icon="tool" on={est === 'En proceso'} onPress={() => setEst('En proceso')} />
              <Kpi label="Resueltos" value={count('Resuelto')} icon="check" on={est === 'Resuelto'} onPress={() => setEst('Resuelto')} />
            </View>

            <View style={s.filters}>
              <View style={s.search}>
                <Icon name="search" size={18} color={C.text2} />
                <TextInput
                  value={q}
                  onChangeText={setQ}
                  accessibilityLabel="Buscar reportes"
                  accessibilityHint="Busca por problema, dirección o categoría"
                  placeholder="Problema, calle o categoría"
                  placeholderTextColor={C.text3}
                  returnKeyType="search"
                  style={s.searchInput}
                />
                {q ? (
                  <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={() => setQ('')} style={s.clear}>
                    <Icon name="xCircle" size={18} color={C.text2} />
                  </Pressable>
                ) : null}
              </View>
              <View style={s.pair}>
                <SelectField label="Categoría" value={cat} onChange={setCat} options={categorias} active={cat !== 'Todos'} />
                <SelectField label="Estado" value={est} onChange={setEst} options={ESTADOS} active={est !== 'Todos'} />
                <SelectField label="Prioridad" value={pri} onChange={setPri} options={PRIORIDADES} active={pri !== 'Todas'} />
              </View>
              <View style={s.resultRow}>
                <Text style={s.result} accessibilityLiveRegion="polite">
                  {list.length} {list.length === 1 ? 'reporte' : 'reportes'}
                  {activeFilters ? ` · ${activeFilters} filtro${activeFilters > 1 ? 's' : ''} activo${activeFilters > 1 ? 's' : ''}` : ''}
                </Text>
                {activeFilters ? (
                  <Pressable accessibilityRole="button" onPress={clearAll} style={s.clearAll}>
                    <Text style={s.clearAllText}>Limpiar filtros</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No hay reportes con esos filtros"
            body="Prueba con otra búsqueda o quita algunos filtros."
            actionLabel="Limpiar filtros"
            onAction={clearAll}
          />
        }
        renderItem={({ item }) => <ReportCard r={item} onPress={() => setDetail(item)} />}
      />
      <ReportDetail report={detail} onClose={() => setDetail(null)} />
    </View>
  );
}

function EstadoBadge({ estado }: { estado: ReportEstado }) {
  const st = ESTADO_STYLE[estado];
  return (
    <View style={[s.badge, { backgroundColor: st.bg }]}>
      <View style={[s.badgeDot, { backgroundColor: st.dot }]} />
      <Text style={[s.badgeText, { color: st.fg }]}>{estado}</Text>
    </View>
  );
}

function ReportCard({ r, onPress }: { r: Report; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${r.title}. ${r.address}. Estado: ${r.estado}. Prioridad ${r.prioridad}. ${r.categoria}. ${r.date}${r.localOnly ? '. Guardado solo en este dispositivo' : ''}.`}
      accessibilityHint="Abre el detalle del reporte"
      onPress={onPress}
      style={({ pressed }) => [s.card, pressed && { backgroundColor: C.blueSoft }]}>
      <View style={s.thumb}>
        <Text style={{ fontSize: 26 }}>{r.icon}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={s.cardTop}>
          <Text numberOfLines={2} style={s.cardTitle}>
            {r.title}
          </Text>
          <EstadoBadge estado={r.estado} />
        </View>
        <Text numberOfLines={1} style={s.addr}>
          {r.address}
        </Text>
        <View style={s.cardBottom}>
          <Text style={s.date}>
            {r.date}
            {r.localOnly ? ' · solo en este dispositivo' : ''}
          </Text>
          <Text style={s.cat}>{r.categoria}</Text>
        </View>
      </View>
      <Icon name="chevronRight" size={16} color={C.text3} strokeWidth={2.4} />
    </Pressable>
  );
}

/** Report detail sheet. Previously tapping a report only showed a "not available" alert. */
function ReportDetail({ report, onClose }: { report: Report | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  if (!report) return null;
  const steps: ReportEstado[] = ['Nuevo', 'Asignado', 'En proceso', 'Resuelto'];
  const current = steps.indexOf(report.estado);
  const rows = [
    { label: 'Categoría', value: report.categoria },
    { label: 'Prioridad', value: report.prioridad },
    { label: 'Ubicación', value: report.address },
    { label: 'Fecha', value: report.date },
  ];
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar detalle" />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]} accessibilityViewIsModal>
          <View style={s.handle} />
          <View style={s.sheetHead}>
            <View style={s.thumbSm}>
              <Text style={{ fontSize: 22 }}>{report.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text accessibilityRole="header" style={s.sheetTitle}>
                {report.title}
              </Text>
              <View style={{ marginTop: 4, flexDirection: 'row' }}>
                <EstadoBadge estado={report.estado} />
              </View>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar detalle" onPress={onClose} style={s.closeBtn}>
              <View style={s.closeCircle}>
                <Icon name="x" size={16} color={C.text1} strokeWidth={2.4} />
              </View>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, gap: 14 }}>
            <View accessible accessibilityLabel={`Seguimiento: paso ${current + 1} de ${steps.length}, ${report.estado}`}>
              <Text style={s.blockLabel}>Seguimiento</Text>
              <View style={s.steps}>
                {steps.map((st, i) => {
                  const done = i <= current;
                  return (
                    <View key={st} style={s.step}>
                      <View style={[s.stepDot, done && { backgroundColor: C.blue, borderColor: C.blue }]}>
                        {done ? <Icon name="check" size={11} color="#fff" strokeWidth={3} /> : null}
                      </View>
                      <Text style={[s.stepText, done && { color: C.text1, fontFamily: FONT.sansSemi }]}>{st}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
            {report.latitude != null && report.longitude != null ? (
              <LocationMap
                coords={{ latitude: report.latitude, longitude: report.longitude }}
                interactive={false}
                height={170}
                accessibilityLabel={`Mapa con la ubicación del reporte: ${report.address}`}
              />
            ) : null}
            <View style={s.infoBox}>
              {rows.map((row, i) => (
                <View
                  key={row.label}
                  accessible
                  accessibilityLabel={`${row.label}: ${row.value}`}
                  style={[s.infoRow, i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
                  <Text style={s.infoLabel}>{row.label}</Text>
                  <Text style={s.infoValue}>{row.value}</Text>
                </View>
              ))}
            </View>
            {report.localOnly ? (
              <Text style={s.localNote}>Este reporte se guardó solo en este dispositivo (modo demostración).</Text>
            ) : null}
            <Pressable accessibilityRole="button" onPress={onClose} style={s.doneBtn}>
              <Text style={s.doneBtnText}>Cerrar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Kpi({ label, value, icon, on, onPress }: { label: string; value: number; icon: IconName; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. ${on ? 'Filtro aplicado' : 'Mostrar solo estos'}`}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={({ pressed }) => [s.kpi, on && s.kpiOn, pressed && { opacity: 0.85 }]}>
      <View style={[s.kpiIcon, on && { backgroundColor: '#fff' }]}>
        <Icon name={icon} size={18} color={C.blue} />
      </View>
      <View style={{ minWidth: 0, flexShrink: 1 }}>
        <Text style={s.kpiLabel}>{label}</Text>
        <Text style={s.kpiValue}>{value}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: FONT.displayXBold, fontSize: 26, color: C.navy },
  sub: { fontFamily: FONT.sans, fontSize: 14, color: C.text2, marginTop: 3, lineHeight: 19 },
  btnText: { fontFamily: FONT.sansBold, fontSize: 15, color: '#fff' },
  kpis: { paddingHorizontal: 18, paddingTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: { width: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, minHeight: 64, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, ...cardShadow },
  kpiOn: { borderColor: C.blue, borderWidth: 1.5, backgroundColor: C.blueSoft },
  kpiIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  kpiLabel: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text2 },
  kpiValue: { fontFamily: FONT.displayXBold, fontSize: 22, color: C.navy },
  filters: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6, gap: 10 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingLeft: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.inputBorder },
  searchInput: { flex: 1, minWidth: 0, minHeight: 46, fontFamily: FONT.sans, fontSize: 16, color: C.text1, paddingVertical: 0 },
  clear: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  pair: { flexDirection: 'row', gap: 8 },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, minHeight: TOUCH },
  result: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.text2 },
  clearAll: { minHeight: TOUCH, justifyContent: 'center' },
  clearAllText: { fontFamily: FONT.sansSemi, fontSize: 14, color: C.blue, textDecorationLine: 'underline' },
  card: { flexDirection: 'row', gap: 12, alignItems: 'center', marginHorizontal: 18, marginBottom: 10, padding: 10, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, ...cardShadow },
  thumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 },
  cardTitle: { flex: 1, fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: FONT.sansBold, fontSize: 12 },
  addr: { fontFamily: FONT.sans, fontSize: 13, color: C.text2, marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 6, flexWrap: 'wrap' },
  date: { flexShrink: 1, fontFamily: FONT.sans, fontSize: 12, color: C.text3 },
  cat: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.blue, backgroundColor: C.blueSoft, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, overflow: 'hidden' },
  backdrop: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.sheetHandle, marginTop: 12, marginBottom: 4 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 18, paddingRight: 8, paddingBottom: 12 },
  thumbSm: { width: 48, height: 48, borderRadius: 12, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontFamily: FONT.displayXBold, fontSize: 18, color: C.text1 },
  closeBtn: { width: TOUCH + 4, height: TOUCH + 4, alignItems: 'center', justifyContent: 'center' },
  closeCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.screen, alignItems: 'center', justifyContent: 'center' },
  blockLabel: { fontFamily: FONT.sansBold, fontSize: 14, color: C.text1, marginBottom: 8 },
  steps: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  stepDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.inputBorder, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: FONT.sans, fontSize: 12, color: C.text2, textAlign: 'center' },
  infoBox: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 10 },
  infoLabel: { fontFamily: FONT.sans, fontSize: 14, color: C.text2 },
  infoValue: { fontFamily: FONT.sansSemi, fontSize: 14, color: C.text1, textAlign: 'right', flexShrink: 1 },
  localNote: { fontFamily: FONT.sans, fontSize: 13, color: C.text2, textAlign: 'center' },
  doneBtn: { minHeight: 48, borderRadius: 12, borderWidth: 2, borderColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { fontFamily: FONT.sansBold, fontSize: 15, color: C.blue },
});
