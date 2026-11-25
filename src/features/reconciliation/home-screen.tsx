import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Button, KpiCard, Notice, Section, cardShadow, surface } from '@/components/ui';
import { C, FONT, RADIUS, TOUCH } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { ReportCard } from '@/features/reports/report-card';
import { ReportDetailSheet } from '@/features/reports/report-detail-sheet';
import { countByStatus } from '@/features/reports/report-status';
import { useReports } from '@/features/reports/reports-context';
import { ScreenTop } from '@/features/shell/screen-top';
import { useTheme } from '@/features/theme/theme-context';
import { getDepartment, MUNICIPIO_INFO, resolveDepartmentForReport } from '@/lib/orizaba';
import { roleLabel } from '@/lib/roles';
import type { Report } from '@/types';

import { fmtMoney } from './format';
import { useReconciliation } from './reconciliation-context';
import { summarize } from './selectors';
import { TransactionRow } from './transaction-row';

type Shortcut = { icon: IconName; label: string; hint: string; action: () => void; badge?: number };

const goPayments = (filtro?: string) => router.navigate(filtro ? { pathname: '/payments', params: { filtro } } : '/payments');

/**
 * Dashboard administrativo y departamental del H. Ayuntamiento de Orizaba, Veracruz.
 * Muestra en tiempo real nuevos reportes ciudadanos y el estado de conciliación según los permisos del rol.
 */
export function HomeScreen() {
  const { session, permissions } = useAuth();
  const { colors } = useTheme();
  const { transactions, source: txSource, sourceReason: txReason, loading: txLoading, open } = useReconciliation();
  const {
    reports,
    source: repSource,
    sourceReason: repReason,
    loading: repLoading,
    liveAlert,
    dismissLiveAlert,
  } = useReports();
  const [detailReport, setDetailReport] = useState<Report | null>(null);

  const dept = getDepartment(session?.department);
  const sum = summarize(transactions);
  const firstDiff = sum.diferencias[0];

  const scopedReports = useMemo(() => {
    if (session?.role === 'municipal_official' && dept && dept.reportCategories.length > 0) {
      return reports.filter((r) => {
        const target = r.department || resolveDepartmentForReport(r.categoria, r.title);
        return target === dept.slug;
      });
    }
    return reports;
  }, [reports, session?.role, dept]);

  const reportStats = useMemo(() => countByStatus(scopedReports), [scopedReports]);
  const recentReports = useMemo(() => scopedReports.slice(0, 5), [scopedReports]);

  const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  const name = session?.displayName ?? 'Servidor Público';
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

  const shortcuts: Shortcut[] = [
    ...(permissions.canViewPayments
      ? [
          {
            icon: 'warn' as IconName,
            label: 'Revisar\ndiferencias',
            hint: 'Abre la primera diferencia pendiente',
            badge: sum.diferencias.length,
            action: () => (firstDiff ? open(firstDiff) : goPayments('discrepancia')),
          },
          {
            icon: 'card' as IconName,
            label: 'Consultar\npagos',
            hint: 'Abre el padrón de pagos municipales',
            action: () => goPayments(),
          },
        ]
      : []),
    {
      icon: 'chat',
      label: 'Bandeja\nreportes',
      hint: 'Abre los reportes ciudadanos en tiempo real',
      badge: reportStats.fresh || undefined,
      action: () => router.navigate('/reports'),
    },
    ...(permissions.canManageStaff
      ? [
          {
            icon: 'user' as IconName,
            label: 'Plantilla\ny áreas',
            hint: 'Abre la gestión de personal y áreas municipales',
            action: () => router.navigate('/orizaba'),
          },
        ]
      : [
          {
            icon: 'bulb' as IconName,
            label: 'Guía y\náreas',
            hint: 'Consulta el directorio de áreas municipales',
            action: () => router.navigate('/orizaba'),
          },
        ]),
  ];

  const isDemo = (permissions.canViewPayments && txSource === 'demo') || repSource === 'demo';
  const demoNoticeText =
    (permissions.canViewPayments && txSource === 'demo' ? txReason : undefined) ||
    (repSource === 'demo' ? repReason : undefined) ||
    'Conectando con el servidor: se muestran datos de demostración mientras reconecta.';
  const isPreviewNotice = demoNoticeText.startsWith('Vista previa');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenTop />
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <View style={s.greet}>
          <View style={{ flex: 1 }}>
            <Text style={[s.muni, { color: colors.blue }]}>{MUNICIPIO_INFO.nombre}</Text>
            <Text accessibilityRole="header" style={[s.hello, { color: colors.text1 }]}>
              ¡Hola, {name}!
            </Text>
            <Text style={[s.role, { color: colors.text2 }]}>{roleLabel(session?.role, session?.department)}</Text>
          </View>
          <View style={[s.date, { backgroundColor: colors.white, borderColor: colors.border }]} accessible accessibilityLabel={`Hoy es ${today}`}>
            <Icon name="calendar" size={14} color={colors.blue} strokeWidth={2.5} />
            <Text style={[s.dateText, { color: colors.text1 }]}>{today}</Text>
          </View>
        </View>

        {liveAlert ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${liveAlert.text}. Toca para abrir el reporte.`}
            onPress={() => {
              const found = reports.find((x) => x.id === liveAlert.reportId);
              if (found) setDetailReport(found);
              else router.navigate('/reports');
              dismissLiveAlert();
            }}
            style={[s.liveAlert, { backgroundColor: colors.successSoft, borderLeftColor: colors.success }]}>
            <Icon name="bell" size={18} color={colors.success} strokeWidth={2.4} />
            <View style={{ flex: 1 }}>
              <Text style={[s.liveAlertTitle, { color: colors.success }]}>Actualización recibida</Text>
              <Text style={[s.liveAlertBody, { color: colors.text1 }]}>{liveAlert.text}</Text>
            </View>
            <Text style={[s.liveAlertCta, { color: colors.success }]}>Ver</Text>
          </Pressable>
        ) : null}

        {isDemo ? (
          <View style={{ marginHorizontal: 18, marginTop: 8 }}>
            <Notice tone={isPreviewNotice ? 'info' : 'warning'} text={demoNoticeText} />
          </View>
        ) : null}

        {dept ? (
          <View style={[s.deptBanner, { backgroundColor: colors.blueSoft, borderLeftColor: colors.blue }]}>
            <Text style={[s.deptTitle, { color: colors.navy }]}>
              {dept.name} · {dept.parentArea} (Ext. {dept.extension})
            </Text>
            <Text style={[s.deptDesc, { color: colors.text2 }]}>{dept.description}</Text>
          </View>
        ) : null}

        {permissions.canViewPayments && firstDiff ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Atención: ${plural(sum.diferencias.length, 'pago')} con diferencia por revisar.`}
            onPress={() => open(firstDiff)}
            style={({ pressed }) => [
              s.alert,
              { backgroundColor: colors.dangerSoft, borderLeftColor: colors.danger },
              pressed && { opacity: 0.9 },
            ]}>
            <Icon name="warn" size={20} color={colors.danger} strokeWidth={2.2} />
            <View style={{ flex: 1 }}>
              <Text style={[s.alertTitle, { color: colors.danger }]}>{plural(sum.diferencias.length, 'pago')} con diferencia bancaria</Text>
              <Text style={[s.alertSub, { color: colors.text2 }]}>El monto reportado por el banco no coincide con el sistema municipal.</Text>
            </View>
            <Text style={[s.alertCta, { color: colors.danger }]}>Revisar</Text>
            <Icon name="chevronRight" size={16} color={colors.danger} strokeWidth={2.5} />
          </Pressable>
        ) : null}

        <Section label="Acciones rápidas">
          <View style={s.quick}>
            {shortcuts.map((a) => (
              <Pressable
                key={a.label}
                accessibilityRole="button"
                accessibilityLabel={`${a.label.replace('\n', ' ')}${a.badge ? `, ${a.badge} nuevos` : ''}`}
                accessibilityHint={a.hint}
                onPress={a.action}
                style={({ pressed }) => [s.quickItem, pressed && { backgroundColor: colors.blueSoft }]}>
                <View style={[s.quickIcon, { backgroundColor: colors.blueIcon }]}>
                  <Icon name={a.icon} size={22} color={colors.blue} strokeWidth={2} />
                  {a.badge ? (
                    <View style={[s.quickBadge, { backgroundColor: colors.danger, borderColor: colors.bg }]}>
                      <Text style={s.quickBadgeText}>{a.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[s.quickLabel, { color: colors.text1 }]}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section
          label={dept && dept.reportCategories.length > 0 ? `Reportes · ${dept.shortName}` : 'Reportes ciudadanos recientes'}
          link="Ver bandeja"
          linkHint="Abre todos los reportes ciudadanos"
          onLinkPress={() => router.navigate('/reports')}>
          <View style={{ gap: 10 }}>
            <View style={s.pair}>
              <KpiCard icon="doc" label="Reportes nuevos" value={`${reportStats.fresh}`} sub="por asignar / atender" />
              <KpiCard icon="tool" label="En atención" value={`${reportStats.open}`} sub={`${reportStats.done} resueltos`} />
            </View>
          </View>
        </Section>

        <View style={{ marginTop: 10 }}>
          {repLoading ? <Text style={[s.empty, { marginHorizontal: 18, color: colors.text2 }]}>Sincronizando reportes…</Text> : null}
          {!repLoading && recentReports.length === 0 ? (
            <View style={[s.card, { marginHorizontal: 18, backgroundColor: colors.white, borderColor: colors.border }]}>
              <Text style={[s.empty, { color: colors.text2 }]}>No hay reportes pendientes para esta coordinación en este momento.</Text>
            </View>
          ) : null}
          {recentReports.map((r) => (
            <ReportCard key={r.id} r={r} onPress={() => setDetailReport(r)} />
          ))}
        </View>

        {permissions.canViewPayments ? (
          <>
            <Section label="Resumen de recaudación y conciliación">
              <View style={{ gap: 10 }}>
                <View style={s.pair}>
                  <KpiCard icon="money" label="Total en sistema" value={fmtMoney(sum.totalSistema)} sub={plural(sum.total, 'pago')} />
                  <KpiCard icon="check" label="Pagos cuadrados" value={`${sum.cuadrados}`} sub={`de ${sum.total}`} />
                </View>
                <View style={s.pair}>
                  <KpiCard icon="warn" label="Descuadre detectado" value={fmtMoney(sum.descuadre)} sub={plural(sum.diferencias.length, 'diferencia')} />
                  <KpiCard icon="clock" label="Pendientes de banco" value={`${sum.pendientes}`} sub="sin acreditar" />
                </View>
              </View>
            </Section>

            <Section label="Diferencias bancarias por revisar" link="Ver pagos" linkHint="Abre la lista completa de pagos" onLinkPress={() => goPayments()}>
              <View style={[s.card, { backgroundColor: colors.white, borderColor: colors.border }]}>
                {txLoading ? <Text style={[s.empty, { color: colors.text2 }]}>Cargando pagos…</Text> : null}
                {!txLoading && sum.diferencias.length === 0 ? (
                  <Text style={[s.empty, { color: colors.text2 }]}>Todo cuadrado: no hay diferencias bancarias pendientes.</Text>
                ) : null}
                {sum.diferencias.map((tx, i) => (
                  <TransactionRow key={tx.id} tx={tx} last={i === sum.diferencias.length - 1} onPress={() => open(tx)} />
                ))}
                {firstDiff && permissions.canReconcilePayments ? (
                  <View style={[s.actionRow, { backgroundColor: colors.blueSoft, borderTopColor: colors.border }]}>
                    <Button label={`Conciliar ${plural(sum.diferencias.length, 'diferencia')}`} onPress={() => open(firstDiff)} />
                  </View>
                ) : null}
              </View>
            </Section>
          </>
        ) : null}
      </ScrollView>

      {detailReport ? (
        <ReportDetailSheet key={detailReport.id} report={detailReport} onClose={() => setDetailReport(null)} />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  greet: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  muni: { fontFamily: FONT.sansBold, fontSize: 11.5, color: C.blue, textTransform: 'uppercase', letterSpacing: 0.6 },
  hello: { fontFamily: FONT.displayXBold, fontSize: 22, color: C.text1, letterSpacing: -0.2, marginTop: 2 },
  role: { fontFamily: FONT.sansSemi, fontSize: 13.5, color: C.text2, marginTop: 2 },
  date: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, ...surface },
  dateText: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text1 },
  liveAlert: { marginHorizontal: 18, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: C.successSoft, borderLeftWidth: 4, borderLeftColor: C.success },
  liveAlertTitle: { fontFamily: FONT.sansBold, fontSize: 13.5, color: C.success },
  liveAlertBody: { fontFamily: FONT.sans, fontSize: 13, color: C.text1, marginTop: 1 },
  liveAlertCta: { fontFamily: FONT.sansBold, fontSize: 13.5, color: C.success },
  deptBanner: { marginHorizontal: 18, marginTop: 8, padding: 12, backgroundColor: C.blueSoft, borderLeftWidth: 4, borderLeftColor: C.blue, gap: 3 },
  deptTitle: { fontFamily: FONT.sansBold, fontSize: 13.5, color: C.navy },
  deptDesc: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text2, lineHeight: 18 },
  alert: { marginHorizontal: 18, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, minHeight: 60, borderRadius: RADIUS, backgroundColor: C.dangerSoft, borderLeftWidth: 4, borderLeftColor: C.danger },
  alertTitle: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.danger },
  alertSub: { fontFamily: FONT.sans, fontSize: 12.5, color: '#7F1D1D', marginTop: 1 },
  alertCta: { fontFamily: FONT.sansBold, fontSize: 14, color: C.danger },
  pair: { flexDirection: 'row', gap: 10 },
  quick: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  quickItem: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 6, borderRadius: RADIUS, minHeight: TOUCH },
  quickIcon: { width: 52, height: 52, borderRadius: RADIUS, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  quickBadge: { position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: RADIUS, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg },
  quickBadgeText: { fontFamily: FONT.sansBold, fontSize: 11, color: '#fff' },
  quickLabel: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.text1, textAlign: 'center', lineHeight: 16 },
  card: { ...surface, overflow: 'hidden', ...cardShadow },
  empty: { fontFamily: FONT.sans, fontSize: 14, color: C.text2, padding: 14 },
  actionRow: { padding: 10, paddingHorizontal: 14, backgroundColor: C.blueSoft, borderTopWidth: 1, borderTopColor: C.border },
});
