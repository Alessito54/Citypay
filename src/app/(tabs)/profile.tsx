import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { C, FONT } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();

  const roleLabels: Record<string, string> = {
    admin: 'Administrador General',
    municipal_official: 'Funcionario Municipal',
    municipal_supervisor: 'Supervisor Municipal',
    citizen: 'Ciudadano',
  };

  const roleText = session?.role ? roleLabels[session.role] || session.role : 'Ciudadano';

  return (
    <View style={[s.root, { paddingTop: insets.top + 24 }]}>
      <View style={s.avatar} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Icon name="user" size={32} color={C.blue} />
      </View>
      <Text accessibilityRole="header" style={s.name}>{session?.displayName || 'Usuario'}</Text>
      <Text style={s.mail}>{session?.email}</Text>
      <View style={s.roleBadge} accessible accessibilityLabel={`Rol: ${roleText}`}>
        <Icon name="check" size={12} color={C.blueMid} />
        <Text style={s.roleText}>{roleText}</Text>
      </View>
      {session?.demo ? <Text style={s.demo}>Sesión de demostración: sin autenticación real</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Te pedirá confirmación antes de salir"
        onPress={() =>
          Alert.alert('¿Cerrar sesión?', 'Tendrás que volver a ingresar tu correo y contraseña.', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Cerrar sesión',
              style: 'destructive',
              onPress: async () => {
                await signOut();
                router.replace('/login');
              },
            },
          ])
        }
        style={s.btn}>
        <Icon name="logout" size={18} color={C.blue} />
        <Text style={s.btnText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, alignItems: 'center', paddingHorizontal: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: FONT.displayXBold, fontSize: 22, color: C.navy, marginTop: 14 },
  mail: { fontFamily: FONT.sans, fontSize: 15, color: C.text2, marginTop: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.blueSoft, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, marginTop: 8 },
  roleText: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.blue },
  demo: { fontFamily: FONT.sansSemi, fontSize: 13, textAlign: 'center', color: C.blue, marginTop: 10, backgroundColor: C.blueIcon, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  btn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', minHeight: 48, alignSelf: 'stretch', borderRadius: 10, borderWidth: 1.5, borderColor: C.blue, marginTop: 28, backgroundColor: '#fff' },
  btnText: { fontFamily: FONT.sansBold, fontSize: 15, color: C.blue },
});
