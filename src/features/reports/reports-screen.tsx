import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Button, EmptyState, Notice, SearchField, SelectField, cardShadow, surface } from '@/components/ui';
import { C, FONT, RADIUS, TOUCH } from '@/constants/colors';
import { ScreenTop } from '@/features/shell/screen-top';
import type { Report, ReportEstado } from '@/types';

import { ReportCard } from './report-card';
import { ReportDetailSheet } from './report-detail-sheet';
import { activeFilterCount, ESTADO_FILTERS, filterReports, NO_FILTERS, PRIORIDAD_FILTERS, type ReportFilters } from './report-status';
import { useReports } from './reports-context';

export function ReportsScreen() {
  const { reports, source, loading } = useReports();
  const [f, setF] = useState<ReportFilters>(NO_FILTERS);
  const [detail, setDetail] = useState<Report | null>(null);
  const set = (patch: Partial<ReportFilters>) => setF((prev) => ({ ...prev, ...patch }));

  const categorias = useMemo(() => ['Todos', ...Array.from(new Set(reports.map((r) => r.categoria)))], [reports]);
  const list = useMemo(() => filterReports(reports, f), [reports, f]);
  const count = (e: ReportEstado) => reports.filter((r) => r.estado === e).length;
  const active = activeFilterCount(f);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenTop />
      <FlatList
        data={list}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <View style={s.head}>
              <View>
                <Text accessibilityRole="header" style={s.h1}>
                  Reportes
                </Text>
                <Text style={s.sub}>Reporta un problema de tu ciudad o consulta su seguimiento.</Text>
              </View>
              <Button icon="send" label="Nuevo reporte" accessibilityLabel="Crear nuevo reporte" onPress={() => router.push('/new-report')} />
              {source === 'demo' ? <Notice tone="warning" text="Sin conexión con el servidor: se muestran reportes de demostración." /> : null}
            </View>

            <View style={s.kpis}>
              <Kpi label="Total" value={reports.length} icon="file" on={f.estado === 'Todos'} onPress={() => set({ estado: 'Todos' })} />
              <Kpi label="Nuevos" value={count('Nuevo')} icon="clock" on={f.estado === 'Nuevo'} onPress={() => set({ estado: 'Nuevo' })} />
              <Kpi label="En proceso" value={count('En proceso')} icon="tool" on={f.estado === 'En proceso'} onPress={() => set({ estado: 'En proceso' })} />
              <Kpi label="Resueltos" value={count('Resuelto')} icon="check" on={f.estado === 'Resuelto'} onPress={() => set({ estado: 'Resuelto' })} />
            </View>

            <View style={s.filters}>
              <SearchField
                value={f.q}
                onChangeText={(q) => set({ q })}
                label="Buscar reportes"
                hint="Busca por problema, dirección o categoría"
                placeholder="Problema, calle o categoría"
              />
              <View style={s.pair}>
                <SelectField label="Categoría" value={f.categoria} onChange={(categoria) => set({ categoria })} options={categorias} active={f.categoria !== 'Todos'} />
                <SelectField label="Estado" value={f.estado} onChange={(estado) => set({ estado })} options={ESTADO_FILTERS} active={f.estado !== 'Todos'} />
                <SelectField label="Prioridad" value={f.prioridad} onChange={(prioridad) => set({ prioridad })} options={PRIORIDAD_FILTERS} active={f.prioridad !== 'Todas'} />
              </View>
              <View style={s.resultRow}>
                <Text style={s.result} accessibilityLiveRegion="polite">
                  {loading ? 'Cargando reportes…' : `${list.length} ${list.length === 1 ? 'reporte' : 'reportes'}`}
                  {active ? ` · ${active} filtro${active > 1 ? 's' : ''} activo${active > 1 ? 's' : ''}` : ''}
                </Text>
                {active ? (
                  <Pressable accessibilityRole="button" onPress={() => setF(NO_FILTERS)} style={s.clearAll}>
                    <Text style={s.clearAllText}>Limpiar filtros</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? undefined : active ? (
            <EmptyState title="No hay reportes con esos filtros" body="Prueba con otra búsqueda o quita algunos filtros." actionLabel="Limpiar filtros" onAction={() => setF(NO_FILTERS)} />
          ) : (
            <EmptyState title="Aún no hay reportes" body="Cuando alguien reporte un problema aparecerá aquí." />
          )
        }
        renderItem={({ item }) => <ReportCard r={item} onPress={() => setDetail(item)} />}
      />
      {detail ? <ReportDetailSheet key={detail.id} report={detail} onClose={() => setDetail(null)} /> : null}
    </View>
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
  head: { paddingHorizontal: 18, paddingTop: 16, gap: 12 },
  h1: { fontFamily: FONT.displayXBold, fontSize: 26, color: C.navy },
  sub: { fontFamily: FONT.sans, fontSize: 14, color: C.text2, marginTop: 3, lineHeight: 19 },
  kpis: { paddingHorizontal: 18, paddingTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: { width: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, minHeight: 64, ...surface, ...cardShadow },
  kpiOn: { borderColor: C.blue, borderWidth: 1.5, borderBottomWidth: 4, backgroundColor: C.blueSoft },
  kpiIcon: { width: 38, height: 38, borderRadius: RADIUS, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  kpiLabel: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text2 },
  kpiValue: { fontFamily: FONT.displayXBold, fontSize: 22, color: C.navy },
  filters: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6, gap: 10 },
  pair: { flexDirection: 'row', gap: 8 },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, minHeight: TOUCH },
  result: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.text2 },
  clearAll: { minHeight: TOUCH, justifyContent: 'center' },
  clearAllText: { fontFamily: FONT.sansSemi, fontSize: 14, color: C.blue, textDecorationLine: 'underline' },
});
