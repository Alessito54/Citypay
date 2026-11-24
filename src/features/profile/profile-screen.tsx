import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Badge, Button } from '@/components/ui';
import { C, FONT, RADIUS } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { roleLabel } from '@/lib/roles';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();

  const confirmSignOut = () =>
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
    ]);

  return (
    <View style={[s.root, { paddingTop: insets.top + 24 }]}>
      <View style={s.avatar} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Icon name="user" size={32} color={C.blue} />
      </View>
      <Text accessibilityRole="header" style={s.name}>
        {session?.displayName || 'Usuario'}
      </Text>
      <Text style={s.mail}>{session?.email}</Text>
      <View style={{ marginTop: 10 }} accessible accessibilityLabel={`Rol: ${roleLabel(session?.role)}`}>
        <Badge label={roleLabel(session?.role)} symbol="✓" bg={C.blueSoft} fg={C.blue} />
      </View>
      <Button
        variant="secondary"
        icon="logout"
        label="Cerrar sesión"
        accessibilityHint="Te pedirá confirmación antes de salir"
        onPress={confirmSignOut}
        style={s.btn}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, alignItems: 'center', paddingHorizontal: 24 },
  avatar: { width: 72, height: 72, borderRadius: RADIUS, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: FONT.displayXBold, fontSize: 22, color: C.navy, marginTop: 14 },
  mail: { fontFamily: FONT.sans, fontSize: 15, color: C.text2, marginTop: 2 },
  btn: { alignSelf: 'stretch', marginTop: 28 },
});
