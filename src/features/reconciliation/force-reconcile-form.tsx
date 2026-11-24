import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Button, FieldMessage, SheetHeader, SheetPanel, surface } from '@/components/ui';
import { ACCENT_BAR, C, FONT, RADIUS } from '@/constants/colors';

import { fmtMoney } from './format';
import { MIN_NOTES, REASONS, reconcileCheck } from './reconcile-rules';
import { useReconciliation } from './reconciliation-context';

export function ForceReconcileForm() {
  const { selected, cancelForce, confirmForce } = useReconciliation();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { needsNotes, notesOk, missing, ok } = reconcileCheck(reason, notes, checked);
  const notesLen = notes.trim().length;

  const submit = async () => {
    if (!ok || busy) return;
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
      <SheetPanel maxHeight="100%">
        <SheetHeader title="Conciliar manualmente" back onClose={cancelForce} closeLabel="Volver al detalle del pago" />
        <View style={s.banner} accessible>
          <Icon name="warn" size={20} color={C.danger} strokeWidth={2.2} />
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>{selected ? `${selected.folio} · ${fmtMoney(selected.montoSistema)}` : 'Conciliación forzada'}</Text>
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
                  style={[s.reason, i < REASONS.length - 1 && s.reasonDivider, on && s.reasonOn]}>
                  <Text style={[s.reasonText, on && { color: C.blue, fontFamily: FONT.sansSemi }]}>{r}</Text>
                  {on ? <Icon name="check" size={18} color={C.blue} strokeWidth={2.6} /> : null}
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
            <View style={[s.box, checked ? { backgroundColor: C.blue, borderColor: C.blue } : null]}>
              {checked ? <Icon name="check" size={14} color="#fff" strokeWidth={3} /> : null}
            </View>
            <Text style={s.checkText}>Confirmo que revisé la documentación de respaldo y asumo responsabilidad por esta operación.</Text>
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
          <Button
            label={busy ? 'Procesando…' : 'Confirmar conciliación'}
            accessibilityHint={missing.length ? `Falta: ${missing.join(', ')}` : undefined}
            disabled={!ok && !busy}
            loading={busy}
            onPress={submit}
          />
          <Button variant="quiet" label="Cancelar" onPress={cancelForce} />
        </View>
      </SheetPanel>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  banner: { marginHorizontal: 18, marginTop: 12, backgroundColor: C.dangerSoft, borderRadius: RADIUS, padding: 12, borderLeftWidth: ACCENT_BAR, borderLeftColor: C.danger, flexDirection: 'row', gap: 12, alignItems: 'center' },
  bannerTitle: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  bannerSub: { fontFamily: FONT.sans, fontSize: 13, color: '#7F1D1D', marginTop: 3, lineHeight: 18 },
  q: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1, marginBottom: 10 },
  list: { ...surface, overflow: 'hidden', marginBottom: 16 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 12, paddingHorizontal: 14, borderLeftWidth: ACCENT_BAR, borderLeftColor: 'transparent' },
  reasonOn: { backgroundColor: C.blueSoft, borderLeftColor: C.blue },
  reasonDivider: { borderBottomWidth: 1, borderBottomColor: C.divider },
  reasonText: { flex: 1, fontFamily: FONT.sans, fontSize: 14.5, color: C.text1, lineHeight: 20 },
  notes: { minHeight: 90, padding: 12, paddingHorizontal: 14, borderRadius: RADIUS, borderWidth: 1, borderColor: C.inputBorder, backgroundColor: '#fff', fontFamily: FONT.sans, fontSize: 16, color: C.text1, lineHeight: 21 },
  counter: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text2, marginTop: 6 },
  check: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: RADIUS, backgroundColor: C.blueSoft, borderWidth: 1.5, borderColor: C.border },
  box: { width: 24, height: 24, borderRadius: RADIUS, marginTop: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: C.inputBorder },
  checkText: { flex: 1, fontFamily: FONT.sans, fontSize: 14, color: C.text1, lineHeight: 20 },
  actions: { paddingHorizontal: 18, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, gap: 10, backgroundColor: '#fff' },
  missing: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.text2, textAlign: 'center', lineHeight: 18 },
});
