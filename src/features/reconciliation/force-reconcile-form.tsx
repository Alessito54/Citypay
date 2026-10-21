import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, FONT } from '@/constants/colors';

import { useReconciliation } from './reconciliation-context';

const OTHER = 'Otro motivo (especificar)';
const REASONS = [
  'Confirmación bancaria recibida por correo',
  'Error tipográfico en referencia del ciudadano',
  'Cargo por comisión bancaria pendiente',
  'Instrucción de tesorería municipal',
  OTHER,
];

export function ForceReconcileForm() {
  const { cancelForce, confirmForce } = useReconciliation();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsNotes = reason === OTHER;
  const notesLen = notes.trim().length;
  const notesOk = !needsNotes || notesLen > 10;
  const canConfirm = reason !== '' && checked && notesOk && !busy;

  const submit = async () => {
    if (!canConfirm) return;
    setBusy(true);
    setError(null);
    try {
      await confirmForce(reason, notes.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la acción.');
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ maxHeight: '92%' }}>
      <View style={s.sheet} accessibilityViewIsModal>
        <View style={s.handle} />
        <View style={s.banner}>
          <View style={s.bannerIcon}>
            <Text style={{ fontSize: 18 }}>⚠️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>Confirmar conciliación forzada</Text>
            <Text style={s.bannerSub}>Esta acción es permanente y quedará en el registro de auditoría.</Text>
          </View>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18 }}>
          <Text style={s.q}>
            Motivo de conciliación manual <Text style={{ color: C.blueMid }}>*</Text>
          </Text>
          <View style={s.list}>
            {REASONS.map((r, i) => {
              const on = reason === r;
              return (
                <Pressable
                  key={r}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => setReason(r)}
                  style={[s.reason, i < REASONS.length - 1 && s.reasonDivider, on && { backgroundColor: '#F0F5FF' }]}>
                  <View style={[s.radio, on ? { borderWidth: 6, borderColor: C.blue } : { borderWidth: 2, borderColor: '#CBD5E1' }]} />
                  <Text style={[s.reasonText, on && { color: C.blue, fontFamily: FONT.sansSemi }]}>{r}</Text>
                </Pressable>
              );
            })}
          </View>

          {reason !== '' ? (
            <View style={{ marginBottom: 14 }}>
              <Text style={s.notesLabel}>
                Notas adicionales {needsNotes ? <Text style={{ color: C.blueMid }}>*</Text> : null}
              </Text>
              <TextInput
                multiline
                value={notes}
                onChangeText={setNotes}
                placeholder="Describa la situación para el historial de auditoría…"
                placeholderTextColor={C.text3}
                style={s.notes}
                textAlignVertical="top"
              />
              {needsNotes && notesLen > 0 && notesLen <= 10 ? (
                <Text style={s.hint}>Mínimo 11 caracteres requeridos.</Text>
              ) : null}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => setChecked((p) => !p)}
            style={s.check}>
            <View style={[s.box, checked ? { backgroundColor: C.blue } : { borderWidth: 2, borderColor: '#CBD5E1' }]}>
              {checked ? <Text style={s.tick}>✓</Text> : null}
            </View>
            <Text style={s.checkText}>
              Confirmo que revisé la documentación de respaldo y asumo responsabilidad por esta operación.
            </Text>
          </Pressable>
          {error ? <Text style={[s.hint, { marginTop: 10, color: C.danger }]}>{error}</Text> : null}
        </ScrollView>

        <View style={[s.actions, { paddingBottom: 24 + insets.bottom }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canConfirm }}
            onPress={submit}
            style={[s.confirm, { backgroundColor: canConfirm ? C.blue : C.blueIcon }]}>
            <Text style={s.confirmText}>{busy ? 'Procesando…' : 'Confirmar Conciliación Forzada'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={cancelForce} style={s.cancel}>
            <Text style={s.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight: '100%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.sheetHandle, marginTop: 14 },
  banner: { marginHorizontal: 18, marginTop: 12, backgroundColor: C.blueSoft, borderRadius: 14, padding: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: C.blueIcon, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  bannerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontFamily: FONT.displayXBold, fontSize: 15, color: C.blue },
  bannerSub: { fontFamily: FONT.sans, fontSize: 12, color: C.blueMid, marginTop: 4, lineHeight: 17 },
  q: { fontFamily: FONT.sansBold, fontSize: 13.5, color: '#1a1a2e', marginBottom: 10 },
  list: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F2F5', marginBottom: 14 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  reasonDivider: { borderBottomWidth: 1, borderBottomColor: C.screen },
  radio: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  reasonText: { flex: 1, fontFamily: FONT.sans, fontSize: 13, color: '#374151' },
  notesLabel: { fontFamily: FONT.sansSemi, fontSize: 13, color: '#1a1a2e', marginBottom: 8 },
  notes: { minHeight: 80, padding: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: C.sheetHandle, backgroundColor: '#F8FAFF', fontFamily: FONT.sans, fontSize: 13, color: '#1a1a2e', lineHeight: 19 },
  hint: { fontFamily: FONT.sans, fontSize: 11, color: C.blueMid, marginTop: 4 },
  check: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 13, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#E3EAFC' },
  box: { width: 22, height: 22, borderRadius: 6, marginTop: 1, alignItems: 'center', justifyContent: 'center' },
  tick: { color: '#fff', fontSize: 13, fontFamily: FONT.sansBold },
  checkText: { flex: 1, fontFamily: FONT.sans, fontSize: 12.5, color: '#374151', lineHeight: 19 },
  actions: { paddingHorizontal: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.screen, gap: 10, backgroundColor: '#fff' },
  confirm: { paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  confirmText: { fontFamily: FONT.sansBold, fontSize: 15, color: '#fff' },
  cancel: { paddingVertical: 15, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.sheetHandle, backgroundColor: '#fff' },
  cancelText: { fontFamily: FONT.sansSemi, fontSize: 15, color: '#374151' },
});
