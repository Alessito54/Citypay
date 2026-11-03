import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { AdminLogo } from '@/components/brand';
import { Icon, type IconName } from '@/components/icon';
import { EstadoBadge } from '@/components/status-badge';
import { cardShadow, EmptyState, FieldMessage, KpiCard, PrimaryButton, Section } from '@/components/ui';
import { C, FONT, TOUCH } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { fmtMoney } from '@/features/reconciliation/format';
import { AREA_LABEL, departmentsService, ROLE_LABEL } from '@/services/departments-service';
import type { Department, DepartmentDetail, DepartmentReport } from '@/types';

import { ReportStatusSheet } from './report-status-sheet';

/**
 * Home screen for municipal staff attached to a department: the state of their
 * own office and the queue of reports waiting on them. The administrator keeps
 * the municipality-wide dashboard instead.
 */
export function StaffHomeScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const isSupervisor = session?.role === 'municipal_supervisor';

  const [detail, setDetail] = useState<DepartmentDetail | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managing, setManaging] = useState<DepartmentReport | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const mine = await departmentsService.mine();
      setDetail(mine);
      if (isSupervisor) {
        const res = await departmentsService.list();
        setDepartments(res.items);
      }
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar tu departamento.');
    } finally {
      setLoading(false);
    }
  }, [isSupervisor]);

  // Mount-time fetch: this screen owns the data, so the request belongs here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const name = session?.displayName || 'Funcionario';
  const roleText = ROLE_LABEL[session?.role || ''] || 'Funcionario Municipal';
  const today = new Date().toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const metrics = detail?.metrics ?? null;
  const pending = (detail?.reports ?? []).filter((r) => r.estado !== 'Resuelto');
  const abiertos = pending.length;

  const QUICK: { icon: IconName; label: string; hint: string; action: () => void; badge?: number }[] = [
    {
      icon: 'home',
      label: 'Mi\ndepartamento',
      hint: 'Abre el panel completo de tu área',
      action: () =>
        detail ? router.push(`/department/${detail.slug}`) : router.navigate('/departments'),
    },
    {
      icon: 'chat',
      label: 'Bandeja de\nreportes',
      hint: 'Reportes turnados a tu área',
      badge: abiertos,
      action: () => router.navigate('/reports'),
    },
    {
      icon: 'chart',
      label: 'Centro de\ninformes',
      hint: 'Genera informes de gestión',
      action: () => router.push('/informes'),
    },
    {
      icon: 'card',
      label: 'Pagos\nmunicipales',
      hint: 'Consulta la recaudación registrada',
      action: () => router.navigate('/payments'),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.white }}>
        <AppHeader
          logo={<AdminLogo />}
          initial={name.charAt(0).toUpperCase()}
          badgeCount={metrics?.reportesVencidos || 0}
          onAvatarPress={() => router.navigate('/profile')}
        />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={s.greet}>
          <View style={{ flex: 1 }}>
            <Text accessibilityRole="header" style={s.hello}>
              ¡Hola, {name}!
            </Text>
            <Text style={s.role}>
              {roleText}
              {detail ? ` · ${detail.shortName}` : ''}
            </Text>
          </View>
          <View style={s.date} accessible accessibilityLabel={`Hoy es ${today}`}>
            <Icon name="calendar" size={14} color={C.blue} strokeWidth={2.5} />
            <Text style={s.dateText}>{today}</Text>
          </View>
        </View>

        {error ? (
          <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
            <FieldMessage text={error} />
          </View>
        ) : null}

        {loading ? (
          <Text style={s.loading}>Cargando tu departamento…</Text>
        ) : !detail ? (
          <View style={{ paddingTop: 12 }}>
            <EmptyState
              title="Aún no tienes un departamento asignado"
              body="Un administrador debe adscribir tu cuenta a un departamento para que recibas reportes y puedas generar informes de tu área."
              actionLabel="Ver los departamentos"
              onAction={() => router.navigate('/departments')}
            />
          </View>
        ) : (
          <>
            {metrics && metrics.reportesVencidos > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Atención: ${metrics.reportesVencidos} reportes fuera del plazo de ${detail.slaDays} días. Abrir la bandeja.`}
                onPress={() => router.push(`/department/${detail.slug}`)}
                style={({ pressed }) => [s.alert, pressed && { opacity: 0.9 }]}>
                <View style={s.alertIcon}>
                  <Icon name="warn" size={20} color={C.danger} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.alertTitle}>
                    {metrics.reportesVencidos} reporte{metrics.reportesVencidos !== 1 ? 's' : ''} fuera de plazo
                  </Text>
                  <Text style={s.alertSub}>
                    El compromiso de atención de tu área es de {detail.slaDays} días.
                  </Text>
                </View>
                <Text style={s.alertCta}>Revisar</Text>
                <Icon name="chevronRight" size={16} color={C.danger} strokeWidth={2.5} />
              </Pressable>
            ) : null}

            <Section label="Acciones rápidas">
              <View style={s.quick}>
                {QUICK.map((a) => (
                  <Pressable
                    key={a.label}
                    accessibilityRole="button"
                    accessibilityLabel={`${a.label.replace('\n', ' ')}${a.badge ? `, ${a.badge} pendientes` : ''}`}
                    accessibilityHint={a.hint}
                    onPress={a.action}
                    style={({ pressed }) => [s.quickItem, pressed && { backgroundColor: C.blueSoft }]}>
                    <View style={s.quickIcon}>
                      <Icon name={a.icon} size={22} color={C.blue} strokeWidth={2} />
                      {a.badge ? (
                        <View style={s.quickBadge}>
                          <Text style={s.quickBadgeText}>{a.badge}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={s.quickLabel}>{a.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Section>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${detail.name}. ${AREA_LABEL[detail.area]}. Abrir panel del departamento.`}
              onPress={() => router.push(`/department/${detail.slug}`)}
              style={({ pressed }) => [s.deptCard, pressed && { backgroundColor: C.blueSoft }]}>
              <Text style={{ fontSize: 28 }}>{detail.icon}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={2} style={s.deptName}>
                  {detail.name}
                </Text>
                <Text style={s.deptArea}>
                  {AREA_LABEL[detail.area]} · {detail.staff.length}{' '}
                  {detail.staff.length === 1 ? 'persona' : 'personas'}
                </Text>
              </View>
              <Icon name="chevronRight" size={16} color={C.text3} strokeWidth={2.5} />
            </Pressable>

            {metrics ? (
              <Section label="Indicadores de mi área">
                <View style={{ gap: 10 }}>
                  <View style={s.pair}>
                    <KpiCard
                      icon="chat"
                      label="Reportes abiertos"
                      value={`${abiertos}`}
                      sub={`${metrics.reportesNuevos} nuevos sin asignar`}
                    />
                    <KpiCard
                      icon="check"
                      label="Resueltos"
                      value={`${metrics.tasaResolucion}%`}
                      sub={`${metrics.reportesResueltos} de ${metrics.reportesTotal}`}
                    />
                  </View>
                  <View style={s.pair}>
                    <KpiCard
                      icon="money"
                      label="Recaudación conciliada"
                      value={fmtMoney(metrics.recaudado)}
                      sub={
                        detail.serviceSlugs.length > 0
                          ? `${metrics.pagosConciliados} pagos conciliados`
                          : 'Tu área no recauda directamente'
                      }
                    />
                    <KpiCard
                      icon="clock"
                      label="Tiempo de atención"
                      value={
                        metrics.diasPromedioResolucion === null
                          ? 'Sin datos'
                          : `${metrics.diasPromedioResolucion} d`
                      }
                      sub={`Compromiso: ${detail.slaDays} días`}
                    />
                  </View>
                </View>
              </Section>
            ) : null}

            <Section
              label={`Pendientes de atención (${abiertos})`}
              link="Ver bandeja"
              linkHint="Abre la bandeja completa del departamento"
              onLinkPress={() => router.push(`/department/${detail.slug}`)}>
              <View style={s.card}>
                {pending.length === 0 ? (
                  <Text style={s.emptyList}>
                    No hay reportes pendientes turnados a tu área. Buen trabajo.
                  </Text>
                ) : (
                  pending.slice(0, 4).map((r, i) => (
                    <View
                      key={r.id}
                      style={[s.row, i < Math.min(pending.length, 4) - 1 && s.rowBorder]}>
                      <Text style={{ fontSize: 20 }}>{r.icon || '📋'}</Text>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={s.rowTitle}>
                          {r.title}
                        </Text>
                        <Text numberOfLines={1} style={s.rowSub}>
                          {r.address} · {r.date}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <EstadoBadge estado={r.estado} />
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Actualizar la atención de ${r.title}`}
                          onPress={() => setManaging(r)}
                          style={s.rowBtn}>
                          <Text style={s.rowBtnText}>Actualizar</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </Section>

            <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
              <PrimaryButton
                accessibilityLabel="Abrir el Centro de Informes"
                onPress={() => router.push('/informes')}>
                <Icon name="chart" size={16} color="#fff" />
                <Text style={s.ctaText}>Generar informe de mi área</Text>
              </PrimaryButton>
            </View>
          </>
        )}
      </ScrollView>

      <ReportStatusSheet
        key={managing?.id ?? 'none'}
        report={managing}
        visible={!!managing}
        departments={departments}
        canReroute={isSupervisor}
        onClose={() => setManaging(null)}
        onUpdated={load}
      />
    </View>
  );
}

const s = StyleSheet.create({
  greet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  hello: { fontFamily: FONT.displayXBold, fontSize: 24, color: C.navy },
  role: { fontFamily: FONT.sans, fontSize: 14, color: C.text2, marginTop: 2 },
  date: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  dateText: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text1 },
  loading: { fontFamily: FONT.sans, fontSize: 14.5, color: C.text2, textAlign: 'center', paddingVertical: 28 },
  alert: { marginHorizontal: 18, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, minHeight: 60, borderRadius: 14, backgroundColor: C.dangerSoft, borderWidth: 1, borderColor: '#FECACA' },
  alertIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.danger },
  alertSub: { fontFamily: FONT.sans, fontSize: 12.5, color: '#7F1D1D', marginTop: 1 },
  alertCta: { fontFamily: FONT.sansBold, fontSize: 14, color: C.danger },
  quick: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  quickItem: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 6, borderRadius: 12, minHeight: TOUCH },
  quickIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  quickBadge: { position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg },
  quickBadgeText: { fontFamily: FONT.sansBold, fontSize: 11, color: '#fff' },
  quickLabel: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text1, textAlign: 'center', lineHeight: 16 },
  deptCard: { marginHorizontal: 18, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, ...cardShadow },
  deptName: { fontFamily: FONT.sansBold, fontSize: 15.5, color: C.text1, lineHeight: 21 },
  deptArea: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text3, marginTop: 2 },
  pair: { flexDirection: 'row', gap: 10 },
  card: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...cardShadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, minHeight: 72 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
  rowTitle: { fontFamily: FONT.sansBold, fontSize: 14, color: C.text1 },
  rowSub: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text3, marginTop: 2 },
  rowBtn: { paddingVertical: 7, paddingHorizontal: 10, minHeight: 34, justifyContent: 'center', borderRadius: 8, backgroundColor: C.blueSoft, borderWidth: 1, borderColor: C.border },
  rowBtnText: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.blue },
  emptyList: { padding: 20, textAlign: 'center', fontFamily: FONT.sans, fontSize: 14, color: C.text3 },
  ctaText: { fontFamily: FONT.sansBold, fontSize: 15, color: '#fff' },
});
