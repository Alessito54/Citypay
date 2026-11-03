import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { AdminLogo, HeaderLogo } from '@/components/brand';
import { Icon, type IconName } from '@/components/icon';
import { cardShadow, EmptyState, FieldMessage, KpiCard, Section, SelectField } from '@/components/ui';
import { C, FONT, TOUCH } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { fmtMoney } from '@/features/reconciliation/format';
import { AREA_LABEL, departmentsService } from '@/services/departments-service';
import { type Department, type DepartmentArea, isStaffRole } from '@/types';

const AREA_FILTERS: { label: string; value: DepartmentArea | 'todas' }[] = [
  { label: 'Todas las áreas', value: 'todas' },
  { label: AREA_LABEL.recaudacion, value: 'recaudacion' },
  { label: AREA_LABEL.operacion, value: 'operacion' },
  { label: AREA_LABEL.control, value: 'control' },
];

const AREA_ICON: Record<DepartmentArea, IconName> = {
  recaudacion: 'money',
  operacion: 'tool',
  control: 'search',
};

/**
 * Directory and control panel of the municipal departments. Staff see the
 * indicators of each office; a citizen sees what each one attends and how to
 * reach it.
 */
export function DepartmentsScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const isStaff = isStaffRole(session?.role);
  const isAdmin = session?.role === 'admin';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [area, setArea] = useState('Todas las áreas');

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await departmentsService.list();
      setDepartments(res.items);
    } catch (e: any) {
      setError(e?.message || 'No se pudieron cargar los departamentos.');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const activeArea = AREA_FILTERS.find((a) => a.label === area)?.value ?? 'todas';
  const list = useMemo(
    () => departments.filter((d) => activeArea === 'todas' || d.area === activeArea),
    [departments, activeArea],
  );

  const totals = useMemo(() => {
    const withMetrics = departments.filter((d) => d.metrics);
    return {
      recaudado: withMetrics
        .filter((d) => !d.isConsolidator)
        .reduce((a, d) => a + (d.metrics?.recaudado ?? 0), 0),
      cartera: withMetrics
        .filter((d) => !d.isConsolidator)
        .reduce((a, d) => a + (d.metrics?.carteraPendiente ?? 0) + (d.metrics?.carteraVencida ?? 0), 0),
      abiertos: withMetrics.reduce(
        (a, d) =>
          a +
          (d.metrics?.reportesNuevos ?? 0) +
          (d.metrics?.reportesAsignados ?? 0) +
          (d.metrics?.reportesProceso ?? 0),
        0,
      ),
      vencidos: withMetrics.reduce((a, d) => a + (d.metrics?.reportesVencidos ?? 0), 0),
      equipo: withMetrics.reduce((a, d) => a + (d.metrics?.equipo ?? 0), 0),
    };
  }, [departments]);

  const myDepartment = departments.find((d) => d.id === session?.departmentId);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.white }}>
        <AppHeader
          logo={isAdmin ? <AdminLogo /> : <HeaderLogo />}
          initial={(session?.displayName || 'U').charAt(0).toUpperCase()}
          badgeCount={isStaff ? totals.vencidos : 0}
          onAvatarPress={() => router.navigate('/profile')}
        />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
          <Text accessibilityRole="header" style={s.h1}>
            Departamentos
          </Text>
          <Text style={s.sub}>
            {isStaff
              ? 'Áreas que administran los impuestos, derechos y servicios del municipio.'
              : 'Conoce qué atiende cada área del municipio y cómo contactarla.'}
          </Text>
        </View>

        {error ? (
          <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
            <FieldMessage text={error} />
          </View>
        ) : null}

        {myDepartment ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Mi departamento: ${myDepartment.name}. Abrir panel.`}
            onPress={() => router.push(`/department/${myDepartment.slug}`)}
            style={({ pressed }) => [s.mine, pressed && { opacity: 0.92 }]}>
            <Text style={{ fontSize: 26 }}>{myDepartment.icon}</Text>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.mineLabel}>MI DEPARTAMENTO</Text>
              <Text numberOfLines={1} style={s.mineName}>
                {myDepartment.name}
              </Text>
            </View>
            <Text style={s.mineCta}>Abrir panel</Text>
            <Icon name="chevronRight" size={16} color={C.blue} strokeWidth={2.5} />
          </Pressable>
        ) : null}

        {isStaff ? (
          <Section label="Resumen de la administración">
            <View style={{ gap: 10 }}>
              <View style={s.pair}>
                <KpiCard
                  icon="money"
                  label="Recaudación conciliada"
                  value={fmtMoney(totals.recaudado)}
                  sub="Suma de las áreas de cobro"
                />
                <KpiCard
                  icon="warn"
                  label="Cartera por cobrar"
                  value={fmtMoney(totals.cartera)}
                  sub="Adeudos vigentes y vencidos"
                />
              </View>
              <View style={s.pair}>
                <KpiCard
                  icon="chat"
                  label="Reportes abiertos"
                  value={`${totals.abiertos}`}
                  sub={`${totals.vencidos} fuera de plazo`}
                />
                <KpiCard
                  icon="user"
                  label="Personal adscrito"
                  value={`${totals.equipo}`}
                  sub={`${departments.length} departamentos`}
                />
              </View>
            </View>
          </Section>
        ) : null}

        <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
          <SelectField
            label="Área"
            value={area}
            options={AREA_FILTERS.map((a) => a.label)}
            onChange={setArea}
            variant="row"
            leftIcon="settings"
            active={activeArea !== 'todas'}
          />
        </View>

        <Section label={`${list.length} ${list.length === 1 ? 'departamento' : 'departamentos'}`}>
          {loading ? (
            <Text style={s.loading}>Cargando departamentos…</Text>
          ) : list.length === 0 ? (
            <EmptyState
              title="No hay departamentos en esta área"
              body="Cambia el filtro de área para ver el resto de la estructura municipal."
              actionLabel="Ver todas las áreas"
              onAction={() => setArea('Todas las áreas')}
            />
          ) : (
            <View style={{ gap: 10 }}>
              {list.map((d) => (
                <DepartmentCard key={d.id} department={d} staff={isStaff} />
              ))}
            </View>
          )}
        </Section>

        {isStaff ? (
          <Section label="Informes y reportes de gestión">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir el Centro de Informes"
              accessibilityHint="Genera informes de recaudación, conciliación, cartera y desempeño"
              onPress={() => router.push('/informes')}
              style={({ pressed }) => [s.informesCta, pressed && { backgroundColor: C.blueSoft }]}>
              <View style={s.informesIcon}>
                <Icon name="chart" size={22} color={C.blue} strokeWidth={2} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.informesTitle}>Centro de Informes</Text>
                <Text style={s.informesSub}>
                  Recaudación, conciliación bancaria, cartera y desempeño por departamento.
                </Text>
              </View>
              <Icon name="chevronRight" size={16} color={C.text3} strokeWidth={2.5} />
            </Pressable>
          </Section>
        ) : null}
      </ScrollView>
    </View>
  );
}

function DepartmentCard({ department, staff }: { department: Department; staff: boolean }) {
  const m = department.metrics;
  const abiertos = m ? m.reportesNuevos + m.reportesAsignados + m.reportesProceso : 0;
  const cartera = m ? m.carteraPendiente + m.carteraVencida : 0;

  const summary = staff && m
    ? `${fmtMoney(m.recaudado)} conciliados, ${abiertos} reportes abiertos, ${m.equipo} ${m.equipo === 1 ? 'persona' : 'personas'}.`
    : `${department.description}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${department.name}. ${AREA_LABEL[department.area]}. ${summary}`}
      accessibilityHint="Abre el panel del departamento"
      onPress={() => router.push(`/department/${department.slug}`)}
      style={({ pressed }) => [s.card, pressed && { backgroundColor: C.blueSoft }]}>
      <View style={s.cardHead}>
        <View style={s.thumb}>
          <Text style={{ fontSize: 24 }}>{department.icon}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={2} style={s.cardTitle}>
            {department.name}
          </Text>
          <View style={s.chipRow}>
            <View style={s.areaChip}>
              <Icon name={AREA_ICON[department.area]} size={12} color={C.blueChipText} />
              <Text style={s.areaChipText}>{AREA_LABEL[department.area]}</Text>
            </View>
            {department.isConsolidator ? (
              <View style={[s.areaChip, { backgroundColor: C.blueIcon }]}>
                <Text style={[s.areaChipText, { color: C.blue }]}>Consolida</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Icon name="chevronRight" size={16} color={C.text3} strokeWidth={2.4} />
      </View>

      <Text numberOfLines={2} style={s.cardDesc}>
        {department.description}
      </Text>

      {staff && m ? (
        <View style={s.metrics}>
          <Metric label="Conciliado" value={fmtMoney(m.recaudado)} />
          <Metric label="Por cobrar" value={fmtMoney(cartera)} />
          <Metric
            label="Reportes abiertos"
            value={`${abiertos}`}
            tone={m.reportesVencidos > 0 ? 'danger' : 'default'}
            hint={m.reportesVencidos > 0 ? `${m.reportesVencidos} fuera de plazo` : undefined}
          />
        </View>
      ) : (
        <View style={s.contact}>
          <ContactRow icon="user" text={department.headName || 'Titular por designar'} />
          <ContactRow icon="clock" text={department.scheduleLabel || 'Horario por confirmar'} />
          {department.contactPhone ? <ContactRow icon="card" text={department.contactPhone} /> : null}
        </View>
      )}
    </Pressable>
  );
}

function Metric({
  label,
  value,
  tone = 'default',
  hint,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'danger';
  hint?: string;
}) {
  return (
    <View style={s.metric}>
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={[s.metricValue, tone === 'danger' && { color: C.danger }]}>{value}</Text>
      {hint ? <Text style={s.metricHint}>{hint}</Text> : null}
    </View>
  );
}

function ContactRow({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={s.contactRow}>
      <Icon name={icon} size={14} color={C.blueMid} />
      <Text numberOfLines={1} style={s.contactText}>
        {text}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: FONT.displayXBold, fontSize: 26, color: C.navy },
  sub: { fontFamily: FONT.sans, fontSize: 14, color: C.text2, marginTop: 3, lineHeight: 19 },
  pair: { flexDirection: 'row', gap: 10 },
  loading: { fontFamily: FONT.sans, fontSize: 14, color: C.text3, paddingVertical: 18, textAlign: 'center' },
  mine: { marginHorizontal: 18, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 64, borderRadius: 14, backgroundColor: C.blueSoft, borderWidth: 1.5, borderColor: C.blue },
  mineLabel: { fontFamily: FONT.sansSemi, fontSize: 11, letterSpacing: 0.4, color: C.blueChipText },
  mineName: { fontFamily: FONT.sansBold, fontSize: 15, color: C.navy, marginTop: 1 },
  mineCta: { fontFamily: FONT.sansBold, fontSize: 13.5, color: C.blue },
  card: { backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, gap: 10, ...cardShadow },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  thumb: { width: 50, height: 50, borderRadius: 12, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: FONT.sansBold, fontSize: 15.5, color: C.text1, lineHeight: 21 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  areaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.blueChip, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  areaChipText: { fontFamily: FONT.sansSemi, fontSize: 11.5, color: C.blueChipText },
  cardDesc: { fontFamily: FONT.sans, fontSize: 13, color: C.text2, lineHeight: 19 },
  metrics: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.divider, paddingTop: 10, gap: 8 },
  metric: { flex: 1, minWidth: 0 },
  metricLabel: { fontFamily: FONT.sansSemi, fontSize: 11.5, color: C.text3 },
  metricValue: { fontFamily: FONT.displayBold, fontSize: 15, color: C.text1, marginTop: 2 },
  metricHint: { fontFamily: FONT.sans, fontSize: 11.5, color: C.danger, marginTop: 1 },
  contact: { borderTopWidth: 1, borderTopColor: C.divider, paddingTop: 10, gap: 5 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { flex: 1, fontFamily: FONT.sans, fontSize: 12.5, color: C.text2 },
  informesCta: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: TOUCH + 20, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, ...cardShadow },
  informesIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  informesTitle: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  informesSub: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text3, marginTop: 2, lineHeight: 17 },
});
