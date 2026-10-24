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

import { Icon } from '@/components/icon';
import { FieldMessage, PrimaryButton } from '@/components/ui';
import { C, FONT } from '@/constants/colors';

import { fmtMoney } from './format';
import { useReconciliation } from './reconciliation-context';

const OTHER = 'Otro motivo (especificar)';
const REASONS = [
  'Confirmación bancaria recibida por correo',
  'Error tipográfico en referencia del ciudadano',
  'Cargo por comisión bancaria pendiente',
  'Instrucción de tesorería municipal',
  OTHER,
];
const MIN_NOTES = 11;

export function ForceReconcileForm() {
  const { selected, cancelForce, confirmForce } = useReconciliation();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsNotes = reason === OTHER;
  const notesLen = notes.trim().length;
  const notesOk = !needsNotes || notesLen >= MIN_NOTES;
  const canConfirm = reason !== '' && checked && notesOk && !busy;

  // Tell the user exactly what is still missing instead of a silently disabled button.
  const missing = [
    reason === '' && 'elige un motivo',
    needsNotes && !notesOk && `escribe al menos ${MIN_NOTES} caracteres en las notas`,
    !checked && 'marca la casilla de confirmación',
  ].filter(Boolean) as string[];

  const submit = async () => {
    if (!canConfirm) return;
    setBusy(true);
    setError(null);
    try {
      await confirmForce(reason, notes.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la acción. Inténtalo de nuevo.');
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ maxHeight: '92%' }}>
      <View style={s.sheet} accessibilityViewIsModal>
        <View style={s.handle} />
        <View style={s.top}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver al detalle del pago" onPress={cancelForce} style={s.back}>
            <Icon name="chevronLeft" size={22} color={C.text1} />
          </Pressable>
          <Text accessibilityRole="header" style={s.topTitle}>
            Conciliar manualmente
          </Text>
        </View>
        <View style={s.banner} accessible>
          <View style={s.bannerIcon}>
            <Icon name="warn" size={20} color={C.danger} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>
              {selected ? `${selected.folio} · ${fmtMoney(selected.montoSistema)}` : 'Conciliación forzada'}
            </Text>
            <Text style={s.bannerSub}>Esta acción es permanente y quedará en el registro de auditoría.</Text>
          </View>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18 }}>
          <Text style={s.q} nativeID="motivoLabel">
            1. Motivo de la conciliación <Text style={{ color: C.danger }}>(obligatorio)</Text>
          </Text>
          <View style={s.list} accessibilityRole="radiogroup" accessibilityLabelledBy="motivoLabel">
            {REASONS.map((r, i) => {
              const on = reason === r;
              return (
                <Pressable
                  key={r}
                  accessibilityRole="radio"
                  accessibilityLabel={r}
                  accessibilityState={{ checked: on }}
                  onPress={() => setReason(r)}
                  style={[s.reason, i < REASONS.length - 1 && s.reasonDivider, on && { backgroundColor: C.blueSoft }]}>
                  <View style={[s.radio, on ? { borderWidth: 6, borderColor: C.blue } : { borderWidth: 2, borderColor: C.inputBorder }]} />
                  <Text style={[s.reasonText, on && { color: C.blue, fontFamily: FONT.sansSemi }]}>{r}</Text>
                </Pressable>
              );
            })}
          </View>

          {reason !== '' ? (
            <View style={{ marginBottom: 16 }}>
              <Text style={s.q}>
                2. Notas {needsNotes ? <Text style={{ color: C.danger }}>(obligatorio)</Text> : <Text style={{ color: C.text2 }}>(opcional)</Text>}
              </Text>
              <TextInput
                multiline
                value={notes}
                onChangeText={setNotes}
                accessibilityLabel={needsNotes ? `Notas, obligatorio, mínimo ${MIN_NOTES} caracteres` : 'Notas, opcional'}
                placeholder="Describe la situación para el historial de auditoría…"
                placeholderTextColor={C.text3}
                style={[s.notes, needsNotes && notesLen > 0 && !notesOk && { borderColor: C.danger }]}
                textAlignVertical="top"
              />
              {needsNotes ? (
                <Text style={[s.counter, notesOk && { color: C.success }]}>
                  {notesOk ? '✓ ' : ''}
                  {Math.min(notesLen, MIN_NOTES)}/{MIN_NOTES} caracteres mínimos
                </Text>
              ) : null}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => setChecked((p) => !p)}
            style={[s.check, checked && { borderColor: C.blue }]}>
            <View style={[s.box, checked ? { backgroundColor: C.blue } : { borderWidth: 2, borderColor: C.inputBorder }]}>
              {checked ? <Icon name="check" size={14} color="#fff" strokeWidth={3} /> : null}
            </View>
            <Text style={s.checkText}>
              Confirmo que revisé la documentación de respaldo y asumo responsabilidad por esta operación.
            </Text>
          </Pressable>
          <View style={{ marginTop: 10 }}>
            <FieldMessage text={error} />
          </View>
        </ScrollView>

        <View style={[s.actions, { paddingBottom: 16 + insets.bottom }]}>
          {missing.length > 0 ? (
            <Text style={s.missing} accessibilityLiveRegion="polite">
              Para continuar: {missing.join(', ')}.
            </Text>
          ) : null}
          <PrimaryButton
            label={busy ? 'Procesando…' : 'Confirmar conciliación'}
            accessibilityHint={missing.length ? `Falta: ${missing.join(', ')}` : undefined}
            disabled={!canConfirm && !busy}
            loading={busy}
            onPress={submit}
            style={{ shadowOpacity: 0, elevation: 0 }}
          />
          <Pressable accessibilityRole="button" onPress={cancelForce} style={({ pressed }) => [s.cancel, pressed && { backgroundColor: C.screen }]}>
            <Text style={s.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight: '100%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.sheetHandle, marginTop: 12 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingTop: 2 },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: FONT.displayXBold, fontSize: 18, color: C.text1 },
  banner: { marginHorizontal: 18, marginTop: 4, backgroundColor: C.dangerSoft, borderRadius: 14, padding: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#FECACA', flexDirection: 'row', gap: 12, alignItems: 'center' },
  bannerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  bannerSub: { fontFamily: FONT.sans, fontSize: 13, color: '#7F1D1D', marginTop: 3, lineHeight: 18 },
  q: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1, marginBottom: 10 },
  list: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 12, paddingHorizontal: 14 },
  reasonDivider: { borderBottomWidth: 1, borderBottomColor: C.divider },
  radio: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  reasonText: { flex: 1, fontFamily: FONT.sans, fontSize: 14.5, color: C.text1, lineHeight: 20 },
  notes: { minHeight: 90, padding: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: C.inputBorder, backgroundColor: '#fff', fontFamily: FONT.sans, fontSize: 15, color: C.text1, lineHeight: 21 },
  counter: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text2, marginTop: 6 },
  check: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 14, backgroundColor: C.blueSoft, borderWidth: 1.5, borderColor: C.border },
  box: { width: 24, height: 24, borderRadius: 6, marginTop: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkText: { flex: 1, fontFamily: FONT.sans, fontSize: 14, color: C.text1, lineHeight: 20 },
  actions: { paddingHorizontal: 18, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.screen, gap: 10, backgroundColor: '#fff' },
  missing: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.text2, textAlign: 'center', lineHeight: 18 },
  cancel: { minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.inputBorder, backgroundColor: '#fff' },
  cancelText: { fontFamily: FONT.sansSemi, fontSize: 15, color: C.text1 },
});
