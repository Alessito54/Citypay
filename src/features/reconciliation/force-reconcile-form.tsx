import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Button, FieldMessage, InputFrame, SheetHeader, SheetPanel } from '@/components/ui';
import { ACCENT_BAR, FONT, RADIUS } from '@/constants/colors';
import { usePhotoAttachments } from '@/features/reports/new-report/use-photo-attachments';
import { useTheme } from '@/features/theme/theme-context';

import { fmtMoney } from './format';
import {
  MIN_BANK_REF,
  MIN_FOLIO_DOC,
  MIN_NOTES,
  REASONS,
  reconcileCheck,
} from './reconcile-rules';
import { useReconciliation } from './reconciliation-context';

export function ForceReconcileForm() {
  const { selected, cancelForce, confirmForce } = useReconciliation();
  const { dark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const initialRef =
    selected?.referenciaBancaria && selected.referenciaBancaria !== '—'
      ? selected.referenciaBancaria
      : '';
  const initialAmount =
    selected && selected.montoBanco > 0
      ? String(selected.montoBanco)
      : selected
        ? String(selected.montoSistema)
        : '';

  const [bankReference, setBankReference] = useState(initialRef);
  const [verifiedAmountText, setVerifiedAmountText] = useState(initialAmount);
  const [evidenceFolio, setEvidenceFolio] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [checkStatement, setCheckStatement] = useState(false);
  const [checkContributor, setCheckContributor] = useState(false);
  const [checkResponsibility, setCheckResponsibility] = useState(false);
  const [folioConfirmDigits, setFolioConfirmDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { photos, photoError, add: addPhoto, remove: removePhoto } = usePhotoAttachments();
  const receiptPhoto = photos[0] ?? null;

  const check = reconcileCheck({
    folio: selected?.folio ?? '',
    systemAmount: selected?.montoSistema ?? 0,
    bankReference,
    verifiedAmountText,
    evidenceFolio,
    reason,
    notes,
    checkStatement,
    checkContributor,
    checkResponsibility,
    folioConfirmDigits,
  });

  const notesLen = notes.trim().length;

  const submit = async () => {
    if (!check.ok || busy || !selected) return;
    setBusy(true);
    setError(null);
    try {
      await confirmForce({
        reason,
        bankReference: bankReference.trim().toUpperCase(),
        verifiedBankAmount: check.parsedAmount,
        evidenceFolio: evidenceFolio.trim().toUpperCase(),
        notes: notes.trim(),
        receiptPhoto,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar el dictamen de conciliación.');
      setBusy(false);
    }
  };

  if (!selected) return null;

  const fieldInputStyle = {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    fontFamily: FONT.sans,
    fontSize: 15.5,
    color: colors.text1,
    paddingVertical: 0,
    paddingRight: 12,
  } as const;

  const hasVariance = Math.abs(check.variance) > 0.009;
  const warnBg = dark ? '#3B2809' : '#FEF3C7';
  const warnBorder = dark ? '#F59E0B' : '#D97706';
  const warnIconColor = dark ? '#FBBF24' : '#92400E';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ maxHeight: '95%' }}>
      <SheetPanel maxHeight="100%">
        <SheetHeader
          title="Dictamen de conciliación bancaria"
          back
          onClose={cancelForce}
          closeLabel="Volver al detalle del pago"
        />
        <View
          style={[s.banner, { backgroundColor: colors.dangerSoft, borderLeftColor: colors.danger }]}
          accessible>
          <Icon name="warn" size={20} color={colors.danger} strokeWidth={2.2} />
          <View style={{ flex: 1 }}>
            <Text style={[s.bannerTitle, { color: colors.text1 }]}>
              {selected.folio} · Sistema: {fmtMoney(selected.montoSistema)}
            </Text>
            <Text style={[s.bannerSub, { color: dark ? colors.danger : '#7F1D1D' }]}>
              Protocolo obligatorio de auditoría: verifica estado de cuenta, póliza y firma con código de seguridad.
            </Text>
          </View>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}>
          {/* PASO 1 */}
          <View style={s.stepBox}>
            <Text style={[s.stepHeader, { color: colors.blue }]}>Paso 1 · Cotejo contra estado de cuenta bancario</Text>

            <View style={s.fieldWrap}>
              <Text style={[s.fieldLabel, { color: colors.text1 }]}>
                Clave de rastreo SPEI / Referencia bancaria verificada <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <InputFrame icon="card" error={bankReference.length > 0 && !check.refOk}>
                <TextInput
                  value={bankReference}
                  onChangeText={setBankReference}
                  autoCapitalize="characters"
                  placeholder={`Ej. SPEI-0094821 (mín. ${MIN_BANK_REF} caracteres)`}
                  placeholderTextColor={colors.text3}
                  accessibilityLabel="Clave de rastreo o referencia bancaria verificada"
                  style={fieldInputStyle}
                />
              </InputFrame>
            </View>

            <View style={s.rowPair}>
              <View style={[s.fieldWrap, { flex: 1 }]}>
                <Text style={[s.fieldLabel, { color: colors.text1 }]}>
                  Importe real en banco (MXN) <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <InputFrame icon="money" error={verifiedAmountText.length > 0 && !check.amountOk}>
                  <TextInput
                    value={verifiedAmountText}
                    onChangeText={setVerifiedAmountText}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.text3}
                    accessibilityLabel="Importe real verificado en banco"
                    style={fieldInputStyle}
                  />
                </InputFrame>
              </View>

              <View style={[s.fieldWrap, { flex: 1 }]}>
                <Text style={[s.fieldLabel, { color: colors.text1 }]}>
                  Folio de póliza / corte <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <InputFrame icon="doc" error={evidenceFolio.length > 0 && !check.docOk}>
                  <TextInput
                    value={evidenceFolio}
                    onChangeText={setEvidenceFolio}
                    autoCapitalize="characters"
                    placeholder={`Ej. POL-0142 (mín. ${MIN_FOLIO_DOC})`}
                    placeholderTextColor={colors.text3}
                    accessibilityLabel="Folio de póliza o estado de cuenta"
                    style={fieldInputStyle}
                  />
                </InputFrame>
              </View>
            </View>

            {check.amountOk ? (
              <View
                style={[
                  s.varianceBar,
                  {
                    backgroundColor: hasVariance ? warnBg : colors.successSoft,
                    borderLeftColor: hasVariance ? warnBorder : colors.success,
                  },
                ]}>
                <Icon
                  name={hasVariance ? 'warn' : 'check'}
                  size={15}
                  color={hasVariance ? warnIconColor : colors.success}
                  strokeWidth={2.5}
                />
                <Text style={[s.varianceText, { color: colors.text1 }]}>
                  {hasVariance
                    ? `Ajuste detectado respecto al sistema: ${check.variance > 0 ? '+' : ''}${fmtMoney(check.variance)} (debe justificarse abajo)`
                    : 'El importe verificado en banco coincide exactamente con el monto del sistema.'}
                </Text>
              </View>
            ) : null}

            <View style={s.fieldWrap}>
              <Text style={[s.fieldLabel, { color: colors.text1 }]}>
                Evidencia documental (ficha o captura bancaria · opcional)
              </Text>
              {receiptPhoto ? (
                <View style={[s.receiptRow, { backgroundColor: colors.screen, borderColor: colors.border }]}>
                  <Image
                    source={{ uri: receiptPhoto.uri }}
                    style={[s.receiptThumb, { backgroundColor: colors.blueIcon }]}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.receiptLabel, { color: colors.text1 }]}>Comprobante adjunto listo para respaldo</Text>
                    <Pressable accessibilityRole="button" onPress={() => removePhoto(receiptPhoto.uri)}>
                      <Text style={[s.removeLink, { color: colors.danger }]}>Quitar imagen</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => addPhoto('camera')}
                    style={[s.attachBtn, { borderColor: colors.blueMid, backgroundColor: colors.blueSoft }]}>
                    <Icon name="camera" size={16} color={colors.blue} />
                    <Text style={[s.attachText, { color: colors.blue }]}>Fotografiar ficha</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => addPhoto('library')}
                    style={[s.attachBtn, { borderColor: colors.blueMid, backgroundColor: colors.blueSoft }]}>
                    <Icon name="image" size={16} color={colors.blue} />
                    <Text style={[s.attachText, { color: colors.blue }]}>Adjuntar imagen</Text>
                  </Pressable>
                </View>
              )}
              <FieldMessage text={photoError ?? undefined} />
            </View>
          </View>

          {/* PASO 2 */}
          <View style={s.stepBox}>
            <Text style={[s.stepHeader, { color: colors.blue }]} nativeID="motivoLabel">
              Paso 2 · Clasificación contable y justificación <Text style={{ color: colors.danger }}>*</Text>
            </Text>
            <View
              style={[s.list, { backgroundColor: colors.screen, borderColor: colors.border }]}
              accessibilityRole="radiogroup"
              accessibilityLabelledBy="motivoLabel">
              {REASONS.map((r, i) => {
                const on = reason === r;
                return (
                  <Pressable
                    key={r}
                    accessibilityRole="radio"
                    accessibilityLabel={r}
                    accessibilityState={{ checked: on }}
                    onPress={() => setReason(r)}
                    style={[
                      s.reason,
                      i < REASONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                      on && { backgroundColor: colors.blueSoft, borderLeftColor: colors.blue },
                    ]}>
                    <Text
                      style={[
                        s.reasonText,
                        { color: on ? colors.blue : colors.text1 },
                        on && { fontFamily: FONT.sansSemi },
                      ]}>
                      {r}
                    </Text>
                    {on ? <Icon name="check" size={18} color={colors.blue} strokeWidth={2.6} /> : null}
                  </Pressable>
                );
              })}
            </View>

            <View style={s.fieldWrap}>
              <Text style={[s.fieldLabel, { color: colors.text1 }]}>
                Observaciones detalladas para auditoría (mínimo {MIN_NOTES} caracteres){' '}
                <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <TextInput
                multiline
                value={notes}
                onChangeText={setNotes}
                accessibilityLabel={`Observaciones de auditoría, mínimo ${MIN_NOTES} caracteres`}
                placeholder="Ej.: Se cotejó contra corte SPEI de BBVA del día, confirmando abono en cuenta concentradora municipal…"
                placeholderTextColor={colors.text3}
                style={[
                  s.notes,
                  {
                    backgroundColor: colors.white,
                    borderColor: notesLen > 0 && !check.notesOk ? colors.danger : colors.inputBorder,
                    color: colors.text1,
                  },
                ]}
                textAlignVertical="top"
              />
              <Text style={[s.counter, { color: check.notesOk ? colors.success : colors.text2 }]}>
                {check.notesOk ? '✓ Justificación completa · ' : ''}
                {notesLen}/{MIN_NOTES} caracteres mínimos
              </Text>
            </View>
          </View>

          {/* PASO 3 */}
          <View style={s.stepBox}>
            <Text style={[s.stepHeader, { color: colors.blue }]}>
              Paso 3 · Protocolo de responsabilidad y autorización <Text style={{ color: colors.danger }}>*</Text>
            </Text>

            <AuditCheckbox
              checked={checkStatement}
              onToggle={() => setCheckStatement((v) => !v)}
              label="Cotejé la referencia bancaria y el importe directamente en el estado de cuenta oficial de la institución financiera."
            />
            <AuditCheckbox
              checked={checkContributor}
              onToggle={() => setCheckContributor((v) => !v)}
              label="Verifiqué que el pago corresponde al concepto, periodo y contribuyente registrados en el sistema."
            />
            <AuditCheckbox
              checked={checkResponsibility}
              onToggle={() => setCheckResponsibility((v) => !v)}
              label="Acepto que este dictamen es definitivo y quedará firmado con mi usuario, fecha y hora para revisión de Contraloría."
            />

            <View style={[s.confirmCodeBox, { backgroundColor: colors.screen, borderColor: colors.border }]}>
              <Text style={[s.confirmCodeTitle, { color: colors.navy }]}>
                Confirmación de seguridad: escribe los últimos 4 caracteres del folio ({check.expectedSuffix}){' '}
                <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <InputFrame icon="lock" error={folioConfirmDigits.length > 0 && !check.suffixOk}>
                <TextInput
                  value={folioConfirmDigits}
                  onChangeText={setFolioConfirmDigits}
                  maxLength={6}
                  autoCapitalize="characters"
                  placeholder={`Escribe: ${check.expectedSuffix}`}
                  placeholderTextColor={colors.text3}
                  accessibilityLabel={`Escribe ${check.expectedSuffix} para confirmar el folio`}
                  style={[fieldInputStyle, { fontFamily: FONT.monoMedium, letterSpacing: 2 }]}
                />
              </InputFrame>
            </View>
          </View>

          <FieldMessage text={error ?? undefined} />
        </ScrollView>

        <View
          style={[
            s.actions,
            {
              paddingBottom: 16 + insets.bottom,
              backgroundColor: colors.white,
              borderTopColor: colors.border,
            },
          ]}>
          {check.missing.length > 0 ? (
            <Text style={[s.missing, { color: colors.text2 }]} accessibilityLiveRegion="polite">
              Pendiente ({check.missing.length}): {check.missing[0]}.
            </Text>
          ) : (
            <Text style={[s.missing, { color: colors.success }]}>
              ✓ Protocolo de verificación completo. Listo para emitir dictamen.
            </Text>
          )}
          <Button
            icon="check"
            label={busy ? 'Registrando dictamen…' : 'Emitir dictamen y conciliar pago'}
            disabled={!check.ok && !busy}
            loading={busy}
            onPress={submit}
          />
          <Button variant="quiet" label="Cancelar" onPress={cancelForce} />
        </View>
      </SheetPanel>
    </KeyboardAvoidingView>
  );
}

function AuditCheckbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  const { dark, colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={[
        s.check,
        {
          backgroundColor: checked ? colors.blueSoft : colors.screen,
          borderColor: checked ? colors.blue : colors.border,
        },
      ]}>
      <View
        style={[
          s.box,
          {
            backgroundColor: checked ? colors.blue : colors.white,
            borderColor: checked ? colors.blue : colors.inputBorder,
          },
        ]}>
        {checked ? <Icon name="check" size={14} color={dark ? '#0B1220' : '#FFFFFF'} strokeWidth={3} /> : null}
      </View>
      <Text style={[s.checkText, { color: colors.text1 }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  banner: { marginHorizontal: 18, marginTop: 10, borderRadius: RADIUS, padding: 12, borderLeftWidth: ACCENT_BAR, flexDirection: 'row', gap: 10, alignItems: 'center' },
  bannerTitle: { fontFamily: FONT.sansBold, fontSize: 14 },
  bannerSub: { fontFamily: FONT.sans, fontSize: 12.5, marginTop: 2, lineHeight: 17 },
  scroll: { padding: 18, gap: 18 },
  stepBox: { gap: 10 },
  stepHeader: { fontFamily: FONT.displayBold, fontSize: 15 },
  fieldWrap: { gap: 5 },
  fieldLabel: { fontFamily: FONT.sansSemi, fontSize: 13 },
  rowPair: { flexDirection: 'row', gap: 10 },
  varianceBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderLeftWidth: 3 },
  varianceText: { flex: 1, fontFamily: FONT.sansMedium, fontSize: 12.5, lineHeight: 17 },
  attachBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, borderWidth: 1.5, borderStyle: 'dashed', paddingHorizontal: 10 },
  attachText: { fontFamily: FONT.sansSemi, fontSize: 12.5 },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: RADIUS, borderWidth: 1 },
  receiptThumb: { width: 52, height: 52 },
  receiptLabel: { fontFamily: FONT.sansSemi, fontSize: 13 },
  removeLink: { fontFamily: FONT.sansBold, fontSize: 12.5, marginTop: 4 },
  list: { borderRadius: RADIUS, borderWidth: 1, overflow: 'hidden' },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingVertical: 10, paddingHorizontal: 14, borderLeftWidth: ACCENT_BAR, borderLeftColor: 'transparent' },
  reasonText: { flex: 1, fontFamily: FONT.sans, fontSize: 13.5, lineHeight: 19 },
  notes: { minHeight: 84, padding: 12, borderRadius: RADIUS, borderWidth: 1, fontFamily: FONT.sans, fontSize: 15, lineHeight: 20 },
  counter: { fontFamily: FONT.sansSemi, fontSize: 12 },
  check: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: RADIUS, borderWidth: 1 },
  box: { width: 22, height: 22, borderRadius: RADIUS, marginTop: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  checkText: { flex: 1, fontFamily: FONT.sans, fontSize: 13, lineHeight: 18 },
  confirmCodeBox: { padding: 12, borderWidth: 1, gap: 6 },
  confirmCodeTitle: { fontFamily: FONT.sansBold, fontSize: 13, lineHeight: 18 },
  actions: { paddingHorizontal: 18, paddingTop: 10, borderTopWidth: 1, gap: 8 },
  missing: { fontFamily: FONT.sansSemi, fontSize: 12.5, textAlign: 'center', lineHeight: 17 },
});
