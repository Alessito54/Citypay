import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { confirmAction, notify } from '@/components/confirm';
import { Icon } from '@/components/icon';
import { cardShadow, PrimaryButton } from '@/components/ui';
import { C, FONT } from '@/constants/colors';
import { type UserItem, usersService } from '@/services/users-service';

const ROLES: { id: UserItem['role']; label: string; desc: string }[] = [
  { id: 'citizen', label: 'Ciudadano', desc: 'Acceso a trámites, reportes personales y pagos propios' },
  { id: 'municipal_official', label: 'Funcionario Municipal', desc: 'Atención y resolución de reportes ciudadanos' },
  { id: 'municipal_supervisor', label: 'Supervisor Municipal', desc: 'Supervisión y asignación de reportes' },
  { id: 'admin', label: 'Administrador General', desc: 'Control total de cuentas, finanzas y conciliación' },
];

export function UserModal({
  user,
  visible,
  onClose,
  onUpdated,
}: {
  user: UserItem | null;
  visible: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  // The parent keys this component by user id, so each account opens with a
  // fresh form instead of showing the previously selected user's values.
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [role, setRole] = useState<UserItem['role']>(user?.role || 'citizen');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await usersService.updateUser(user.id, {
        displayName: name,
        phone,
        role,
      });
      onUpdated();
      onClose();
    } catch (e: any) {
      setError(e.message || 'No se pudo actualizar el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (user.role === 'admin') {
      notify('Acción no permitida', 'No puedes eliminar una cuenta de administrador.');
      return;
    }

    confirmAction({
      title: 'Eliminar usuario',
      message: `¿Estás seguro de que deseas eliminar la cuenta de ${user.displayName || user.email}?`,
      confirmLabel: 'Eliminar',
      destructive: true,
      onConfirm: async () => {
        try {
          await usersService.deleteUser(user.id);
          onUpdated();
          onClose();
        } catch (e: any) {
          notify('Error', e.message || 'No se pudo eliminar el usuario.');
        }
      },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.header}>
            <View>
              <Text style={s.title}>Editar Cuenta de Usuario</Text>
              <Text style={s.email}>{user.email}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={s.closeBtn}>
              <Icon name="x" size={20} color={C.text2} />
            </Pressable>
          </View>

          {/* Activity counters */}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statNum}>{user.paymentsCount ?? 0}</Text>
              <Text style={s.statLabel}>Pagos realizados</Text>
            </View>
            <View style={[s.statBox, { borderLeftWidth: 1, borderLeftColor: C.border }]}>
              <Text style={s.statNum}>{user.reportsCount ?? 0}</Text>
              <Text style={s.statLabel}>Reportes creados</Text>
            </View>
          </View>

          <View style={s.form}>
            <Text style={s.label}>Nombre completo</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nombre del usuario"
              placeholderTextColor={C.text3}
              style={s.input}
            />

            <Text style={s.label}>Teléfono de contacto</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Ej. 555-123-4567"
              placeholderTextColor={C.text3}
              keyboardType="phone-pad"
              style={s.input}
            />

            <Text style={s.label}>Rol y permisos del sistema</Text>
            <View style={s.roles}>
              {ROLES.map((r) => {
                const selected = role === r.id;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => setRole(r.id)}
                    style={[s.roleCard, selected && s.roleCardSelected]}>
                    <View style={s.roleTop}>
                      <Text style={[s.roleLabel, selected && { color: C.blue }]}>{r.label}</Text>
                      {selected ? <Icon name="check" size={14} color={C.blue} /> : null}
                    </View>
                    <Text style={s.roleDesc}>{r.desc}</Text>
                  </Pressable>
                );
              })}
            </View>

            {error ? <Text style={s.err}>{error}</Text> : null}

            <View style={{ gap: 8, marginTop: 14 }}>
              <PrimaryButton
                label={saving ? 'GUARDANDO…' : 'GUARDAR CAMBIOS'}
                disabled={saving}
                onPress={save}
              />
              {user.role !== 'admin' ? (
                <Pressable onPress={remove} style={s.deleteBtn}>
                  <Text style={s.deleteText}>Eliminar cuenta</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11,23,49,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  sheet: { width: '100%', maxWidth: 480, backgroundColor: '#fff', borderRadius: 18, padding: 20, ...cardShadow },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontFamily: FONT.displayBold, fontSize: 18, color: C.navy },
  email: { fontFamily: FONT.sans, fontSize: 12, color: C.text3, marginTop: 2 },
  closeBtn: { padding: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: C.blueSoft, borderRadius: 10, marginTop: 14, overflow: 'hidden' },
  statBox: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  statNum: { fontFamily: FONT.displayXBold, fontSize: 18, color: C.navy },
  statLabel: { fontFamily: FONT.sans, fontSize: 10.5, color: C.text2, marginTop: 1 },
  form: { marginTop: 14, gap: 8 },
  label: { fontFamily: FONT.sansSemi, fontSize: 11, color: C.text2, marginTop: 4 },
  input: { height: 42, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, fontFamily: FONT.sans, fontSize: 13, color: C.text1 },
  roles: { gap: 6, marginTop: 2 },
  roleCard: { padding: 10, borderWidth: 1, borderColor: C.border, borderRadius: 8, backgroundColor: '#FAFCFF' },
  roleCardSelected: { borderColor: C.blue, backgroundColor: C.blueSoft },
  roleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roleLabel: { fontFamily: FONT.sansBold, fontSize: 12, color: C.text1 },
  roleDesc: { fontFamily: FONT.sans, fontSize: 10, color: C.text3, marginTop: 2 },
  err: { fontFamily: FONT.sansSemi, fontSize: 11.5, color: C.danger, marginTop: 4 },
  deleteBtn: { height: 38, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.danger },
});
