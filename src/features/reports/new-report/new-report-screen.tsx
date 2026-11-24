import { useRef, useState } from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, FieldMessage, SelectField, SheetHeader, inputError } from '@/components/ui';
import { C, FONT, RADIUS } from '@/constants/colors';
import type { ReportPrioridad } from '@/types';

import { useReports } from '../reports-context';
import { FormGroup } from './form-group';
import { LocationSection } from './location-section';
import { PhotoSection } from './photo-section';
import { PriorityPicker } from './priority-picker';
import { MAX_DESC, MAX_PHOTOS, MIN_DESC, PROBLEMAS, validateReport, type FormErrors } from './report-form';
import { useLocationPicker } from './use-location-picker';
import { usePhotoAttachments } from './use-photo-attachments';

type SendState = 'idle' | 'sending' | 'sent';

/** Composes the form sections; state lives in the hooks and rules in report-form.ts. */
export function NewReportScreen({ onBack, onSent }: { onBack: () => void; onSent: () => void }) {
  const insets = useSafeAreaInsets();
  const { submitReport } = useReports();
  const [cat, setCat] = useState('Alumbrado público');
  const [prob, setProb] = useState(PROBLEMAS['Alumbrado público'][0]);
  const [pri, setPri] = useState<ReportPrioridad>('Media');
  const [desc, setDesc] = useState('');
  const [state, setState] = useState<SendState>('idle');
  const [errors, setErrors] = useState<FormErrors>({});
  const [mapTouch, setMapTouch] = useState(false);
  const clearAddrError = () => setErrors((e) => ({ ...e, addr: undefined }));
  const loc = useLocationPicker(clearAddrError);
  const { photos, add, remove } = usePhotoAttachments();

  const scrollRef = useRef<ScrollView>(null);
  const addrRef = useRef<TextInput>(null);
  const descRef = useRef<TextInput>(null);
  const positions = useRef({ addr: 0, desc: 0 });

  const submit = async () => {
    const e = validateReport(loc.addr, desc);
    setErrors(e);
    if (e.addr || e.desc) {
      // The submit button is far from the fields: bring the first invalid one into view.
      scrollRef.current?.scrollTo({ y: Math.max(0, (e.addr ? positions.current.addr : positions.current.desc) - 12), animated: true });
      (e.addr ? addrRef : descRef).current?.focus();
      AccessibilityInfo.announceForAccessibility(`Falta información. ${e.addr ?? e.desc}`);
      return;
    }
    setState('sending');
    try {
      await submitReport({
        categoria: cat,
        problema: prob,
        prioridad: pri,
        direccion: loc.addr.trim(),
        descripcion: desc.trim(),
        fotos: photos,
        latitude: loc.coords?.latitude,
        longitude: loc.coords?.longitude,
      });
      setState('sent');
      AccessibilityInfo.announceForAccessibility('Reporte enviado. Te llevaremos a la lista de reportes.');
      setTimeout(onSent, 1600);
    } catch (err) {
      setState('idle');
      setErrors({ send: err instanceof Error ? err.message : 'No se pudo enviar el reporte. Inténtalo de nuevo.' });
    }
  };

  const descLen = desc.trim().length;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ paddingTop: insets.top + 4 }}>
        <SheetHeader title="Nuevo reporte" back onClose={onBack} closeLabel="Volver" />
      </View>

      <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" scrollEnabled={!mapTouch} contentContainerStyle={s.body}>
        <Text style={s.sub}>Cuéntanos qué pasa y dónde. Los campos marcados como obligatorios son necesarios para enviarlo.</Text>

        <FormGroup label="¿Qué tipo de problema es?" required>
          <SelectField
            variant="row"
            label="Categoría"
            leftIcon="bulb"
            value={cat}
            options={Object.keys(PROBLEMAS)}
            onChange={(v) => {
              setCat(v);
              setProb(PROBLEMAS[v][0]);
            }}
          />
          <SelectField variant="row" label="Problema" leftIcon="warn" value={prob} options={PROBLEMAS[cat]} onChange={setProb} />
        </FormGroup>

        <FormGroup label="Prioridad" required>
          <PriorityPicker value={pri} onChange={setPri} />
        </FormGroup>

        <View onLayout={(e) => (positions.current.addr = e.nativeEvent.layout.y)}>
          <FormGroup label="Ubicación" required>
            <LocationSection ref={addrRef} loc={loc} error={errors.addr} onEdit={clearAddrError} onMapTouch={setMapTouch} />
          </FormGroup>
        </View>

        <View onLayout={(e) => (positions.current.desc = e.nativeEvent.layout.y)}>
          <FormGroup label="Descripción" required>
            <TextInput
              ref={descRef}
              value={desc}
              onChangeText={(t) => {
                setDesc(t);
                if (t.trim().length >= MIN_DESC) setErrors((e) => ({ ...e, desc: undefined }));
              }}
              accessibilityLabel={`Descripción del problema, obligatorio, mínimo ${MIN_DESC} caracteres`}
              maxLength={MAX_DESC}
              multiline
              placeholder="Ej.: La lámpara no enciende desde hace varios días. Está frente al parque."
              placeholderTextColor={C.text3}
              textAlignVertical="top"
              style={[s.desc, errors.desc ? inputError : null]}
            />
            <View style={s.descMeta}>
              <Text style={[s.meta, descLen >= MIN_DESC && { color: C.success }]}>
                {descLen >= MIN_DESC ? '✓ Suficiente detalle' : `Mínimo ${MIN_DESC} caracteres`}
              </Text>
              <Text style={s.meta} accessibilityLabel={`${desc.length} de ${MAX_DESC} caracteres`}>
                {desc.length}/{MAX_DESC}
              </Text>
            </View>
            <FieldMessage text={errors.desc} />
          </FormGroup>
        </View>

        <FormGroup label={`Fotos de evidencia (${photos.length}/${MAX_PHOTOS})`} optional>
          <PhotoSection photos={photos} onAdd={add} onRemove={remove} />
        </FormGroup>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: 12 + insets.bottom }]}>
        <FieldMessage text={errors.send} />
        <FieldMessage text={state === 'sent' ? 'Reporte enviado. Te llevamos a la lista de reportes…' : null} tone="success" />
        <Button
          icon={state === 'sent' ? 'check' : 'send'}
          label={state === 'sent' ? 'Enviado' : state === 'sending' ? (photos.length ? 'Subiendo fotos y enviando…' : 'Enviando…') : 'Enviar reporte'}
          accessibilityLabel="Enviar reporte"
          onPress={submit}
          disabled={state === 'sent'}
          loading={state === 'sending'}
          style={{ marginTop: 6 }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  body: { padding: 18, gap: 20, paddingBottom: 28 },
  sub: { fontFamily: FONT.sans, fontSize: 14.5, color: C.text2, lineHeight: 20 },
  desc: { minHeight: 110, padding: 12, borderRadius: RADIUS, borderWidth: 1, borderColor: C.inputBorder, fontFamily: FONT.sans, fontSize: 16, lineHeight: 22, color: C.text1, backgroundColor: '#fff' },
  descMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text2 },
  footer: { paddingHorizontal: 18, paddingTop: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border, gap: 4 },
});
