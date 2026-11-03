import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { ScreenHeader } from '@/components/screen-header';
import { cardShadow, EmptyState, FieldMessage, KpiCard, PrimaryButton, Section, SelectField } from '@/components/ui';
import { C, FONT, TOUCH } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { fmtMoney } from '@/features/reconciliation/format';
import { analyticsService } from '@/services/analytics-service';
import type {
  AnalyticsOverview,
  Informe,
  InformeColumn,
  InformeGroupBy,
  InformeType,
} from '@/types';

import { buildCsv, csvFileName, downloadCsv } from './csv';

const TYPES: { id: InformeType; label: string; icon: IconName; groups: InformeGroupBy[] }[] = [
  {
    id: 'recaudacion',
    label: 'Recaudación',
    icon: 'money',
    groups: ['service', 'department', 'method', 'bank', 'month', 'status'],
  },
  {
    id: 'conciliacion',
    label: 'Conciliación',
    icon: 'card',
    groups: ['status', 'service', 'department', 'bank'],
  },
  { id: 'cartera', label: 'Cartera', icon: 'warn', groups: ['service', 'department'] },
  { id: 'desempeno', label: 'Desempeño', icon: 'chart', groups: ['department'] },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: 'chat',
    groups: ['category', 'priority', 'status', 'department'],
  },
];

const GROUP_LABEL: Record<InformeGroupBy, string> = {
  department: 'Departamento',
  service: 'Servicio',
  method: 'Método de pago',
  bank: 'Banco',
  status: 'Estado',
  category: 'Categoría',
  priority: 'Prioridad',
  month: 'Mes',
};

const PERIODS = ['Este mes', 'Mes anterior', 'Últimos 90 días', 'Este año', 'Histórico'] as const;
type Period = (typeof PERIODS)[number];

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Start and end dates of a preset, or nulls for the whole history. */
function rangeFor(period: Period): { from: string | null; to: string | null } {
  const now = new Date();
  switch (period) {
    case 'Este mes':
      return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) };
    case 'Mes anterior': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: iso(first), to: iso(last) };
    }
    case 'Últimos 90 días': {
      const from = new Date(now);
      from.setDate(from.getDate() - 90);
      return { from: iso(from), to: iso(now) };
    }
    case 'Este año':
      return { from: iso(new Date(now.getFullYear(), 0, 1)), to: iso(now) };
    case 'Histórico':
    default:
      return { from: null, to: null };
  }
}

function formatCell(column: InformeColumn, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  switch (column.type) {
    case 'money':
      return fmtMoney(Number(value));
    case 'percent':
      return `${Number(value)}%`;
    case 'days':
      return `${Number(value)} d`;
    case 'number':
      return Number(value).toLocaleString('es-MX');
    default:
      return String(value);
  }
}

/**
 * Centro de Informes: the municipal reporting desk. Figures are aggregated by
 * the backend so what is shown on screen is exactly what gets exported.
 */
export function InformesScreen({ initialDepartment }: { initialDepartment?: string }) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [type, setType] = useState<InformeType>('recaudacion');
  const [groupBy, setGroupBy] = useState<InformeGroupBy>('service');
  const [period, setPeriod] = useState<Period>('Este año');
  const [scope, setScope] = useState<{ global: boolean; items: { slug: string; name: string }[] }>({
    global: false,
    items: [],
  });
  const [departmentName, setDepartmentName] = useState('Todo el municipio');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [informe, setInforme] = useState<Informe | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const typeConfig = TYPES.find((t) => t.id === type) ?? TYPES[0];
  const range = useMemo(() => rangeFor(period), [period]);

  const departmentOptions = useMemo(
    () => ['Todo el municipio', ...scope.items.map((d) => d.name)],
    [scope.items],
  );
  const departmentSlug =
    scope.items.find((d) => d.name === departmentName)?.slug ?? null;

  const loadScope = useCallback(async () => {
    const res = await analyticsService.scope();
    setScope(res);
    if (initialDepartment) {
      const match = res.items.find((d) => d.slug === initialDepartment);
      if (match) setDepartmentName(match.name);
    } else if (!res.global && res.items.length === 1) {
      // An official reports only on their own office; show it as fixed scope.
      setDepartmentName(res.items[0].name);
    }
  }, [initialDepartment]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [ov, inf] = await Promise.all([
        analyticsService.overview(range.from, range.to),
        analyticsService.informe({
          type,
          groupBy,
          from: range.from,
          to: range.to,
          department: departmentSlug,
        }),
      ]);
      setOverview(ov);
      setInforme(inf);
    } catch (e: any) {
      setError(e?.message || 'No se pudo generar el informe.');
    } finally {
      setLoading(false);
    }
  }, [type, groupBy, range.from, range.to, departmentSlug]);

  // Mount-time fetch: this screen owns the data, so the request belongs here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadScope();
  }, [loadScope]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const pickType = (next: InformeType) => {
    const cfg = TYPES.find((t) => t.id === next);
    setType(next);
    if (cfg && !cfg.groups.includes(groupBy)) setGroupBy(cfg.groups[0]);
  };

  const exportCsv = () => {
    if (!informe) return;
    setNotice(null);
    if (downloadCsv(informe)) {
      setNotice(`Descargado como ${csvFileName(informe)}`);
      return;
    }
    // No download dialog outside the browser: show the text so it can be copied.
    setCsvPreview(buildCsv(informe));
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/departments'));
  const total = informe?.rows.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title="Centro de Informes" onBack={back} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
          <Text accessibilityRole="header" style={s.h1}>
            Informes de gestión
          </Text>
          <Text style={s.sub}>
            {scope.global
              ? 'Recaudación, conciliación bancaria, cartera y desempeño de todas las áreas del municipio.'
              : 'Los informes se limitan a tu departamento; el panorama de arriba es el total del municipio.'}
          </Text>
        </View>

        {error ? (
          <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
            <FieldMessage text={error} />
          </View>
        ) : null}
        {notice ? (
          <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
            <FieldMessage text={notice} tone="success" />
          </View>
        ) : null}

        {overview ? (
          <Section label={`Panorama municipal · ${overview.periodLabel}`}>
            <View style={{ gap: 10 }}>
              <View style={s.pair}>
                <KpiCard
                  icon="money"
                  label="Recaudación conciliada"
                  value={fmtMoney(overview.recaudado)}
                  sub={`${overview.pagosConciliados} de ${overview.pagosTotal} pagos`}
                />
                <KpiCard
                  icon="warn"
                  label="Descuadre bancario"
                  value={fmtMoney(overview.descuadre)}
                  sub={`${overview.pagosDiscrepancia} con discrepancia`}
                />
              </View>
              <View style={s.pair}>
                <KpiCard
                  icon="card"
                  label="Cartera por cobrar"
                  value={fmtMoney(overview.carteraVigente + overview.carteraVencida)}
                  sub={`${fmtMoney(overview.carteraVencida)} vencidos`}
                />
                <KpiCard
                  icon="chat"
                  label="Reportes del periodo"
                  value={`${overview.reportesTotal}`}
                  sub={`${overview.reportesAbiertos} abiertos`}
                />
              </View>
            </View>
          </Section>
        ) : null}

        <Section label="Tipo de informe">
          <View style={s.typeRow}>
            {TYPES.map((t) => {
              const on = t.id === type;
              return (
                <Pressable
                  key={t.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Informe de ${t.label}`}
                  onPress={() => pickType(t.id)}
                  style={({ pressed }) => [s.typeTile, on && s.typeTileOn, pressed && { opacity: 0.9 }]}>
                  <View style={[s.typeIcon, on && { backgroundColor: '#fff' }]}>
                    <Icon name={t.icon} size={18} color={C.blue} strokeWidth={2} />
                  </View>
                  <Text style={[s.typeLabel, on && { color: C.blue, fontFamily: FONT.sansBold }]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <View style={s.filters}>
          <SelectField
            label="Periodo"
            value={period}
            options={[...PERIODS]}
            onChange={(v) => setPeriod(v as Period)}
            variant="row"
            leftIcon="calendar"
            active={period !== 'Histórico'}
          />
          <SelectField
            label="Agrupar por"
            value={GROUP_LABEL[groupBy]}
            options={typeConfig.groups.map((g) => GROUP_LABEL[g])}
            onChange={(v) => {
              const next = typeConfig.groups.find((g) => GROUP_LABEL[g] === v);
              if (next) setGroupBy(next);
            }}
            variant="row"
            leftIcon="settings"
          />
          {scope.global ? (
            <SelectField
              label="Departamento"
              value={departmentName}
              options={departmentOptions}
              onChange={setDepartmentName}
              variant="row"
              leftIcon="home"
              active={departmentName !== 'Todo el municipio'}
            />
          ) : scope.items.length > 0 ? (
            <View style={s.fixedScope}>
              <Icon name="home" size={16} color={C.blueMid} />
              <Text style={s.fixedScopeText}>
                Alcance: {departmentName}
              </Text>
            </View>
          ) : null}
        </View>

        {loading ? (
          <Text style={s.loading}>Generando informe…</Text>
        ) : !informe ? (
          <EmptyState
            title="No se pudo generar el informe"
            body={error || 'Revisa tu conexión con el servidor municipal.'}
            actionLabel="Reintentar"
            onAction={load}
          />
        ) : (
          <Section label={informe.title}>
            <View style={s.card}>
              <View style={s.reportHead}>
                <Text style={s.reportSubtitle}>{informe.subtitle}</Text>
                <Text style={s.reportPeriod}>{informe.periodLabel}</Text>
              </View>

              {informe.highlights.length > 0 ? (
                <View style={s.highlights}>
                  {informe.highlights.map((h) => (
                    <View key={h.label} style={s.highlight} accessible accessibilityLabel={`${h.label}: ${h.value}`}>
                      <Text style={s.highlightLabel}>{h.label}</Text>
                      <Text style={s.highlightValue}>{h.value}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {total === 0 ? (
                <EmptyState
                  title="Sin movimientos en este periodo"
                  body="Prueba con un periodo más amplio o cambia el tipo de informe."
                  actionLabel="Ver histórico completo"
                  onAction={() => setPeriod('Histórico')}
                />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: '100%' }}>
                  <View>
                    <View style={s.tableHead}>
                      {informe.columns.map((c, i) => (
                        <Text
                          key={c.key}
                          numberOfLines={2}
                          style={[s.th, i === 0 ? s.firstCol : s.dataCol, i > 0 && { textAlign: 'right' }]}>
                          {c.label}
                        </Text>
                      ))}
                    </View>
                    {informe.rows.map((row, ri) => (
                      <View
                        key={`${row[informe.columns[0].key]}-${ri}`}
                        style={[s.tr, ri % 2 === 1 && { backgroundColor: C.blueSoft }]}
                        accessible
                        accessibilityLabel={informe.columns
                          .map((c) => `${c.label}: ${formatCell(c, row[c.key])}`)
                          .join('. ')}>
                        {informe.columns.map((c, i) => (
                          <Text
                            key={c.key}
                            numberOfLines={2}
                            style={[
                              s.td,
                              i === 0 ? s.firstCol : s.dataCol,
                              i === 0 ? s.tdFirst : { textAlign: 'right' },
                            ]}>
                            {formatCell(c, row[c.key])}
                          </Text>
                        ))}
                      </View>
                    ))}
                    {informe.totals ? (
                      <View
                        style={s.totalRow}
                        accessible
                        accessibilityLabel={informe.columns
                          .map((c) => `${c.label}: ${formatCell(c, informe.totals?.[c.key])}`)
                          .join('. ')}>
                        {informe.columns.map((c, i) => (
                          <Text
                            key={c.key}
                            numberOfLines={2}
                            style={[
                              s.tdTotal,
                              i === 0 ? s.firstCol : s.dataCol,
                              i > 0 && { textAlign: 'right' },
                            ]}>
                            {formatCell(c, informe.totals?.[c.key])}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </ScrollView>
              )}

              <View style={s.footer}>
                <Text style={s.generated}>
                  Generado el {new Date(informe.generatedAt).toLocaleString('es-MX')} por{' '}
                  {session?.displayName || 'personal municipal'}.
                </Text>
                <PrimaryButton
                  accessibilityLabel="Exportar el informe a CSV"
                  accessibilityHint="Descarga el informe como archivo de hoja de cálculo"
                  disabled={total === 0}
                  onPress={exportCsv}>
                  <Icon name="doc" size={16} color="#fff" />
                  <Text style={s.exportText}>Exportar CSV</Text>
                </PrimaryButton>
              </View>
            </View>
          </Section>
        )}
      </ScrollView>

      <Modal
        visible={!!csvPreview}
        transparent
        animationType="fade"
        onRequestClose={() => setCsvPreview(null)}>
        <View style={s.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setCsvPreview(null)}
            accessibilityRole="button"
            accessibilityLabel="Cerrar el texto del informe"
          />
          <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]} accessibilityViewIsModal>
            <View style={s.handle} />
            <Text accessibilityRole="header" style={s.sheetTitle}>
              Informe en texto
            </Text>
            <Text style={s.sheetHint}>
              En la aplicación móvil no hay descarga de archivos: selecciona el texto para copiarlo
              y pégalo en tu hoja de cálculo. Desde el navegador el botón descarga el CSV.
            </Text>
            <ScrollView style={s.csvBox} contentContainerStyle={{ padding: 12 }}>
              <Text selectable style={s.csvText}>
                {csvPreview}
              </Text>
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              onPress={() => setCsvPreview(null)}
              style={s.doneBtn}>
              <Text style={s.doneBtnText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: FONT.displayXBold, fontSize: 26, color: C.navy },
  sub: { fontFamily: FONT.sans, fontSize: 14, color: C.text2, marginTop: 3, lineHeight: 19 },
  pair: { flexDirection: 'row', gap: 10 },
  loading: { fontFamily: FONT.sans, fontSize: 14.5, color: C.text2, textAlign: 'center', paddingVertical: 28 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeTile: { flexGrow: 1, minWidth: 96, alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 8, minHeight: TOUCH + 26, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, ...cardShadow },
  typeTileOn: { borderColor: C.blue, borderWidth: 1.5, backgroundColor: C.blueSoft },
  typeIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text1, textAlign: 'center' },
  filters: { paddingHorizontal: 18, paddingTop: 16, gap: 10 },
  fixedScope: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 12, borderRadius: 10, backgroundColor: C.blueSoft, borderWidth: 1, borderColor: C.border },
  fixedScopeText: { fontFamily: FONT.sansSemi, fontSize: 13.5, color: C.blue },
  card: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...cardShadow },
  reportHead: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, gap: 3 },
  reportSubtitle: { fontFamily: FONT.sansSemi, fontSize: 13.5, color: C.text2, lineHeight: 19 },
  reportPeriod: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text3 },
  highlights: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: C.divider, borderBottomWidth: 1, borderBottomColor: C.divider },
  highlight: { flexGrow: 1, minWidth: '33%', paddingVertical: 12, paddingHorizontal: 14, gap: 2 },
  highlightLabel: { fontFamily: FONT.sansSemi, fontSize: 11.5, color: C.text3 },
  highlightValue: { fontFamily: FONT.displayBold, fontSize: 15.5, color: C.navy },
  tableHead: { flexDirection: 'row', backgroundColor: C.blueChip, paddingVertical: 10 },
  th: { fontFamily: FONT.sansBold, fontSize: 12, color: C.blueChipText, paddingHorizontal: 10 },
  tr: { flexDirection: 'row', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.divider },
  td: { fontFamily: FONT.sansMedium, fontSize: 13, color: C.text1, paddingHorizontal: 10 },
  tdFirst: { fontFamily: FONT.sansSemi },
  totalRow: { flexDirection: 'row', paddingVertical: 12, backgroundColor: C.blueIcon },
  tdTotal: { fontFamily: FONT.sansBold, fontSize: 13, color: C.navy, paddingHorizontal: 10 },
  firstCol: { width: 170 },
  dataCol: { width: 116 },
  footer: { padding: 14, gap: 10, borderTopWidth: 1, borderTopColor: C.divider },
  generated: { fontFamily: FONT.sans, fontSize: 12, color: C.text3, lineHeight: 17 },
  exportText: { fontFamily: FONT.sansBold, fontSize: 15, color: '#fff' },
  backdrop: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingHorizontal: 18 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.sheetHandle, marginTop: 12, marginBottom: 8 },
  sheetTitle: { fontFamily: FONT.displayXBold, fontSize: 18, color: C.text1 },
  sheetHint: { fontFamily: FONT.sans, fontSize: 13, color: C.text2, marginTop: 4, lineHeight: 19 },
  csvBox: { marginTop: 12, maxHeight: 280, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.screen },
  csvText: { fontFamily: FONT.mono, fontSize: 11.5, color: C.text1, lineHeight: 17 },
  doneBtn: { marginTop: 12, minHeight: 48, borderRadius: 12, borderWidth: 2, borderColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { fontFamily: FONT.sansBold, fontSize: 15, color: C.blue },
});
