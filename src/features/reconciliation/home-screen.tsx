import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Button, KpiCard, Notice, Section, cardShadow, surface } from '@/components/ui';
import { C, FONT, RADIUS, TOUCH } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { useReports } from '@/features/reports/reports-context';
import { ScreenTop } from '@/features/shell/screen-top';

import { fmtMoney } from './format';
import { useReconciliation } from './reconciliation-context';
import { summarize } from './selectors';
import { TransactionRow } from './transaction-row';

type Shortcut = { icon: IconName; label: string; hint: string; action: () => void; badge?: number };

const goPayments = (filtro?: string) => router.navigate(filtro ? { pathname: '/payments', params: { filtro } } : '/payments');

/** Staff dashboard. Every number on it is computed from the loaded data. */
export function HomeScreen() {
  const { session } = useAuth();
  const { transactions, source, loading, open } = useReconciliation();
  const { reports } = useReports();
  const sum = summarize(transactions);
  const first = sum.diferencias[0];
  const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  const name = session?.displayName ?? 'Administrador';
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

  const shortcuts: Shortcut[] = [
    {
      icon: 'warn',
      label: 'Revisar\ndiferencias',
      hint: 'Abre la primera diferencia pendiente',
      badge: sum.diferencias.length,
      action: () => (first ? open(first) : goPayments('discrepancia')),
    },
    { icon: 'card', label: 'Buscar\npago', hint: 'Abre la lista de pagos con buscador', action: () => goPayments() },
    { icon: 'doc', label: 'Nuevo\nreporte', hint: 'Abre el formulario de reporte ciudadano', action: () => router.push('/new-report') },
    { icon: 'chat', label: 'Ver\nreportes', hint: 'Abre la lista de reportes', action: () => router.navigate('/reports') },
  ];

  const activity: { icon: IconName; label: string; sub: string; count: number; action: () => void }[] = [
    { icon: 'card', label: 'Pagos', sub: 'Todos los pagos registrados', count: sum.total, action: () => goPayments() },
    { icon: 'warn', label: 'Diferencias por revisar', sub: 'El monto no coincide con el banco', count: sum.diferencias.length, action: () => goPayments('discrepancia') },
    { icon: 'clock', label: 'Pendientes de banco', sub: 'Pagos aún no acreditados', count: sum.pendientes, action: () => goPayments('pendiente') },
    { icon: 'chat', label: 'Reportes ciudadanos', sub: 'Problemas reportados en la ciudad', count: reports.length, action: () => router.navigate('/reports') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenTop />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={s.greet}>
          <View style={{ flex: 1 }}>
            <Text accessibilityRole="header" style={s.hello}>
              ¡Hola, {name}!
            </Text>
            <Text style={s.role}>Panel de administración</Text>
          </View>
          <View style={s.date} accessible accessibilityLabel={`Hoy es ${today}`}>
            <Icon name="calendar" size={14} color={C.blue} strokeWidth={2.5} />
            <Text style={s.dateText}>{today}</Text>
          </View>
        </View>

        {source === 'demo' ? (
          <View style={{ marginHorizontal: 18 }}>
            <Notice tone="warning" text="Sin conexión con el servidor: se muestran datos de demostración." />
          </View>
        ) : null}

        {first ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Atención: ${plural(sum.diferencias.length, 'pago')} con diferencia por revisar. Revisar ahora.`}
            onPress={() => open(first)}
            style={({ pressed }) => [s.alert, pressed && { opacity: 0.9 }]}>
            <Icon name="warn" size={20} color={C.danger} strokeWidth={2.2} />
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>{plural(sum.diferencias.length, 'pago')} con diferencia</Text>
              <Text style={s.alertSub}>El monto del banco no coincide con el sistema.</Text>
            </View>
            <Text style={s.alertCta}>Revisar</Text>
            <Icon name="chevronRight" size={16} color={C.danger} strokeWidth={2.5} />
          </Pressable>
        ) : null}

        <Section label="Acciones rápidas">
          <View style={s.quick}>
            {shortcuts.map((a) => (
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

        <Section label="Resumen">
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

        <Section label="Diferencias por revisar" link="Ver todos" linkHint="Abre la lista completa de pagos" onLinkPress={() => goPayments()}>
          <View style={s.card}>
            {loading ? <Text style={s.empty}>Cargando pagos…</Text> : null}
            {!loading && sum.diferencias.length === 0 ? <Text style={s.empty}>Todo cuadrado: no hay diferencias por revisar.</Text> : null}
            {sum.diferencias.map((tx, i) => (
              <TransactionRow key={tx.id} tx={tx} last={i === sum.diferencias.length - 1} onPress={() => open(tx)} />
            ))}
            {first ? (
              <View style={s.actionRow}>
                <Button label={`Revisar ${plural(sum.diferencias.length, 'diferencia')}`} onPress={() => open(first)} />
              </View>
            ) : null}
          </View>
        </Section>

        <Section label="Actividad">
          <View style={s.card}>
            {activity.map((row, i) => (
              <Pressable
                key={row.label}
                accessibilityRole="button"
                accessibilityLabel={`${row.label}: ${row.count}. ${row.sub}`}
                onPress={row.action}
                style={({ pressed }) => [s.actRow, i < activity.length - 1 && s.divider, pressed && { backgroundColor: C.blueSoft }]}>
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
  date: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, ...surface },
  dateText: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text1 },
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
  quickLabel: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text1, textAlign: 'center', lineHeight: 16 },
  card: { ...surface, overflow: 'hidden', ...cardShadow },
  empty: { fontFamily: FONT.sans, fontSize: 14, color: C.text2, padding: 14 },
  actionRow: { padding: 10, paddingHorizontal: 14, backgroundColor: C.blueSoft, borderTopWidth: 1, borderTopColor: C.border },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 64 },
  divider: { borderBottomWidth: 1, borderBottomColor: C.divider },
  actIcon: { width: 42, height: 42, borderRadius: RADIUS, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  actLabel: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  actSub: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text3, marginTop: 2 },
  actCount: { fontFamily: FONT.displayBold, fontSize: 15, color: C.text1, marginRight: 4 },
});
