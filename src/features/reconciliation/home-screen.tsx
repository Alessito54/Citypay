import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { AdminLogo, HeaderLogo } from '@/components/brand';
import { Icon, type IconName } from '@/components/icon';
import { notAvailable } from '@/components/not-available';
import { cardShadow, KpiCard, PrimaryButton, Section } from '@/components/ui';
import { C, FONT, TOUCH } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { useReports } from '@/features/reports/reports-context';
import { type DebtItem, debtsService } from '@/services/debts-service';
import { type UserItem, usersService } from '@/services/users-service';

import { fmtMoney } from './format';
import { useReconciliation } from './reconciliation-context';
import { TransactionRow } from './transaction-row';
import { UserModal } from './user-modal';

type QuickAction = { icon: IconName; label: string; hint: string; action: () => void; badge?: number };

export function HomeScreen() {
  const { session } = useAuth();
  return session?.role === 'admin' ? <AdminHomeScreen /> : <CitizenHomeScreen />;
}

/* =========================================================================
 * 1. ADMIN HOME SCREEN (Dashboard de Administrador Municipal)
 * ========================================================================= */
function AdminHomeScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { transactions, resolvedIds, open, refreshTransactions } = useReconciliation();
  const { reports, refreshReports } = useReports();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    const res = await usersService.listUsers();
    setUsers(res.items);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshTransactions(), refreshReports(), loadUsers()]);
    setRefreshing(false);
  }, [refreshTransactions, refreshReports, loadUsers]);

  // Mount-time fetch: this screen owns the data, so the request belongs here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, [loadUsers]);

  const effective = transactions.map((t) =>
    resolvedIds.has(t.id) ? { ...t, estado: 'conciliado' as const, montoBanco: t.montoSistema } : t,
  );
  const cuadrados = effective.filter((t) => t.estado === 'conciliado').length;
  const diferencias = transactions.filter((t) => t.estado === 'discrepancia');
  const abiertas = diferencias.filter((t) => !resolvedIds.has(t.id));
  const pendientes = effective.filter((t) => t.estado === 'pendiente').length;
  const totalSistema = transactions.reduce((a, t) => a + (t.montoSistema || 0), 0);
  const descuadre = Math.abs(effective.reduce((a, t) => a + ((t.montoBanco || 0) - (t.montoSistema || 0)), 0));
  const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  const name = session?.displayName || 'Administrador';

  const goPayments = (filtro?: string) =>
    router.navigate(filtro ? { pathname: '/payments', params: { filtro } } : '/payments');

  // Only actions that work today. The original grid had five shortcuts and four of
  // them opened a "not available" alert, which users read as an error.
  const QUICK: QuickAction[] = [
    {
      icon: 'warn',
      label: 'Revisar\ndiferencias',
      hint: 'Abre la primera diferencia pendiente',
      badge: abiertas.length,
      action: () => (abiertas[0] ? open(abiertas[0]) : goPayments('discrepancia')),
    },
    { icon: 'card', label: 'Buscar\npago', hint: 'Abre la lista de pagos con buscador', action: () => goPayments() },
    { icon: 'doc', label: 'Nuevo\nreporte', hint: 'Abre el formulario de reporte ciudadano', action: () => router.push('/new-report') },
    { icon: 'chat', label: 'Ver\nreportes', hint: 'Abre la lista de reportes', action: () => router.navigate('/reports') },
  ];

  // Counts come from the loaded records; no fabricated "last activity" timestamps.
  const ACTIVITY: { icon: IconName; label: string; sub: string; count: number; action: () => void }[] = [
    { icon: 'card', label: 'Pagos', sub: 'Registros de recaudación en el sistema', count: transactions.length, action: () => goPayments() },
    { icon: 'warn', label: 'Diferencias por revisar', sub: 'Pagos cuyo monto no coincide con el banco', count: abiertas.length, action: () => goPayments('discrepancia') },
    { icon: 'clock', label: 'Pendientes de banco', sub: 'Pagos aún no acreditados', count: pendientes, action: () => goPayments('pendiente') },
    { icon: 'chat', label: 'Reportes ciudadanos', sub: 'Incidencias levantadas por la ciudadanía', count: reports.length, action: () => router.navigate('/reports') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.white }}>
        <AppHeader logo={<AdminLogo />} initial={name.charAt(0).toUpperCase()} badgeCount={abiertas.length} onAvatarPress={() => router.navigate('/profile')} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={s.greet}>
          <View style={{ flex: 1 }}>
            <Text accessibilityRole="header" style={s.hello}>
              ¡Hola, {name}!
            </Text>
            <Text style={s.role}>Panel de Administración Municipal</Text>
          </View>
          <View style={s.date} accessible accessibilityLabel={`Hoy es ${today}`}>
            <Icon name="calendar" size={14} color={C.blue} strokeWidth={2.5} />
            <Text style={s.dateText}>{today}</Text>
          </View>
        </View>

        {abiertas.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Atención: ${abiertas.length} pago${abiertas.length !== 1 ? 's' : ''} con diferencia por revisar. Revisar ahora.`}
            onPress={() => open(abiertas[0])}
            style={({ pressed }) => [s.alert, pressed && { opacity: 0.9 }]}>
            <View style={s.alertIcon}>
              <Icon name="warn" size={20} color={C.danger} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>
                {abiertas.length} pago{abiertas.length !== 1 ? 's' : ''} con diferencia
              </Text>
              <Text style={s.alertSub}>El monto del banco no coincide con el sistema.</Text>
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

        <Section label="Métricas Generales del Municipio">
          <View style={{ gap: 10 }}>
            <View style={s.pair}>
              <KpiCard icon="money" label="Total en Sistema" value={fmtMoney(totalSistema)} sub="MXN" />
              <KpiCard icon="card" label="Pagos Cuadrados" value={`${cuadrados}`} sub="Conciliados" />
            </View>
            <View style={s.pair}>
              <KpiCard icon="warn" label="Descuadre Banco" value={fmtMoney(descuadre)} sub="En discrepancia" />
              <KpiCard icon="user" label="Cuentas Registradas" value={`${users.length}`} sub="Usuarios en DB" />
            </View>
          </View>
        </Section>

        <Section label={`Gestión de Cuentas de Usuario (${users.length})`} link="Recargar" linkHint="Vuelve a consultar la lista de usuarios" onLinkPress={loadUsers}>
          <View style={s.card}>
            {users.length === 0 ? (
              <Text style={s.emptyList}>No hay usuarios registrados aún.</Text>
            ) : (
              users.map((u, i) => (
                <Pressable
                  key={u.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${u.displayName || 'Sin nombre'}, ${u.email}. ${u.role === 'admin' ? 'Administrador' : u.role === 'municipal_official' ? 'Funcionario' : 'Ciudadano'}. ${u.paymentsCount ?? 0} pagos, ${u.reportsCount ?? 0} reportes.`}
                  accessibilityHint="Abre la edición de esta cuenta"
                  onPress={() => {
                    setSelectedUser(u);
                    setUserModalVisible(true);
                  }}
                  style={[s.userRow, i < users.length - 1 && s.rowBorder]}>
                  <View style={s.userAvatar}>
                    <Text style={s.avatarLetter}>{(u.displayName || u.email).charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={s.userNameRow}>
                      <Text numberOfLines={1} style={s.userName}>{u.displayName || 'Sin nombre'}</Text>
                      <View style={[s.roleChip, u.role === 'admin' ? s.roleAdmin : s.roleCitizen]}>
                        <Text style={[s.roleChipText, u.role === 'admin' ? s.roleAdminText : s.roleCitizenText]}>
                          {u.role === 'admin' ? 'Administrador' : u.role === 'municipal_official' ? 'Funcionario' : 'Ciudadano'}
                        </Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={s.userEmail}>{u.email}</Text>
                    <Text style={s.userCounters}>
                      {u.paymentsCount ?? 0} pagos · {u.reportsCount ?? 0} reportes
                    </Text>
                  </View>
                  <View style={s.editPill}>
                    <Text style={s.editPillText}>Modificar</Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </Section>

        <Section label="Conciliación Bancaria Municipal" link="Ver todos" linkHint="Abre la lista completa de pagos" onLinkPress={() => goPayments()}>
          <View style={s.card}>
            <View style={s.summary}>
              <View
                style={[s.summaryCell, { borderRightWidth: 1, borderRightColor: C.divider }]}
                accessible
                accessibilityLabel={`Total en sistema: ${fmtMoney(totalSistema)}. Ingresos municipales.`}>
                <Text style={s.summaryLabel}>Total sistema</Text>
                <Text style={[s.summaryValue, { color: C.text1 }]}>{fmtMoney(totalSistema)}</Text>
                <Text style={s.summaryTrend}>Ingresos municipales</Text>
              </View>
              <View
                style={s.summaryCell}
                accessible
                accessibilityLabel={`Descuadre: ${fmtMoney(descuadre)}. ${abiertas.length} por resolver.`}>
                <Text style={s.summaryLabel}>Descuadre banco</Text>
                <Text style={[s.summaryValue, { color: C.blue }]}>{fmtMoney(descuadre)}</Text>
                <Text style={s.summaryTrend}>
                  {abiertas.length} por resolver
                </Text>
              </View>
            </View>
            {diferencias.map((tx, i) => (
              <TransactionRow key={tx.id} tx={tx} resolved={resolvedIds.has(tx.id)} last={i === diferencias.length - 1} onPress={() => open(tx)} />
            ))}
            <View style={s.actionRow}>
              <PrimaryButton
                label={abiertas.length > 0 ? `Revisar ${abiertas.length} diferencia${abiertas.length !== 1 ? 's' : ''}` : 'Todo cuadrado: sin diferencias por revisar'}
                disabled={abiertas.length === 0}
                onPress={() => abiertas[0] && open(abiertas[0])}
                style={{ shadowOpacity: 0, elevation: 0 }}
              />
            </View>
          </View>
        </Section>

        <Section label="Actividad reciente">
          <View style={s.card}>
            {ACTIVITY.map((row, i) => (
              <Pressable
                key={row.label}
                accessibilityRole="button"
                accessibilityLabel={`${row.label}: ${row.count}. ${row.sub}`}
                onPress={row.action}
                style={({ pressed }) => [s.actRow, i < ACTIVITY.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.divider }, pressed && { backgroundColor: C.blueSoft }]}>
                <View style={s.actIcon}>
                  <Icon name={row.icon} size={20} color={C.blue} strokeWidth={2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.actLabel}>{row.label}</Text>
                  <Text numberOfLines={2} style={s.actSub}>
                    {row.sub}
                  </Text>
                </View>
                <Text style={s.actCount}>{row.count}</Text>
                <Icon name="chevronRight" size={16} color={C.text3} strokeWidth={2.5} />
              </Pressable>
            ))}
          </View>
        </Section>
      </ScrollView>

      <UserModal
        key={selectedUser?.id ?? 'none'}
        user={selectedUser}
        visible={userModalVisible}
        onClose={() => setUserModalVisible(false)}
        onUpdated={loadUsers}
      />
    </View>
  );
}

/* =========================================================================
 * 2. CITIZEN HOME SCREEN (Portal Ciudadano de Trámites y Servicios)
 * ========================================================================= */
function CitizenHomeScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { refreshTransactions } = useReconciliation();
  const { reports, refreshReports } = useReports();

  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDebts = useCallback(async () => {
    const list = await debtsService.getMyDebts();
    setDebts(list);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadDebts(), refreshTransactions(), refreshReports()]);
    setRefreshing(false);
  }, [loadDebts, refreshTransactions, refreshReports]);

  // Mount-time fetch: this screen owns the data, so the request belongs here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDebts();
  }, [loadDebts]);

  const name = session?.displayName || 'Ciudadano';
  const totalDeuda = debts.filter((d) => d.status === 'pending').reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.white }}>
        <AppHeader logo={<HeaderLogo />} initial={name.charAt(0).toUpperCase()} onAvatarPress={() => router.navigate('/profile')} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={s.citizenHero}>
          <Text accessibilityRole="header" style={s.citizenHello}>
            ¡Hola, {name}!
          </Text>
          <Text style={s.citizenSub}>Tu municipio más cerca de ti. Consulta tus trámites y reporta incidencias.</Text>
        </View>

        <Section label="Tu Resumen Personal">
          <View style={s.personalGrid}>
            <View style={s.personalCard} accessible accessibilityLabel={`Adeudos pendientes: ${fmtMoney(totalDeuda)}. ${debts.length > 0 ? `${debts.length} trámites por pagar` : 'Estás al corriente'}.`}>
              <Text style={s.pCardLabel}>ADEUDOS PENDIENTES</Text>
              <Text style={[s.pCardVal, { color: totalDeuda > 0 ? C.danger : C.blue }]}>
                {fmtMoney(totalDeuda)}
              </Text>
              <Text style={s.pCardSub}>
                {debts.length > 0 ? `${debts.length} trámite(s) por pagar` : 'Al corriente ✓'}
              </Text>
            </View>
            <View style={s.personalCard} accessible accessibilityLabel={`Tus reportes: ${reports.length}.`}>
              <Text style={s.pCardLabel}>TUS REPORTES</Text>
              <Text style={[s.pCardVal, { color: C.navy }]}>{reports.length}</Text>
              <Text style={s.pCardSub}>{reports.length > 0 ? 'Reportes registrados' : 'Sin reportes aún'}</Text>
            </View>
          </View>
        </Section>

        {debts.length > 0 ? (
          <Section label="Obligaciones Municipales Pendientes">
            <View style={{ gap: 10 }}>
              {debts.map((debt) => (
                <View
                  key={debt.id}
                  style={s.debtCard}
                  accessible
                  accessibilityLabel={`${debt.concept}. Folio ${debt.folio}. Vence ${debt.dueDate}. Importe ${fmtMoney(Number(debt.amount))}.`}>
                  <View style={s.debtIcon}>
                    <Text style={{ fontSize: 22 }}>
                      {debt.service?.slug === 'agua' ? '💧' : debt.service?.slug === 'multas' ? '🚨' : '🏠'}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.debtConcept}>{debt.concept}</Text>
                    <Text style={s.debtFolio}>Folio: {debt.folio} · Vence: {debt.dueDate}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={s.debtAmount}>{fmtMoney(Number(debt.amount))}</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Pagar ${debt.concept}`}
                      onPress={() => notAvailable('Pasarela de pago')}
                      style={s.payBtn}>
                      <Text style={s.payBtnText}>Pagar</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </Section>
        ) : (
          <View style={s.cleanSlate} accessible accessibilityLabel="Estás al corriente. No tienes adeudos pendientes registrados en tu cuenta municipal.">
            <Icon name="check" size={24} color={C.blue} />
            <Text style={s.cleanTitle}>¡Excelente! Estás al corriente</Text>
            <Text style={s.cleanDesc}>No tienes adeudos pendientes registrados en tu cuenta municipal.</Text>
          </View>
        )}

        <Section label="Servicios Municipales en Línea">
          <View style={s.servicesRow}>
            {[
              { icon: '🏠', label: 'Predial', action: () => notAvailable('Trámite de Predial') },
              { icon: '💧', label: 'Agua Potable', action: () => notAvailable('Trámite de Agua') },
              { icon: '🚨', label: 'Multas Viales', action: () => notAvailable('Consulta de Multas') },
              { icon: '📄', label: 'Licencias', action: () => notAvailable('Licencias') },
            ].map((srv) => (
              <Pressable
                key={srv.label}
                accessibilityRole="button"
                accessibilityLabel={srv.label}
                onPress={srv.action}
                style={s.serviceBtn}>
                <View style={s.serviceIcon}>
                  <Text style={{ fontSize: 24 }}>{srv.icon}</Text>
                </View>
                <Text style={s.serviceLabel}>{srv.label}</Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <View style={s.ctaCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.ctaTitle}>¿Ves una fuga, bache o luminaria apagada?</Text>
            <Text style={s.ctaSub}>Reporta incidencias en tu colonia con foto y ubicación exacta.</Text>
          </View>
          <PrimaryButton
            label="+ Nuevo reporte"
            accessibilityLabel="Crear nuevo reporte"
            onPress={() => router.push('/new-report')}
            style={{ width: 'auto', paddingHorizontal: 16 }}
          />
        </View>

        <Section label={`Mis Reportes Ciudadanos (${reports.length})`} link="Ver todos" linkHint="Abre la lista completa de tus reportes" onLinkPress={() => router.navigate('/reports')}>
          <View style={s.card}>
            {reports.length === 0 ? (
              <View style={s.emptyReportsBox}>
                <Text style={{ fontSize: 32 }}>💡</Text>
                <Text style={s.emptyReportsTitle}>Sin reportes activos</Text>
                <Text style={s.emptyReportsDesc}>
                  Cuando detectes una falla en tu colonia, genera un reporte para que la cuadrilla municipal acuda a repararla.
                </Text>
              </View>
            ) : (
              reports.slice(0, 3).map((r, i) => (
                <View
                  key={r.id}
                  style={[s.citizenReportRow, i < Math.min(reports.length, 3) - 1 && s.rowBorder]}
                  accessible
                  accessibilityLabel={`${r.title}. ${r.address}. Estado: ${r.estado}.`}>
                  <Text style={{ fontSize: 20 }}>{r.icon || '📋'}</Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={s.cReportTitle}>{r.title}</Text>
                    <Text numberOfLines={1} style={s.cReportAddr}>{r.address}</Text>
                  </View>
                  <View style={s.cReportBadge}>
                    <Text style={s.cReportBadgeText}>{r.estado}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  greet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  hello: { fontFamily: FONT.displayXBold, fontSize: 24, color: C.navy },
  role: { fontFamily: FONT.sans, fontSize: 14, color: C.text2, marginTop: 2 },
  date: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  dateText: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text1 },
  alert: { marginHorizontal: 18, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, minHeight: 60, borderRadius: 14, backgroundColor: C.dangerSoft, borderWidth: 1, borderColor: '#FECACA' },
  alertIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.danger },
  alertSub: { fontFamily: FONT.sans, fontSize: 12.5, color: '#7F1D1D', marginTop: 1 },
  alertCta: { fontFamily: FONT.sansBold, fontSize: 14, color: C.danger },
  pair: { flexDirection: 'row', gap: 10 },
  quick: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  quickItem: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 6, borderRadius: 12, minHeight: TOUCH },
  quickIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  quickBadge: { position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg },
  quickBadgeText: { fontFamily: FONT.sansBold, fontSize: 11, color: '#fff' },
  quickLabel: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text1, textAlign: 'center', lineHeight: 16 },
  card: { marginHorizontal: 0, backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...cardShadow },
  summary: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.divider },
  summaryCell: { flex: 1, paddingVertical: 14, paddingHorizontal: 14, gap: 2 },
  summaryLabel: { fontFamily: FONT.sansSemi, fontSize: 11.5, letterSpacing: 0.3, color: C.text3 },
  summaryValue: { fontFamily: FONT.displayXBold, fontSize: 19 },
  summaryTrend: { fontFamily: FONT.sans, fontSize: 12, color: C.text3 },
  actionRow: { padding: 12 },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 64 },
  actIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  actLabel: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  actSub: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text3, marginTop: 2 },
  actCount: { fontFamily: FONT.displayBold, fontSize: 15, color: C.text1, marginRight: 4 },

  // User management
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, minHeight: TOUCH + 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
  userAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontFamily: FONT.displayBold, fontSize: 16, color: C.blue },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  userName: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  roleChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleChipText: { fontFamily: FONT.sansSemi, fontSize: 11.5 },
  roleAdmin: { backgroundColor: '#FEE2E2' },
  roleAdminText: { fontFamily: FONT.sansSemi, fontSize: 11.5, color: '#B91C1C' },
  roleCitizen: { backgroundColor: C.blueSoft },
  roleCitizenText: { fontFamily: FONT.sansSemi, fontSize: 11.5, color: C.blue },
  userEmail: { fontFamily: FONT.sans, fontSize: 13, color: C.text2, marginTop: 1 },
  userCounters: { fontFamily: FONT.sans, fontSize: 12, color: C.text3, marginTop: 3 },
  editPill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: C.blueSoft, borderWidth: 1, borderColor: C.border, minHeight: 32, justifyContent: 'center' },
  editPillText: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.blue },
  emptyList: { padding: 20, textAlign: 'center', fontFamily: FONT.sans, fontSize: 14, color: C.text3 },

  // Citizen home
  citizenHero: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 6 },
  citizenHello: { fontFamily: FONT.displayXBold, fontSize: 24, color: C.navy },
  citizenSub: { fontFamily: FONT.sans, fontSize: 14, color: C.text2, marginTop: 4, lineHeight: 20 },
  personalGrid: { flexDirection: 'row', gap: 10 },
  personalCard: { flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, ...cardShadow },
  pCardLabel: { fontFamily: FONT.sansSemi, fontSize: 11, letterSpacing: 0.5, color: C.text3 },
  pCardVal: { fontFamily: FONT.displayXBold, fontSize: 20, marginTop: 4 },
  pCardSub: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text2, marginTop: 2 },
  debtCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border, ...cardShadow },
  debtIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  debtConcept: { fontFamily: FONT.sansBold, fontSize: 14, color: C.text1 },
  debtFolio: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text3, marginTop: 2 },
  debtAmount: { fontFamily: FONT.displayBold, fontSize: 15, color: C.text1 },
  payBtn: { backgroundColor: C.blue, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, minHeight: 36, justifyContent: 'center' },
  payBtnText: { fontFamily: FONT.sansBold, fontSize: 13, color: '#fff' },
  cleanSlate: { marginHorizontal: 18, padding: 16, borderRadius: 12, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', alignItems: 'center', gap: 4 },
  cleanTitle: { fontFamily: FONT.sansBold, fontSize: 15, color: '#065F46' },
  cleanDesc: { fontFamily: FONT.sans, fontSize: 13, color: '#047857', textAlign: 'center' },
  servicesRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  serviceBtn: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: C.white, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border, minHeight: TOUCH + 24, ...cardShadow },
  serviceIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  serviceLabel: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.text1, textAlign: 'center' },
  ctaCard: { marginHorizontal: 18, marginTop: 14, padding: 16, backgroundColor: C.navy, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12, ...cardShadow },
  ctaTitle: { fontFamily: FONT.displayBold, fontSize: 15, color: '#fff', lineHeight: 20 },
  ctaSub: { fontFamily: FONT.sans, fontSize: 12.5, color: '#CBD5E1', marginTop: 4 },
  emptyReportsBox: { padding: 24, alignItems: 'center', gap: 6 },
  emptyReportsTitle: { fontFamily: FONT.displayBold, fontSize: 16, color: C.navy },
  emptyReportsDesc: { fontFamily: FONT.sans, fontSize: 13, color: C.text3, textAlign: 'center', lineHeight: 19, maxWidth: 280 },
  citizenReportRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, minHeight: TOUCH + 8 },
  cReportTitle: { fontFamily: FONT.sansBold, fontSize: 14, color: C.text1 },
  cReportAddr: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text3, marginTop: 2 },
  cReportBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: C.blueSoft },
  cReportBadgeText: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.blue },
});
