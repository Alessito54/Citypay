import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Badge, Button, FieldMessage, Section, SelectField, cardShadow, surface } from '@/components/ui';
import { C, FONT, RADIUS } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { ScreenTop } from '@/features/shell/screen-top';
import { useTheme } from '@/features/theme/theme-context';
import { MUNICIPAL_DEPARTMENTS, MUNICIPIO_INFO } from '@/lib/orizaba';
import { roleLabel, type Role } from '@/lib/roles';
import { usersService } from '@/services/users-service';
import type { ManagedUser } from '@/types';

const ROLE_OPTIONS_ADMIN = [
  'Ciudadano',
  'Personal de área',
  'Supervisor',
  'Administrador',
];
const ROLE_OPTIONS_HR = ['Ciudadano', 'Personal de área', 'Supervisor'];

const LABEL_TO_ROLE: Record<string, Role> = {
  Ciudadano: 'citizen',
  'Personal de área': 'municipal_official',
  Supervisor: 'municipal_supervisor',
  Administrador: 'admin',
};

const ROLE_TO_LABEL: Record<string, string> = {
  citizen: 'Ciudadano',
  municipal_official: 'Personal de área',
  municipal_supervisor: 'Supervisor',
  admin: 'Administrador',
};

const DEPT_SELECT_OPTIONS = ['Sin área específica', ...MUNICIPAL_DEPARTMENTS.map((d) => d.shortName)];

interface GuideAction {
  icon: IconName;
  title: string;
  where: string;
  body: string;
  cta: string;
  onPress: () => void;
}

export function OrizabaScreen() {
  const { staff, permissions } = useAuth();
  const { colors } = useTheme();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [staffMsg, setStaffMsg] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  const loadUsers = useCallback(async () => {
    if (!permissions.canManageStaff) return;
    setLoadingUsers(true);
    try {
      setUsers(await usersService.list());
    } catch (err) {
      setStaffMsg({
        text: err instanceof Error ? err.message : 'No se pudo cargar la plantilla de usuarios.',
        tone: 'error',
      });
    } finally {
      setLoadingUsers(false);
    }
  }, [permissions.canManageStaff]);

  useEffect(() => {
    if (!permissions.canManageStaff) return;
    let alive = true;
    usersService
      .list()
      .then((list) => {
        if (alive) setUsers(list);
      })
      .catch((err) => {
        if (alive) {
          setStaffMsg({
            text: err instanceof Error ? err.message : 'No se pudo cargar la plantilla de usuarios.',
            tone: 'error',
          });
        }
      });
    return () => {
      alive = false;
    };
  }, [permissions.canManageStaff]);

  const handleUpdateUser = async (target: ManagedUser, nextRole: Role, nextDeptSlug: string | null) => {
    setStaffMsg(null);
    try {
      const updated = await usersService.updateRoleAndDepartment(target.id, {
        role: nextRole,
        department: nextRole === 'citizen' ? null : nextDeptSlug,
      });
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, ...updated } : u)));
      setStaffMsg({
        text: `Cuenta actualizada: ${target.displayName} → ${roleLabel(updated.role, updated.department)}`,
        tone: 'success',
      });
    } catch (err) {
      setStaffMsg({
        text: err instanceof Error ? err.message : 'No se pudo actualizar la cuenta.',
        tone: 'error',
      });
    }
  };

  const citizenGuide: GuideAction[] = [
    {
      icon: 'home',
      title: 'Pagar mi Predial o actualizar Catastro',
      where: 'Pestaña Pagos · Dirección de Catastro e Ingresos',
      body: 'Registra tu clave catastral y domicilio de tu propiedad para consultar bimestres pendientes y obtener tu recibo digital.',
      cta: 'Ir a Pagos y Catastro',
      onPress: () => router.navigate('/payments'),
    },
    {
      icon: 'card',
      title: 'Pagar una infracción o boleta de Tránsito',
      where: 'Pestaña Pagos · Tránsito y Vialidad',
      body: 'Vincula las placas de tu vehículo o busca una boleta por folio para liquidarla en línea sin hacer filas.',
      cta: 'Consultar infracciones',
      onPress: () => router.navigate('/payments'),
    },
    {
      icon: 'money',
      title: 'Pagar recibo de Agua Potable',
      where: 'Pestaña Pagos · Agua Potable y Drenaje',
      body: 'Guarda tu número de contrato de agua para revisar tu consumo mensual y pagar con tarjeta, SPEI o CoDi.',
      cta: 'Ver adeudos de agua',
      onPress: () => router.navigate('/payments'),
    },
    {
      icon: 'camera',
      title: 'Reportar un bache, fuga, semáforo o luminaria',
      where: 'Pestaña Reportes · Obras Públicas y Servicios Municipales',
      body: 'Toma hasta 4 fotos del problema, marca el punto en el mapa y envíalo; se canaliza automáticamente al área encargada.',
      cta: 'Levantar reporte ahora',
      onPress: () => router.push('/new-report'),
    },
  ];

  const staffGuide: GuideAction[] = [
    ...(permissions.canViewPayments
      ? [
          {
            icon: 'card' as IconName,
            title: 'Revisar diferencias y emitir dictamen de conciliación',
            where: 'Pestaña Pagos · Tesorería e Ingresos',
            body: 'Para conciliar un pago con diferencia debes capturar clave de rastreo SPEI, monto real en estado de cuenta, póliza y código de seguridad.',
            cta: 'Abrir módulo de pagos',
            onPress: () => router.navigate('/payments'),
          },
        ]
      : []),
    {
      icon: 'tool',
      title: 'Atender reportes ciudadanos y actualizar avance',
      where: 'Pestaña Reportes · Bandeja operativa en tiempo real',
      body: 'Consulta las fotografías y el mapa enviados por los ciudadanos, asigna cuadrilla y cambia el estado hasta marcarlo como Resuelto.',
      cta: 'Ir a bandeja de reportes',
      onPress: () => router.navigate('/reports'),
    },
  ];

  const activeGuide = staff ? staffGuide : citizenGuide;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenTop />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={[s.hero, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
          <Text style={[s.kicker, { color: colors.blue }]}>{MUNICIPIO_INFO.nombre}</Text>
          <Text accessibilityRole="header" style={[s.h1, { color: colors.navy }]}>
            ¿Qué necesitas hacer hoy?
          </Text>
          <Text style={[s.meta, { color: colors.text2 }]}>
            Selecciona la acción que buscas para ir directamente a la sección o área que te corresponde.
          </Text>
        </View>

        <Section label="Guía rápida de trámites y atención">
          <View style={{ gap: 10 }}>
            {activeGuide.map((item) => (
              <Pressable
                key={item.title}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${item.cta}`}
                onPress={item.onPress}
                style={({ pressed }) => [
                  s.guideCard,
                  { backgroundColor: colors.white, borderColor: colors.border, borderLeftColor: colors.blue },
                  pressed && { backgroundColor: colors.blueSoft },
                ]}>
                <View style={s.guideTop}>
                  <View style={[s.guideIcon, { backgroundColor: colors.blueIcon }]}>
                    <Icon name={item.icon} size={20} color={colors.blue} strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.guideTitle, { color: colors.text1 }]}>{item.title}</Text>
                    <Text style={[s.guideWhere, { color: colors.blue }]}>{item.where}</Text>
                  </View>
                </View>
                <Text style={[s.guideBody, { color: colors.text2 }]}>{item.body}</Text>
                <View style={[s.guideCtaRow, { borderTopColor: colors.divider }]}>
                  <Text style={[s.guideCtaText, { color: colors.blue }]}>{item.cta}</Text>
                  <Icon name="chevronRight" size={16} color={colors.blue} strokeWidth={2.5} />
                </View>
              </Pressable>
            ))}
          </View>
        </Section>

        {permissions.canManageStaff ? (
          <Section
            label="Asignación de personal por área (Administración / Recursos Humanos)"
            link="Recargar"
            onLinkPress={loadUsers}>
            <View style={[s.card, { backgroundColor: colors.white, borderColor: colors.border }]}>
              <Text style={[s.helper, { color: colors.text2 }]}>
                Asigna a cada colaborador su nivel de acceso y el departamento municipal en el que atiende trámites o reportes.
              </Text>
              <FieldMessage text={staffMsg?.text} tone={staffMsg?.tone} />
              {loadingUsers ? <Text style={[s.helper, { color: colors.text2 }]}>Cargando cuentas registradas…</Text> : null}
              {!loadingUsers && users.length === 0 ? (
                <Button variant="secondary" label="Consultar cuentas registradas" onPress={loadUsers} />
              ) : null}
              {users.map((u, idx) => {
                const currentRoleLabel = ROLE_TO_LABEL[u.role] ?? 'Ciudadano';
                const currentDept = MUNICIPAL_DEPARTMENTS.find((d) => d.slug === u.department);
                const isTargetAdmin = u.role === 'admin' && !permissions.canAssignAdmin;

                return (
                  <View
                    key={u.id}
                    style={[
                      s.userRow,
                      idx < users.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                    ]}>
                    <View style={s.userHead}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.userName, { color: colors.text1 }]}>{u.displayName || 'Usuario'}</Text>
                        <Text style={[s.userMail, { color: colors.text2 }]}>{u.email}</Text>
                      </View>
                      <Badge label={roleLabel(u.role, u.department)} bg={colors.blueSoft} fg={colors.blue} />
                    </View>
                    {isTargetAdmin ? (
                      <Text style={[s.lockedNote, { color: colors.text3 }]}>Cuenta de Administración General (protegida).</Text>
                    ) : (
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                        <SelectField
                          label="Tipo de cuenta"
                          value={currentRoleLabel}
                          options={permissions.canAssignAdmin ? ROLE_OPTIONS_ADMIN : ROLE_OPTIONS_HR}
                          onChange={(label) => {
                            const r = LABEL_TO_ROLE[label] ?? 'citizen';
                            void handleUpdateUser(u, r, u.department ?? null);
                          }}
                        />
                        {u.role !== 'citizen' ? (
                          <SelectField
                            label="Área"
                            value={currentDept?.shortName ?? 'Sin área específica'}
                            options={DEPT_SELECT_OPTIONS}
                            onChange={(shortName) => {
                              const found = MUNICIPAL_DEPARTMENTS.find((d) => d.shortName === shortName);
                              void handleUpdateUser(u, u.role as Role, found?.slug ?? null);
                            }}
                          />
                        ) : null}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </Section>
        ) : null}

        <Section label="¿A qué área municipal dirigirse?">
          <View style={{ gap: 10 }}>
            {MUNICIPAL_DEPARTMENTS.map((d) => (
              <View key={d.slug} style={[s.deptCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
                <View style={s.deptTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.deptName, { color: colors.text1 }]}>{d.name}</Text>
                    <Text style={[s.deptParent, { color: colors.blue }]}>{d.parentArea}</Text>
                  </View>
                  <Text style={[s.extBadge, { color: colors.navy, backgroundColor: colors.blueIcon }]}>Ext. {d.extension}</Text>
                </View>
                <Text style={[s.deptDesc, { color: colors.text2 }]}>{d.citizenGuidance}</Text>
              </View>
            ))}
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.border },
  kicker: { fontFamily: FONT.sansBold, fontSize: 11.5, color: C.blue, textTransform: 'uppercase', letterSpacing: 0.7 },
  h1: { fontFamily: FONT.displayXBold, fontSize: 22, color: C.navy, marginTop: 2 },
  meta: { fontFamily: FONT.sans, fontSize: 13.5, color: C.text2, marginTop: 4, lineHeight: 19 },
  guideCard: { ...surface, padding: 14, gap: 8, borderLeftWidth: 4, borderLeftColor: C.blue, ...cardShadow },
  guideTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  guideIcon: { width: 42, height: 42, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  guideTitle: { fontFamily: FONT.sansBold, fontSize: 15, color: C.text1 },
  guideWhere: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.blue, marginTop: 2 },
  guideBody: { fontFamily: FONT.sans, fontSize: 13.5, color: C.text2, lineHeight: 19 },
  guideCtaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 },
  guideCtaText: { fontFamily: FONT.sansBold, fontSize: 13.5, color: C.blue },
  card: { ...surface, padding: 14, gap: 10, ...cardShadow },
  helper: { fontFamily: FONT.sans, fontSize: 13, color: C.text2, lineHeight: 18 },
  userRow: { paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: C.divider },
  userHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  userName: { fontFamily: FONT.sansBold, fontSize: 14, color: C.text1 },
  userMail: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text2 },
  lockedNote: { fontFamily: FONT.sans, fontSize: 12, color: C.text3, marginTop: 4 },
  deptCard: { ...surface, padding: 14, gap: 6, borderRadius: RADIUS, ...cardShadow },
  deptTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  deptName: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  deptParent: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.blue, marginTop: 1 },
  extBadge: { fontFamily: FONT.monoMedium, fontSize: 12, color: C.navy, backgroundColor: C.blueIcon, paddingHorizontal: 8, paddingVertical: 3 },
  deptDesc: { fontFamily: FONT.sans, fontSize: 13.5, color: C.text2, lineHeight: 19 },
});
