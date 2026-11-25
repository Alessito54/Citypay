import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Button, EmptyState, Notice, SearchField, SelectField, cardShadow, surface } from '@/components/ui';
import { ACCENT_BAR, C, FONT, RADIUS, TOUCH } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { ScreenTop } from '@/features/shell/screen-top';
import { useTheme } from '@/features/theme/theme-context';
import { getDepartment, ORIZABA_DEPARTMENTS, resolveDepartmentForReport } from '@/lib/orizaba';
import type { Report } from '@/types';

import { ReportCard } from './report-card';
import { ReportDetailSheet } from './report-detail-sheet';
import { countByStatus, filterReports, hasActiveFilters, NO_FILTERS } from './report-status';
import { useReports } from './reports-context';

const CATEGORIAS = [
  'Todos',
  'Vialidad',
  'Tránsito y vialidad',
  'Alumbrado público',
  'Agua',
  'Limpieza y residuos',
  'Parques y jardines',
  'Catastro y predial',
];
const ESTADOS = ['Todos', 'Nuevo', 'Asignado', 'En proceso', 'Resuelto'];
const PRIORIDADES = ['Todas', 'Alta', 'Media', 'Baja'];
const DEPT_OPTIONS = ['Todas las áreas', ...ORIZABA_DEPARTMENTS.filter((d) => d.reportCategories.length > 0).map((d) => d.shortName)];

export function ReportsScreen() {
  const { session, staff } = useAuth();
  const { colors } = useTheme();
  const { reports, source, sourceReason, loading, liveAlert, dismissLiveAlert } = useReports();
  const userDept = getDepartment(session?.department);
  const defaultDept =
    session?.role === 'municipal_official' && userDept && userDept.reportCategories.length > 0
      ? userDept.shortName
      : 'Todas las áreas';
  const [f, setF] = useState(NO_FILTERS);
  const [deptOverride, setDeptOverride] = useState<{ key: string; value: string } | null>(null);
  const roleKey = `${session?.role ?? ''}:${session?.department ?? ''}`;
  const deptFilter = deptOverride?.key === roleKey ? deptOverride.value : defaultDept;
  const setDeptFilter = (value: string) => setDeptOverride({ key: roleKey, value });
  const [detail, setDetail] = useState<Report | null>(null);

  const deptScoped = useMemo(() => {
    if (!staff || deptFilter === 'Todas las áreas') return reports;
    return reports.filter((r) => {
      const d = getDepartment(r.department || resolveDepartmentForReport(r.categoria, r.title));
      return d?.shortName === deptFilter;
    });
  }, [reports, staff, deptFilter]);

  const counts = useMemo(() => countByStatus(deptScoped), [deptScoped]);
  const list = useMemo(() => filterReports(deptScoped, f), [deptScoped, f]);
  const active = hasActiveFilters(f) || (staff && deptFilter !== 'Todas las áreas');
  const toggleStatus = (st: string) => setF((x) => ({ ...x, estado: x.estado === st ? 'Todos' : st }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenTop />
      <FlatList
        data={list}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <View style={s.head}>
              <View style={s.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text accessibilityRole="header" style={[s.h1, { color: colors.text1 }]}>
                    {staff ? 'Bandeja de Reportes' : 'Mis Reportes'}
                  </Text>
                  <Text style={[s.sub, { color: colors.text2 }]}>
                    {staff
                      ? 'Recepción y seguimiento de reportes ciudadanos'
                      : 'Reporta incidencias en tu calle con foto y ubicación'}
                  </Text>
                </View>
              </View>
              <Button icon="send" label="Reportar un problema" onPress={() => router.push('/new-report')} style={{ marginTop: 12 }} />
              {source === 'demo' ? (
                <View style={{ marginTop: 10 }}>
                  <Notice
                    tone={sourceReason?.startsWith('Vista previa') ? 'info' : 'warning'}
                    text={sourceReason || 'Conectando con el servidor: se muestran reportes de demostración mientras reconecta.'}
                  />
                </View>
              ) : null}
              {liveAlert ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    const target = reports.find((x) => x.id === liveAlert.reportId);
                    if (target) setDetail(target);
                    dismissLiveAlert();
                  }}
                  style={s.liveBanner}>
                  <Icon name="bell" size={16} color={C.success} strokeWidth={2.4} />
                  <Text style={s.liveBannerText}>{liveAlert.text}</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={s.kpis}>
              <Kpi label="En atención" value={counts.open} icon="tool" on={f.estado === 'En proceso'} onPress={() => toggleStatus('En proceso')} />
              <Kpi label="Resueltos" value={counts.done} icon="check" on={f.estado === 'Resuelto'} onPress={() => toggleStatus('Resuelto')} />
              <Kpi label="Nuevos" value={counts.fresh} icon="doc" on={f.estado === 'Nuevo'} onPress={() => toggleStatus('Nuevo')} />
            </View>

            <View style={s.filters}>
              <SearchField
                value={f.q}
                onChangeText={(q) => setF((x) => ({ ...x, q }))}
                placeholder="Buscar por problema, colonia o calle"
                label="Buscar reporte por problema o dirección"
              />
              {staff ? (
                <SelectField
                  label="Coordinación"
                  value={deptFilter}
                  options={DEPT_OPTIONS}
                  onChange={setDeptFilter}
                  active={deptFilter !== 'Todas las áreas'}
                />
              ) : null}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <SelectField label="Categoría" value={f.categoria} options={CATEGORIAS} onChange={(categoria) => setF((x) => ({ ...x, categoria }))} active={f.categoria !== 'Todos'} />
                <SelectField label="Estado" value={f.estado} options={ESTADOS} onChange={(estado) => setF((x) => ({ ...x, estado }))} active={f.estado !== 'Todos'} />
                <SelectField label="Prioridad" value={f.prioridad} options={PRIORIDADES} onChange={(prioridad) => setF((x) => ({ ...x, prioridad }))} active={f.prioridad !== 'Todas'} />
              </View>
              <View style={s.countRow}>
                <Text style={s.count} accessibilityLiveRegion="polite">
                  {loading ? 'Cargando reportes…' : `${list.length} ${list.length === 1 ? 'reporte' : 'reportes'}`}
                </Text>
                {active ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setF(NO_FILTERS);
                      setDeptFilter('Todas las áreas');
                    }}
                    style={s.clearAll}>
                    <Text style={s.clearAllText}>Limpiar filtros</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? undefined : active ? (
            <EmptyState
              title="No hay reportes con esos filtros"
              body="Prueba con otra coordinación, búsqueda o limpia los filtros."
              actionLabel="Ver todos"
              onAction={() => {
                setF(NO_FILTERS);
                setDeptFilter('Todas las áreas');
              }}
            />
          ) : (
            <EmptyState title="Aún no hay reportes" body="Cuando un ciudadano registre un reporte aparecerá aquí automáticamente." />
          )
        }
        renderItem={({ item }) => <ReportCard r={item} onPress={() => setDetail(item)} />}
      />
      {detail ? <ReportDetailSheet key={detail.id} report={detail} onClose={() => setDetail(null)} /> : null}
    </View>
  );
}

function Kpi({ label, value, icon, on, onPress }: { label: string; value: number; icon: IconName; on: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. ${on ? 'Filtro activo, toca para quitar' : 'Toca para filtrar'}`}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[
        s.kpi,
        { backgroundColor: on ? colors.blueSoft : colors.white, borderColor: on ? colors.blue : colors.border },
        on && { borderTopColor: colors.blue },
      ]}>
      <View style={[s.kpiIcon, { backgroundColor: colors.blueIcon }]}>
        <Icon name={icon} size={18} color={colors.blue} />
      </View>
      <Text style={[s.kpiValue, { color: colors.text1 }]}>{value}</Text>
      <Text style={[s.kpiLabel, { color: colors.text2 }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  head: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  h1: { fontFamily: FONT.displayXBold, fontSize: 22, color: C.text1 },
  sub: { fontFamily: FONT.sans, fontSize: 13.5, color: C.text2, marginTop: 2 },
  liveBanner: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, backgroundColor: C.successSoft, borderLeftWidth: 4, borderLeftColor: C.success },
  liveBannerText: { flex: 1, fontFamily: FONT.sansSemi, fontSize: 13, color: C.text1 },
  kpis: { flexDirection: 'row', gap: 8, paddingHorizontal: 18 },
  kpi: { flex: 1, alignItems: 'center', padding: 10, minHeight: 88, justifyContent: 'center', ...surface, borderTopWidth: ACCENT_BAR, borderTopColor: 'transparent', ...cardShadow },
  kpiOn: { borderColor: C.blue, borderTopColor: C.blue, backgroundColor: C.blueSoft },
  kpiIcon: { width: 32, height: 32, borderRadius: RADIUS, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontFamily: FONT.displayXBold, fontSize: 20, color: C.text1, marginTop: 4 },
  kpiLabel: { fontFamily: FONT.sansMedium, fontSize: 12.5, color: C.text2, textAlign: 'center' },
  filters: { paddingHorizontal: 18, paddingTop: 12, gap: 8 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 32, marginBottom: 4 },
  count: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.text2 },
  clearAll: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 8 },
  clearAllText: { fontFamily: FONT.sansBold, fontSize: 13.5, color: C.blue, textDecorationLine: 'underline' },
});
