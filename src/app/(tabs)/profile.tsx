import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { confirmAction } from '@/components/confirm';
import { Icon, type IconName } from '@/components/icon';
import { cardShadow } from '@/components/ui';
import { C, FONT, TOUCH } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { ROLE_LABEL } from '@/services/departments-service';
import { isStaffRole } from '@/types';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();

  const roleText = session?.role ? ROLE_LABEL[session.role] || session.role : 'Ciudadano';
  const isStaff = isStaffRole(session?.role);

  /** Shortcuts that only make sense for someone working inside the municipality. */
  const links: { icon: IconName; label: string; sub: string; action: () => void }[] = [];
  if (session?.departamentoSlug) {
    links.push({
      icon: 'home',
      label: 'Mi departamento',
      sub: session.departamento || 'Panel de mi área',
      action: () => router.push(`/department/${session.departamentoSlug}`),
    });
  }
  if (isStaff) {
    links.push({
      icon: 'settings',
      label: 'Departamentos municipales',
      sub: 'Estructura, indicadores y contactos',
      action: () => router.navigate('/departments'),
    });
    links.push({
      icon: 'chart',
      label: 'Centro de Informes',
      sub: 'Recaudación, cartera y desempeño',
      action: () => router.push('/informes'),
    });
  } else {
    links.push({
      icon: 'settings',
      label: 'Directorio de departamentos',
      sub: 'Qué atiende cada área y cómo contactarla',
      action: () => router.navigate('/departments'),
    });
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={[s.root, { paddingTop: insets.top + 24 }]}>
      <View style={s.avatar} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Icon name="user" size={32} color={C.blue} />
      </View>
      <Text accessibilityRole="header" style={s.name}>{session?.displayName || 'Usuario'}</Text>
      <Text style={s.mail}>{session?.email}</Text>
      <View style={s.roleBadge} accessible accessibilityLabel={`Rol: ${roleText}`}>
        <Icon name="check" size={12} color={C.blueMid} />
        <Text style={s.roleText}>{roleText}</Text>
      </View>
      {session?.departamento ? (
        <View style={s.deptBadge} accessible accessibilityLabel={`Departamento: ${session.departamento}`}>
          <Icon name="home" size={12} color={C.blue} />
          <Text style={s.deptText}>{session.departamento}</Text>
        </View>
      ) : isStaff ? (
        <Text style={s.noDept}>
          Sin departamento asignado. Pide a un administrador que adscriba tu cuenta.
        </Text>
      ) : null}
      {session?.demo ? <Text style={s.demo}>Sesión de demostración: sin autenticación real</Text> : null}

      <View style={s.links}>
        {links.map((l, i) => (
          <Pressable
            key={l.label}
            accessibilityRole="button"
            accessibilityLabel={`${l.label}. ${l.sub}`}
            onPress={l.action}
            style={({ pressed }) => [s.link, i < links.length - 1 && s.linkBorder, pressed && { backgroundColor: C.blueSoft }]}>
            <View style={s.linkIcon}>
              <Icon name={l.icon} size={18} color={C.blue} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.linkLabel}>{l.label}</Text>
              <Text numberOfLines={1} style={s.linkSub}>{l.sub}</Text>
            </View>
            <Icon name="chevronRight" size={16} color={C.text3} strokeWidth={2.5} />
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityHint="Te pedirá confirmación antes de salir"
        onPress={() =>
          confirmAction({
            title: '¿Cerrar sesión?',
            message: 'Tendrás que volver a ingresar tu correo y contraseña.',
            confirmLabel: 'Cerrar sesión',
            destructive: true,
            onConfirm: async () => {
              await signOut();
              router.replace('/login');
            },
          })
        }
        style={s.btn}>
        <Icon name="logout" size={18} color={C.blue} />
        <Text style={s.btnText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 32 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: FONT.displayXBold, fontSize: 22, color: C.navy, marginTop: 14, textAlign: 'center' },
  mail: { fontFamily: FONT.sans, fontSize: 15, color: C.text2, marginTop: 2, textAlign: 'center' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.blueSoft, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, marginTop: 8 },
  roleText: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.blue },
  deptBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.blueChip, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, marginTop: 6 },
  deptText: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.blueChipText },
  noDept: { fontFamily: FONT.sans, fontSize: 13, color: C.text2, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  demo: { fontFamily: FONT.sansSemi, fontSize: 13, textAlign: 'center', color: C.blue, marginTop: 10, backgroundColor: C.blueIcon, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  links: { alignSelf: 'stretch', marginTop: 22, backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...cardShadow },
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: TOUCH + 16 },
  linkBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
  linkIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  linkSub: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text3, marginTop: 2 },
  btn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', minHeight: 48, alignSelf: 'stretch', borderRadius: 10, borderWidth: 1.5, borderColor: C.blue, marginTop: 24, backgroundColor: '#fff' },
  btnText: { fontFamily: FONT.sansBold, fontSize: 15, color: C.blue },
});
