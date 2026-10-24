import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { AdminLogo } from '@/components/brand';
import { Icon, type IconName } from '@/components/icon';
import { cardShadow, KpiCard, PrimaryButton, Section } from '@/components/ui';
import { C, FONT, TOUCH } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';

import { fmtMoney } from './format';
import { useReconciliation } from './reconciliation-context';
import { TransactionRow } from './transaction-row';

type QuickAction = { icon: IconName; label: string; hint: string; action: () => void; badge?: number };

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { transactions, resolvedIds, open } = useReconciliation();

  const effective = transactions.map((t) => (resolvedIds.has(t.id) ? { ...t, estado: 'conciliado' as const, montoBanco: t.montoSistema } : t));
  const cuadrados = effective.filter((t) => t.estado === 'conciliado').length;
  const diferencias = transactions.filter((t) => t.estado === 'discrepancia');
  const abiertas = diferencias.filter((t) => !resolvedIds.has(t.id));
  const pendientes = effective.filter((t) => t.estado === 'pendiente').length;
  const totalSistema = transactions.reduce((a, t) => a + t.montoSistema, 0);
  const descuadre = Math.abs(effective.reduce((a, t) => a + (t.montoBanco - t.montoSistema), 0));
  const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  const name = session?.displayName ?? 'Administrador';

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

  const ACTIVITY: { icon: IconName; label: string; sub: string; count: number; action: () => void }[] = [
    { icon: 'card', label: 'Pagos', sub: 'Último: pago recibido · hace 5 min', count: transactions.length, action: () => goPayments() },
    { icon: 'warn', label: 'Diferencias por revisar', sub: 'Pagos cuyo monto no coincide con el banco', count: abiertas.length, action: () => goPayments('discrepancia') },
    { icon: 'clock', label: 'Pendientes de banco', sub: 'Pagos aún no acreditados', count: pendientes, action: () => goPayments('pendiente') },
    { icon: 'chat', label: 'Reportes ciudadanos', sub: 'Último: nueva solicitud · hace 52 min', count: 6, action: () => router.navigate('/reports') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.white }}>
        <AppHeader logo={<AdminLogo />} initial={name.charAt(0).toUpperCase()} dot onAvatarPress={() => router.navigate('/profile')} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={s.greet}>
          <View style={{ flex: 1 }}>
            <Text accessibilityRole="header" style={s.hello}>
              ¡Hola, {name}!
            </Text>
            <Text style={s.role}>Panel de administrador</Text>
          </View>
          <View style={s.date} accessible accessibilityLabel={`Hoy es ${today}`}>
            <Icon name="calendar" size={14} color={C.blue} strokeWidth={2.5} />
            <Text style={s.dateText}>{today}</Text>
          </View>
        </View>

        <View style={s.demoNote}>
          <Text style={s.demoText}>Datos de demostración · sin conexión bancaria ni backend</Text>
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

        <Section label="Resumen rápido">
          <View style={{ gap: 10 }}>
            <View style={s.pair}>
              <KpiCard icon="money" label="Ingresos hoy" value={`$${(totalSistema / 1000).toFixed(1)}K`} sub="MXN" trend={2.0} />
              <KpiCard icon="card" label="Pagos cuadrados" value={`${cuadrados}`} sub="Cuadrados" trend={8.3} />
            </View>
            <View style={s.pair}>
              <KpiCard icon="warn" label="Descuadre detectado" value={`$${(descuadre / 1000).toFixed(1)}K`} sub="MXN" trend={-abiertas.length} />
              <KpiCard icon="clock" label="Pendientes de banco" value={`${pendientes}`} sub="Pendientes" trend={-4.2} />
            </View>
          </View>
        </Section>

        <Section label="Conciliación de pagos" link="Ver todos" linkHint="Abre la lista completa de pagos" onLinkPress={() => goPayments()}>
          <View style={s.card}>
            <View style={s.summary}>
              <View
                style={[s.summaryCell, { borderRightWidth: 1, borderRightColor: C.divider }]}
                accessible
                accessibilityLabel={`Total en sistema: ${fmtMoney(totalSistema)}. Subió 2.4 por ciento contra ayer.`}>
                <Text style={s.summaryLabel}>Total sistema</Text>
                <Text style={[s.summaryValue, { color: C.text1 }]}>{fmtMoney(totalSistema)}</Text>
                <Text style={s.summaryTrend}>↑ 2.4% vs ayer</Text>
              </View>
              <View
                style={s.summaryCell}
                accessible
                accessibilityLabel={`Descuadre: ${fmtMoney(descuadre)}. ${abiertas.length} diferencias detectadas.`}>
                <Text style={s.summaryLabel}>Descuadre</Text>
                <Text style={[s.summaryValue, { color: C.blue }]}>{fmtMoney(descuadre)}</Text>
                <Text style={s.summaryTrend}>
                  {abiertas.length} diferencia{abiertas.length !== 1 ? 's' : ''} detectada{abiertas.length !== 1 ? 's' : ''}
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
    </View>
  );
}

const s = StyleSheet.create({
  greet: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  hello: { fontFamily: FONT.displayXBold, fontSize: 22, color: C.text1, letterSpacing: -0.2 },
  role: { fontFamily: FONT.sans, fontSize: 14, color: C.text2, marginTop: 2 },
  date: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  dateText: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text1 },
  demoNote: { marginHorizontal: 18, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, backgroundColor: C.blueIcon },
  demoText: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.blue, textAlign: 'center' },
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
  card: { backgroundColor: C.white, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border, ...cardShadow },
  summary: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.divider },
  summaryCell: { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  summaryLabel: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text3, marginBottom: 4 },
  summaryValue: { fontFamily: FONT.displayXBold, fontSize: 17 },
  summaryTrend: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.blueMid, marginTop: 3 },
  actionRow: { padding: 10, paddingHorizontal: 14, backgroundColor: C.blueSoft, borderTopWidth: 1, borderTopColor: C.border },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 64 },
  actIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  actLabel: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  actSub: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text3, marginTop: 2 },
  actCount: { fontFamily: FONT.displayBold, fontSize: 15, color: C.text1, marginRight: 4 },
});
