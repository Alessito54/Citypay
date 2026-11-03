import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { confirmAction, notify } from '@/components/confirm';
import { Icon, type IconName } from '@/components/icon';
import { ScreenHeader } from '@/components/screen-header';
import { EstadoBadge, PrioridadBadge } from '@/components/status-badge';
import { cardShadow, EmptyState, FieldMessage, KpiCard, PrimaryButton, Section } from '@/components/ui';
import { C, FONT, TOUCH } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { fmtDate, fmtMoney, SERVICE_ICON, SERVICE_LABEL } from '@/features/reconciliation/format';
import { AREA_LABEL, departmentsService, ROLE_LABEL } from '@/services/departments-service';
import {
  type Department,
  type DepartmentDetail,
  type DepartmentReport,
  isStaffRole,
  type ReportEstado,
  type Servicio,
} from '@/types';

import { ReportStatusSheet } from './report-status-sheet';

const ESTADO_TABS: (ReportEstado | 'Todos')[] = ['Todos', 'Nuevo', 'Asignado', 'En proceso', 'Resuelto'];

/**
 * Panel of a single department: its indicators, the queue of citizen reports it
 * must attend, the collection it answers for, its team and its contact details.
 */
export function DepartmentDetailScreen({ slug }: { slug: string }) {
  const { session } = useAuth();
  const isStaff = isStaffRole(session?.role);
  const isAdmin = session?.role === 'admin';
  const isSupervisor = session?.role === 'municipal_supervisor';

  const [detail, setDetail] = useState<DepartmentDetail | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ReportEstado | 'Todos'>('Todos');
  const [managing, setManaging] = useState<DepartmentReport | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await departmentsService.detail(slug);
      setDetail(res);
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar el departamento.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const loadDepartments = useCallback(async () => {
    try {
      const res = await departmentsService.list();
      setDepartments(res.items);
    } catch {
      setDepartments([]);
    }
  }, []);

  // Mount-time fetch: this screen owns the data, so the request belongs here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Only the roles that may re-route an incident need the department list.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAdmin || isSupervisor) loadDepartments();
  }, [isAdmin, isSupervisor, loadDepartments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/departments'));

  const metrics = detail?.metrics ?? null;
  const canManageReports =
    isStaff && (isAdmin || isSupervisor || (!!detail && session?.departmentId === detail.id));
  const canReroute = isAdmin || isSupervisor;

  const reports = useMemo(
    () => (detail?.reports ?? []).filter((r) => tab === 'Todos' || r.estado === tab),
    [detail?.reports, tab],
  );

  const abiertos = metrics
    ? metrics.reportesNuevos + metrics.reportesAsignados + metrics.reportesProceso
    : 0;

  const removeFromDepartment = (userId: string, name: string) =>
    confirmAction({
      title: 'Quitar del departamento',
      message: `${name} dejará de pertenecer a este departamento y perderá el acceso a su bandeja de reportes.`,
      confirmLabel: 'Quitar',
      destructive: true,
      onConfirm: async () => {
        try {
          await departmentsService.removeStaff(userId);
          await load();
        } catch (e: any) {
          notify('Error', e?.message || 'No se pudo actualizar la adscripción.');
        }
      },
    });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <ScreenHeader title="Departamento" onBack={back} />
        <Text style={s.loading}>Cargando información del departamento…</Text>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <ScreenHeader title="Departamento" onBack={back} />
        <EmptyState
          title="No se pudo abrir el departamento"
          body={error || 'Revisa tu conexión con el servidor municipal e inténtalo de nuevo.'}
          actionLabel="Reintentar"
          onAction={load}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title={detail.shortName} onBack={back} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={s.hero}>
          <View style={s.heroTop}>
            <View style={s.thumb}>
              <Text style={{ fontSize: 28 }}>{detail.icon}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text accessibilityRole="header" style={s.name}>
                {detail.name}
              </Text>
              <View style={s.chipRow}>
                <View style={s.chip}>
                  <Text style={s.chipText}>{AREA_LABEL[detail.area]}</Text>
                </View>
                <View style={s.chip}>
                  <Text style={s.chipText}>Plazo de atención: {detail.slaDays} días</Text>
                </View>
              </View>
            </View>
          </View>
          <Text style={s.desc}>{detail.description}</Text>
        </View>

        {error ? (
          <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
            <FieldMessage text={error} />
          </View>
        ) : null}

        {metrics ? (
          <Section label="Indicadores del departamento">
            <View style={{ gap: 10 }}>
              <View style={s.pair}>
                <KpiCard
                  icon="money"
                  label="Recaudación conciliada"
                  value={fmtMoney(metrics.recaudado)}
                  sub={`${metrics.pagosConciliados} de ${metrics.pagosTotal} pagos`}
                />
                <KpiCard
                  icon="warn"
                  label="Descuadre bancario"
                  value={fmtMoney(metrics.descuadre)}
                  sub={`${metrics.pagosDiscrepancia} con discrepancia`}
                />
              </View>
              <View style={s.pair}>
                <KpiCard
                  icon="card"
                  label="Cartera por cobrar"
                  value={fmtMoney(metrics.carteraPendiente + metrics.carteraVencida)}
                  sub={`${metrics.adeudosCount} adeudos · ${fmtMoney(metrics.carteraVencida)} vencidos`}
                />
                <KpiCard
                  icon="chat"
                  label="Reportes abiertos"
                  value={`${abiertos}`}
                  sub={`${metrics.reportesVencidos} fuera de plazo`}
                />
              </View>
              <View style={s.pair}>
                <KpiCard
                  icon="check"
                  label="Reportes resueltos"
                  value={`${metrics.tasaResolucion}%`}
                  sub={`${metrics.reportesResueltos} de ${metrics.reportesTotal}`}
                />
                <KpiCard
                  icon="clock"
                  label="Tiempo de atención"
                  value={
                    metrics.diasPromedioResolucion === null
                      ? 'Sin datos'
                      : `${metrics.diasPromedioResolucion} d`
                  }
                  sub={
                    metrics.diasPromedioResolucion === null
                      ? 'Aún no hay reportes cerrados'
                      : `Compromiso: ${detail.slaDays} días`
                  }
                />
              </View>
            </View>
          </Section>
        ) : null}

        {isStaff ? (
          <Section label="Informes del departamento">
            <View style={s.actionsRow}>
              <ActionTile
                icon="chart"
                label="Informe de gestión"
                hint="Abre el Centro de Informes filtrado por este departamento"
                onPress={() => router.push(`/informes?department=${detail.slug}`)}
              />
              <ActionTile
                icon="card"
                label="Ver pagos"
                hint="Abre la lista de pagos municipales"
                onPress={() => router.navigate('/payments')}
              />
              <ActionTile
                icon="chat"
                label="Todos los reportes"
                hint="Abre la lista general de reportes"
                onPress={() => router.navigate('/reports')}
              />
            </View>
          </Section>
        ) : null}

        {isStaff ? (
          <Section label={`Bandeja de reportes (${detail.reports.length})`}>
            <View style={s.tabs}>
              {ESTADO_TABS.map((t) => {
                const on = tab === t;
                const count =
                  t === 'Todos'
                    ? detail.reports.length
                    : detail.reports.filter((r) => r.estado === t).length;
                return (
                  <Pressable
                    key={t}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${t}: ${count} reportes`}
                    onPress={() => setTab(t)}
                    style={[s.tab, on && s.tabOn]}>
                    <Text style={[s.tabText, on && s.tabTextOn]}>
                      {t} · {count}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {reports.length === 0 ? (
              <EmptyState
                title={
                  detail.reports.length === 0
                    ? 'Sin reportes turnados a esta área'
                    : 'Nada en este estado'
                }
                body={
                  detail.reports.length === 0
                    ? detail.reportCategories.length > 0
                      ? `Los reportes de ${detail.reportCategories.join(', ')} llegarán aquí automáticamente.`
                      : 'Esta área no atiende reportes ciudadanos; su carga es de recaudación y control.'
                    : 'Cambia de pestaña para ver los reportes en otro estado de atención.'
                }
                actionLabel={detail.reports.length > 0 ? 'Ver todos' : undefined}
                onAction={detail.reports.length > 0 ? () => setTab('Todos') : undefined}
              />
            ) : (
              <View style={{ gap: 10 }}>
                {reports.map((r) => (
                  <ReportRow
                    key={r.id}
                    report={r}
                    canManage={canManageReports}
                    onManage={() => setManaging(r)}
                  />
                ))}
              </View>
            )}
          </Section>
        ) : null}

        {isStaff && detail.payments.length > 0 ? (
          <Section
            label="Recaudación reciente"
            link="Ver todos"
            linkHint="Abre la lista completa de pagos"
            onLinkPress={() => router.navigate('/payments')}>
            <View style={s.card}>
              {detail.payments.map((p, i) => (
                <View
                  key={p.id}
                  style={[s.payRow, i < detail.payments.length - 1 && s.rowBorder]}
                  accessible
                  accessibilityLabel={`${p.concepto}. Folio ${p.folio}. ${fmtMoney(p.montoSistema)}. ${p.estado}.`}>
                  <Text style={{ fontSize: 20 }}>
                    {SERVICE_ICON[p.servicio as Servicio] ?? '🏛️'}
                  </Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={s.payConcept}>
                      {p.concepto}
                    </Text>
                    <Text numberOfLines={1} style={s.payMeta}>
                      {SERVICE_LABEL[p.servicio as Servicio] ?? p.servicio} · {fmtDate(p.fecha)} · {p.ciudadano}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.payAmount}>{fmtMoney(p.montoSistema)}</Text>
                    <Text
                      style={[
                        s.payState,
                        p.estado === 'conciliado'
                          ? { color: C.success }
                          : p.estado === 'discrepancia'
                            ? { color: C.danger }
                            : { color: C.text3 },
                      ]}>
                      {p.estado === 'conciliado'
                        ? 'Conciliado'
                        : p.estado === 'discrepancia'
                          ? 'Con diferencia'
                          : 'Pendiente'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {isStaff ? (
          <Section label={`Personal adscrito (${detail.staff.length})`}>
            <View style={s.card}>
              {detail.staff.length === 0 ? (
                <Text style={s.emptyList}>
                  Sin personal adscrito. Un administrador puede asignar funcionarios desde la
                  gestión de cuentas.
                </Text>
              ) : (
                detail.staff.map((u, i) => (
                  <View
                    key={u.id}
                    style={[s.staffRow, i < detail.staff.length - 1 && s.rowBorder]}
                    accessible
                    accessibilityLabel={`${u.displayName || u.email}. ${ROLE_LABEL[u.role] || u.role}. ${u.email}.`}>
                    <View style={s.avatar}>
                      <Text style={s.avatarLetter}>
                        {(u.displayName || u.email).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={s.staffName}>
                        {u.displayName || 'Sin nombre'}
                      </Text>
                      <Text numberOfLines={1} style={s.staffMeta}>
                        {ROLE_LABEL[u.role] || u.role} · {u.email}
                      </Text>
                    </View>
                    {isAdmin ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Quitar a ${u.displayName || u.email} del departamento`}
                        onPress={() => removeFromDepartment(u.id, u.displayName || u.email)}
                        style={s.removePill}>
                        <Text style={s.removePillText}>Quitar</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          </Section>
        ) : null}

        <Section label="Qué atiende y cómo contactarlo">
          <View style={s.card}>
            <InfoRow label="Titular" value={detail.headName || 'Por designar'} />
            <InfoRow
              label="Servicios que cobra"
              value={
                detail.serviceSlugs.length > 0
                  ? detail.serviceSlugs
                      .map((slugName) => SERVICE_LABEL[slugName as Servicio] ?? slugName)
                      .join(', ')
                  : 'No recauda directamente'
              }
            />
            <InfoRow
              label="Reportes que atiende"
              value={
                detail.reportCategories.length > 0
                  ? detail.reportCategories.join(', ')
                  : 'No atiende reportes ciudadanos'
              }
            />
            <InfoRow label="Oficina" value={detail.office || 'Palacio Municipal'} />
            <InfoRow label="Horario" value={detail.scheduleLabel || 'Por confirmar'} />
            <InfoRow label="Teléfono" value={detail.contactPhone || 'No disponible'} />
            <InfoRow label="Correo" value={detail.contactEmail || 'No disponible'} last />
          </View>
        </Section>

        {!isStaff ? (
          <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
            <PrimaryButton
              label="Levantar un reporte a esta área"
              accessibilityHint="Abre el formulario de reporte ciudadano"
              onPress={() => router.push('/new-report')}
            />
          </View>
        ) : null}
      </ScrollView>

      <ReportStatusSheet
        key={managing?.id ?? 'none'}
        report={managing}
        visible={!!managing}
        departments={departments}
        canReroute={canReroute}
        onClose={() => setManaging(null)}
        onUpdated={load}
      />
    </View>
  );
}

function ReportRow({
  report,
  canManage,
  onManage,
}: {
  report: DepartmentReport;
  canManage: boolean;
  onManage: () => void;
}) {
  return (
    <View
      style={s.reportCard}
      accessible
      accessibilityLabel={`${report.title}. ${report.address}. Estado ${report.estado}. Prioridad ${report.prioridad}. ${report.ciudadano ? `Reportado por ${report.ciudadano}.` : ''}`}>
      <View style={s.reportTop}>
        <Text style={{ fontSize: 22 }}>{report.icon || '📋'}</Text>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={2} style={s.reportTitle}>
            {report.title}
          </Text>
          <Text numberOfLines={1} style={s.reportAddr}>
            {report.address}
          </Text>
        </View>
        <EstadoBadge estado={report.estado} />
      </View>
      <View style={s.reportMeta}>
        <PrioridadBadge prioridad={report.prioridad} />
        <Text style={s.reportDate}>{report.date}</Text>
        {report.ciudadano ? (
          <Text numberOfLines={1} style={s.reportCitizen}>
            {report.ciudadano}
          </Text>
        ) : null}
      </View>
      {canManage ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Gestionar el reporte ${report.title}`}
          accessibilityHint="Cambia el estado de atención y deja una nota"
          onPress={onManage}
          style={({ pressed }) => [s.manageBtn, pressed && { backgroundColor: C.blueChip }]}>
          <Icon name="tool" size={15} color={C.blue} />
          <Text style={s.manageText}>Actualizar atención</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ActionTile({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: IconName;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [s.tile, pressed && { backgroundColor: C.blueSoft }]}>
      <View style={s.tileIcon}>
        <Icon name={icon} size={20} color={C.blue} strokeWidth={2} />
      </View>
      <Text style={s.tileLabel}>{label}</Text>
    </Pressable>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      style={[s.infoRow, !last && s.rowBorder]}
      accessible
      accessibilityLabel={`${label}: ${value}`}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  loading: { fontFamily: FONT.sans, fontSize: 14.5, color: C.text2, textAlign: 'center', paddingTop: 32 },
  hero: { paddingHorizontal: 18, paddingTop: 16, gap: 10 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: 14, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: FONT.displayXBold, fontSize: 21, color: C.navy, lineHeight: 27 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: { backgroundColor: C.blueChip, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  chipText: { fontFamily: FONT.sansSemi, fontSize: 11.5, color: C.blueChipText },
  desc: { fontFamily: FONT.sans, fontSize: 14, color: C.text2, lineHeight: 20 },
  pair: { flexDirection: 'row', gap: 10 },
  card: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...cardShadow },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
  actionsRow: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 6, minHeight: TOUCH + 28, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, ...cardShadow },
  tileIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text1, textAlign: 'center', lineHeight: 16 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tab: { paddingVertical: 8, paddingHorizontal: 12, minHeight: 36, borderRadius: 999, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, justifyContent: 'center' },
  tabOn: { backgroundColor: C.blue, borderColor: C.blue },
  tabText: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text2 },
  tabTextOn: { color: '#fff', fontFamily: FONT.sansBold },
  reportCard: { backgroundColor: C.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border, gap: 10, ...cardShadow },
  reportTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reportTitle: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  reportAddr: { fontFamily: FONT.sans, fontSize: 13, color: C.text2, marginTop: 2 },
  reportMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  reportDate: { fontFamily: FONT.sans, fontSize: 12, color: C.text3 },
  reportCitizen: { flexShrink: 1, fontFamily: FONT.sans, fontSize: 12, color: C.text3 },
  manageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: TOUCH, borderRadius: 10, backgroundColor: C.blueSoft, borderWidth: 1, borderColor: C.border },
  manageText: { fontFamily: FONT.sansBold, fontSize: 13.5, color: C.blue },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, minHeight: 64 },
  payConcept: { fontFamily: FONT.sansBold, fontSize: 14, color: C.text1 },
  payMeta: { fontFamily: FONT.sans, fontSize: 12, color: C.text3, marginTop: 2 },
  payAmount: { fontFamily: FONT.displayBold, fontSize: 14.5, color: C.text1 },
  payState: { fontFamily: FONT.sansSemi, fontSize: 11.5, marginTop: 2 },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: TOUCH + 16 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontFamily: FONT.displayBold, fontSize: 16, color: C.blue },
  staffName: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  staffMeta: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text2, marginTop: 2 },
  removePill: { paddingVertical: 8, paddingHorizontal: 10, minHeight: 36, justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#FECACA', backgroundColor: C.dangerSoft },
  removePillText: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.danger },
  emptyList: { padding: 18, textAlign: 'center', fontFamily: FONT.sans, fontSize: 13.5, color: C.text3, lineHeight: 19 },
  infoRow: { paddingVertical: 12, paddingHorizontal: 14, gap: 3 },
  infoLabel: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.text3 },
  infoValue: { fontFamily: FONT.sansMedium, fontSize: 14, color: C.text1, lineHeight: 20 },
});
