import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { AdminLogo } from '@/components/brand';
import { Icon, type IconName } from '@/components/icon';
import { notAvailable } from '@/components/not-available';
import { cardShadow, KpiCard, PrimaryButton, Section } from '@/components/ui';
import { C, FONT } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';

import { fmtMoney } from './format';
import { useReconciliation } from './reconciliation-context';
import { TransactionRow } from './transaction-row';

const QUICK: { icon: string; label: string; action: () => void }[] = [
  { icon: '💳', label: 'Registrar\npago', action: () => notAvailable('Registrar pago') },
  { icon: '🔍', label: 'Buscar\nusuario', action: () => notAvailable('Buscar usuario') },
  { icon: '📋', label: 'Nueva\nsolicitud', action: () => notAvailable('Nueva solicitud') },
  { icon: '📊', label: 'Generar\nreporte', action: () => router.push('/new-report') },
  { icon: '📢', label: 'Notificación\nmasiva', action: () => notAvailable('Notificación masiva') },
];

const ACTIVITY: { icon: string; label: string; sub: string; count: number; action: () => void }[] = [
  { icon: '💳', label: 'Pagos', sub: 'Último: Pago recibido · Hace 5 min', count: 12, action: () => router.navigate('/payments') },
  { icon: '👤', label: 'Usuarios', sub: 'Último: Nuevo usuario registrado · Hace 19 min', count: 8, action: () => notAvailable('Usuarios') },
  { icon: '📋', label: 'Solicitudes', sub: 'Último: Nueva solicitud de reporte · Hace 52 min', count: 6, action: () => router.navigate('/reports') },
  { icon: '⚠️', label: 'Incidencias', sub: 'Último: Pago fallido · Hace 40 min', count: 4, action: () => notAvailable('Incidencias') },
];

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

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.white }}>
        <AppHeader logo={<AdminLogo />} initial={name.charAt(0).toUpperCase()} dot onAvatarPress={() => router.navigate('/profile')} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={s.greet}>
          <View style={{ flex: 1 }}>
            <Text style={s.hello}>¡Hola, {name}!</Text>
            <Text style={s.role}>Panel de administrador</Text>
          </View>
          <View style={s.date}>
            <Icon name="calendar" size={12} color={C.blue} strokeWidth={2.5} />
            <Text style={s.dateText}>{today}</Text>
          </View>
        </View>

        <View style={s.demoNote}>
          <Text style={s.demoText}>Datos de demostración · sin conexión bancaria ni backend</Text>
        </View>

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

        <Section label="Acciones rápidas" link="Ver todas" onLinkPress={() => notAvailable('Acciones rápidas')}>
          <View style={s.quick}>
            {QUICK.map((a) => (
              <Pressable key={a.label} accessibilityRole="button" accessibilityLabel={a.label.replace('\n', ' ')} onPress={a.action} style={s.quickItem}>
                <View style={s.quickIcon}>
                  <Text style={{ fontSize: 20 }}>{a.icon}</Text>
                </View>
                <Text style={s.quickLabel}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section label="Conciliación de pagos" link="Ver historial" onLinkPress={() => router.navigate('/payments')}>
          <View style={s.card}>
            <View style={s.summary}>
              <View style={[s.summaryCell, { borderRightWidth: 1, borderRightColor: C.divider }]}>
                <Text style={s.summaryLabel}>TOTAL SISTEMA</Text>
                <Text style={[s.summaryValue, { color: C.text1 }]}>{fmtMoney(totalSistema)}</Text>
                <Text style={s.summaryTrend}>↑ 2.4% vs ayer</Text>
              </View>
              <View style={s.summaryCell}>
                <Text style={s.summaryLabel}>DESCUADRE</Text>
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
                label={abiertas.length > 0 ? 'Revisar diferencias →' : 'Sin diferencias por revisar ✓'}
                disabled={abiertas.length === 0}
                onPress={() => abiertas[0] && open(abiertas[0])}
                style={{ height: 44, shadowOpacity: 0, elevation: 0 }}
              />
            </View>
          </View>
        </Section>

        <Section label="Actividad reciente por categoría">
          <View style={s.card}>
            {ACTIVITY.map((row, i) => (
              <Pressable key={row.label} accessibilityRole="button" onPress={row.action} style={[s.actRow, i < ACTIVITY.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F5F7FA' }]}>
                <View style={s.actIcon}>
                  <Text style={{ fontSize: 18 }}>{row.icon}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.actLabel}>{row.label}</Text>
                  <Text numberOfLines={1} style={s.actSub}>{row.sub}</Text>
                </View>
                <Text style={s.actCount}>{row.count}</Text>
                <Icon name={'chevronRight' as IconName} size={14} color={C.text3} strokeWidth={2.5} />
              </Pressable>
            ))}
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  greet: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  hello: { fontFamily: FONT.displayXBold, fontSize: 22, color: C.text1, letterSpacing: -0.2 },
  role: { fontFamily: FONT.sans, fontSize: 13, color: C.text2, marginTop: 2 },
  date: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  dateText: { fontFamily: FONT.sansSemi, fontSize: 11, color: C.text1 },
  demoNote: { marginHorizontal: 18, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: C.blueIcon },
  demoText: { fontFamily: FONT.sansSemi, fontSize: 10.5, color: C.blue, textAlign: 'center' },
  pair: { flexDirection: 'row', gap: 10 },
  quick: { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem: { flex: 1, alignItems: 'center', gap: 6 },
  quickIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontFamily: FONT.sansMedium, fontSize: 9.5, color: C.text2, textAlign: 'center', lineHeight: 12 },
  card: { backgroundColor: C.white, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border, ...cardShadow },
  summary: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.divider },
  summaryCell: { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  summaryLabel: { fontFamily: FONT.sansSemi, fontSize: 10, color: C.text3, letterSpacing: 0.4, marginBottom: 4 },
  summaryValue: { fontFamily: FONT.displayXBold, fontSize: 16 },
  summaryTrend: { fontFamily: FONT.sansSemi, fontSize: 10, color: C.blueMid, marginTop: 3 },
  actionRow: { padding: 10, paddingHorizontal: 14, backgroundColor: C.blueSoft, borderTopWidth: 1, borderTopColor: C.border },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  actIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  actLabel: { fontFamily: FONT.sansBold, fontSize: 13.5, color: C.text1 },
  actSub: { fontFamily: FONT.sans, fontSize: 11, color: C.text3, marginTop: 2 },
  actCount: { fontFamily: FONT.displayBold, fontSize: 14, color: C.text1, marginRight: 4 },
});
