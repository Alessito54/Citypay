import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Badge, Button, FieldMessage, Section, SelectField, cardShadow, surface } from '@/components/ui';
import { C, FONT, RADIUS } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { useTheme, type ThemeMode } from '@/features/theme/theme-context';
import { confirmAction } from '@/lib/alerts';
import { departmentLabel, MUNICIPAL_DEPARTMENTS } from '@/lib/orizaba';
import { roleLabel, type Role } from '@/lib/roles';

const PREVIEW_ROLES: { label: string; role: Role }[] = [
  { label: 'Ciudadano', role: 'citizen' },
  { label: 'Personal de área', role: 'municipal_official' },
  { label: 'Supervisor / Contraloría', role: 'municipal_supervisor' },
  { label: 'Administrador general', role: 'admin' },
];

const DEPT_OPTIONS = ['Sin área específica', ...MUNICIPAL_DEPARTMENTS.map((d) => d.shortName)];

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session, staff, permissions, signOut, switchRolePreview } = useAuth();
  const { mode, dark, colors, setMode } = useTheme();
  const [switching, setSwitching] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const THEME_OPTIONS: { id: ThemeMode; label: string; icon: IconName }[] = [
    { id: 'light', label: 'Claro', icon: 'sun' },
    { id: 'dark', label: 'Oscuro', icon: 'moon' },
    { id: 'system', label: 'Sistema', icon: 'settings' },
  ];

  const confirmSignOut = () =>
    confirmAction('¿Cerrar sesión?', 'Tendrás que volver a ingresar tu correo y contraseña.', 'Cerrar sesión', async () => {
      await signOut();
      router.replace('/login');
    });

  const currentRoleOption = PREVIEW_ROLES.find((r) => r.role === session?.role)?.label ?? 'Ciudadano';
  const currentDeptShort =
    MUNICIPAL_DEPARTMENTS.find((d) => d.slug === session?.department)?.shortName ?? 'Sin área específica';

  const applyPreview = async (nextRole: Role, nextDept: string | null) => {
    setSwitching(true);
    setMsg(null);
    try {
      await switchRolePreview(nextRole, nextDept);
      setMsg(`Vista activa cambiada a: ${roleLabel(nextRole, nextDept)}`);
    } finally {
      setSwitching(false);
    }
  };

  const activeRole = (session?.role ?? 'citizen') as Role;

  const quickLinks: { icon: IconName; title: string; sub: string; onPress: () => void }[] = staff
    ? [
        ...(permissions.canViewPayments
          ? [
              {
                icon: 'card' as IconName,
                title: 'Pagos y conciliación bancaria',
                sub: 'Revisar diferencias y emitir dictámenes de conciliación',
                onPress: () => router.navigate('/payments'),
              },
            ]
          : []),
        {
          icon: 'chat',
          title: 'Bandeja de reportes ciudadanos',
          sub: 'Atender incidencias reportadas y actualizar su estado',
          onPress: () => router.navigate('/reports'),
        },
        {
          icon: 'bulb',
          title: permissions.canManageStaff ? 'Personal y áreas municipales' : 'Directorio de áreas municipales',
          sub: permissions.canManageStaff
            ? 'Asignar colaboradores por coordinación'
            : 'Consultar extensiones y trámites por coordinación',
          onPress: () => router.navigate('/orizaba'),
        },
      ]
    : [
        {
          icon: 'card',
          title: 'Mis pagos, adeudos y catastro',
          sub: 'Pagar predial, agua e infracciones de tránsito; editar clave catastral y placas',
          onPress: () => router.navigate('/payments'),
        },
        {
          icon: 'camera',
          title: 'Levantar o consultar un reporte',
          sub: 'Reportar baches, fugas o alumbrado con fotografía y mapa',
          onPress: () => router.navigate('/reports'),
        },
        {
          icon: 'bulb',
          title: '¿A dónde me dirijo? Guía de atención',
          sub: 'Indicaciones rápidas según el trámite o problema que tengas',
          onPress: () => router.navigate('/orizaba'),
        },
      ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[s.root, { paddingTop: insets.top + 24, paddingBottom: 32 }]}>
      <View style={[s.headerCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
        <View style={[s.avatar, { backgroundColor: colors.blueIcon }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Icon name="user" size={32} color={colors.blue} />
        </View>
        <Text accessibilityRole="header" style={[s.name, { color: colors.navy }]}>
          {session?.displayName || 'Usuario'}
        </Text>
        <Text style={[s.mail, { color: colors.text2 }]}>{session?.email}</Text>
        <View style={{ marginTop: 10 }} accessible accessibilityLabel={`Cuenta: ${roleLabel(session?.role, session?.department)}`}>
          <Badge label={roleLabel(session?.role, session?.department)} symbol="✓" bg={colors.blueSoft} fg={colors.blue} />
        </View>
        {session?.department ? <Text style={[s.deptText, { color: colors.text2 }]}>{departmentLabel(session.department)}</Text> : null}
      </View>

      <Section label="Apariencia de la aplicación">
        <View style={[s.card, { backgroundColor: colors.white, borderColor: colors.border }]}>
          <Text style={[s.helper, { color: colors.text2 }]}>
            Elige el tema visual que prefieras ({dark ? 'Modo oscuro activo' : 'Modo claro activo'}). También puedes cambiarlo rápido desde el ícono superior.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {THEME_OPTIONS.map((opt) => {
              const active = mode === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active, checked: active }}
                  onPress={() => setMode(opt.id)}
                  style={[
                    s.themeChip,
                    {
                      backgroundColor: active ? colors.blueSoft : colors.screen,
                      borderColor: active ? colors.blue : colors.border,
                    },
                  ]}>
                  <Icon name={opt.icon} size={16} color={active ? colors.blue : colors.text2} strokeWidth={2.2} />
                  <Text style={[s.themeChipText, { color: active ? colors.blue : colors.text1 }]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Section>

      <Section label="Accesos rápidos para tu cuenta">
        <View style={[s.card, { padding: 0, backgroundColor: colors.white, borderColor: colors.border }]}>
          {quickLinks.map((item, idx) => (
            <Pressable
              key={item.title}
              accessibilityRole="button"
              onPress={item.onPress}
              style={({ pressed }) => [
                s.navRow,
                idx < quickLinks.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                pressed && { backgroundColor: colors.blueSoft },
              ]}>
              <View style={[s.navIcon, { backgroundColor: colors.blueIcon }]}>
                <Icon name={item.icon} size={20} color={colors.blue} strokeWidth={2.1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.navTitle, { color: colors.text1 }]}>{item.title}</Text>
                <Text style={[s.navSub, { color: colors.text2 }]}>{item.sub}</Text>
              </View>
              <Icon name="chevronRight" size={16} color={colors.text3} strokeWidth={2.4} />
            </Pressable>
          ))}
        </View>
      </Section>

      <Section label="Cambiar vista de prueba (Roles y Áreas)">
        <View style={[s.card, { backgroundColor: colors.white, borderColor: colors.border }]}>
          <Text style={[s.helper, { color: colors.text2 }]}>
            Para fines de demostración puedes alternar entre vista de Ciudadano, Personal de área (Ingresos, Egresos, Catastro, Tránsito, Obras Públicas, Recursos Humanos, etc.), Supervisor o Administrador.
          </Text>
          <SelectField
            variant="row"
            label="Tipo de cuenta"
            leftIcon="user"
            value={currentRoleOption}
            options={PREVIEW_ROLES.map((r) => r.label)}
            onChange={(label) => {
              const chosen = PREVIEW_ROLES.find((r) => r.label === label)?.role ?? 'citizen';
              const defaultDept =
                chosen === 'municipal_official'
                  ? (session?.department ?? 'ingresos')
                  : chosen === 'municipal_supervisor'
                    ? (session?.department ?? 'contraloria')
                    : null;
              void applyPreview(chosen, defaultDept);
            }}
          />
          {session?.role === 'municipal_official' || session?.role === 'municipal_supervisor' ? (
            <SelectField
              variant="row"
              label="Área asignada"
              leftIcon="globe"
              value={currentDeptShort}
              options={DEPT_OPTIONS}
              onChange={(shortName) => {
                const found = MUNICIPAL_DEPARTMENTS.find((d) => d.shortName === shortName);
                void applyPreview(activeRole, found?.slug ?? null);
              }}
            />
          ) : null}
          {switching ? <Text style={s.helper}>Actualizando vista…</Text> : null}
          <FieldMessage text={msg ?? undefined} tone="success" />
        </View>
      </Section>

      <View style={{ paddingHorizontal: 18, marginTop: 18 }}>
        <Button
          variant="secondary"
          icon="logout"
          label="Cerrar sesión"
          accessibilityHint="Te pedirá confirmación antes de salir"
          onPress={confirmSignOut}
        />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flexGrow: 1 },
  headerCard: { marginHorizontal: 18, padding: 20, alignItems: 'center', ...surface, ...cardShadow },
  themeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderWidth: 1.5 },
  themeChipText: { fontFamily: FONT.sansBold, fontSize: 13 },
  avatar: { width: 68, height: 68, borderRadius: RADIUS, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: FONT.displayXBold, fontSize: 21, color: C.navy, marginTop: 12, textAlign: 'center' },
  mail: { fontFamily: FONT.sans, fontSize: 14.5, color: C.text2, marginTop: 2 },
  deptText: { fontFamily: FONT.sansMedium, fontSize: 13, color: C.text2, marginTop: 6, textAlign: 'center' },
  card: { ...surface, padding: 14, gap: 10, overflow: 'hidden', ...cardShadow },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: C.divider },
  navIcon: { width: 40, height: 40, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  navSub: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text2, marginTop: 2, lineHeight: 17 },
  helper: { fontFamily: FONT.sans, fontSize: 13, color: C.text2, lineHeight: 18 },
});
