import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
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

import { Icon, type IconName } from '@/components/icon';
import { FieldMessage, PrimaryButton, SelectField } from '@/components/ui';
import { C, FONT, TOUCH } from '@/constants/colors';
import type { NewReportInput } from '@/types';

import { useReports } from './reports-context';

const MAX = 250;
const MIN_DESC = 10;
const MAX_PHOTOS = 4;

const PROBLEMAS: Record<string, string[]> = {
  'Alumbrado público': ['Lámpara apagada', 'Poste dañado', 'Cableado expuesto'],
  Vialidad: ['Bache en la calle', 'Semáforo descompuesto', 'Señalización dañada'],
  Agua: ['Fuga de agua', 'Sin suministro', 'Drenaje tapado'],
  'Limpieza y residuos': ['Contenedor lleno', 'Basura acumulada'],
  'Parques y jardines': ['Juego dañado', 'Árbol caído', 'Pasto sin podar'],
};

/** `id` keeps the value the service expects; `label` matches the wording used in the reports filters ("Baja"). */
const PRIORIDADES: { id: NewReportInput['prioridad']; label: string; hint: string; dot: string }[] = [
  { id: 'Bajo', label: 'Baja', hint: 'Puede esperar', dot: C.blueIcon },
  { id: 'Media', label: 'Media', hint: 'Afecta a vecinos', dot: C.blueMid },
  { id: 'Alta', label: 'Alta', hint: 'Riesgo o urgencia', dot: C.blue },
];

type SendState = 'idle' | 'sending' | 'sent' | 'error';
type Errors = { addr?: string; desc?: string; send?: string };

export function NewReportScreen({ onBack, onSent }: { onBack: () => void; onSent: () => void }) {
  const insets = useSafeAreaInsets();
  const { submitReport } = useReports();
  const [cat, setCat] = useState('Alumbrado público');
  const [prob, setProb] = useState('Lámpara apagada');
  const [pri, setPri] = useState<NewReportInput['prioridad']>('Media');
  const [addr, setAddr] = useState('');
  const [desc, setDesc] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [state, setState] = useState<SendState>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const [locating, setLocating] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const addrRef = useRef<TextInput>(null);
  const descRef = useRef<TextInput>(null);
  const positions = useRef<{ addr: number; desc: number }>({ addr: 0, desc: 0 });

  const addPhoto = async (source: 'camera' | 'library') => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Evidencia', `Puedes adjuntar hasta ${MAX_PHOTOS} imágenes.`);
      return;
    }
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Concede el permiso en los ajustes del dispositivo para adjuntar imágenes.');
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets[0]) {
      setPhotos((p) => [...p, res.assets[0].uri].slice(0, MAX_PHOTOS));
      AccessibilityInfo.announceForAccessibility('Foto agregada');
    }
  };

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Concede acceso a la ubicación para usar esta opción, o escribe la dirección.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      let text = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
      try {
        const [a] = await Location.reverseGeocodeAsync(pos.coords);
        const parts = [a?.street && `${a.street}${a.streetNumber ? ` #${a.streetNumber}` : ''}`, a?.city, a?.region].filter(Boolean);
        if (parts.length) text = parts.join(', ');
      } catch {
        /* keep coordinates */
      }
      setAddr(text);
      setErrors((e) => ({ ...e, addr: undefined }));
      AccessibilityInfo.announceForAccessibility(`Ubicación agregada: ${text}`);
    } catch {
      Alert.alert('Ubicación', 'No se pudo obtener tu ubicación actual. Escribe la dirección manualmente.');
    } finally {
      setLocating(false);
    }
  };

  const submit = async () => {
    const e: Errors = {};
    if (!addr.trim()) e.addr = 'Indica dónde está el problema: escribe la dirección o usa tu ubicación.';
    if (desc.trim().length < MIN_DESC) e.desc = `Describe el problema con al menos ${MIN_DESC} caracteres.`;
    setErrors(e);
    if (e.addr || e.desc) {
      // Bring the first invalid field into view: the submit button is far from the fields.
      const y = e.addr ? positions.current.addr : positions.current.desc;
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
      (e.addr ? addrRef : descRef).current?.focus();
      AccessibilityInfo.announceForAccessibility(`Falta información. ${e.addr ?? e.desc}`);
      return;
    }

    setState('sending');
    try {
      await submitReport({ categoria: cat, problema: prob, prioridad: pri, direccion: addr.trim(), descripcion: desc.trim(), fotos: photos });
      setState('sent');
      AccessibilityInfo.announceForAccessibility('Reporte enviado. Te llevaremos a la lista de reportes.');
      setTimeout(onSent, 1600);
    } catch {
      setState('error');
      setErrors({ send: 'No se pudo enviar el reporte. Revisa tu conexión e inténtalo de nuevo.' });
    }
  };

  const busy = state === 'sending' || state === 'sent';
  const descLen = desc.trim().length;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={[s.header, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onBack} style={s.back}>
          <Icon name="chevronLeft" size={24} color={C.text1} />
        </Pressable>
        <Text accessibilityRole="header" style={s.headerTitle}>
          Nuevo reporte
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
        <Text style={s.sub}>Cuéntanos qué pasa y dónde. Los campos marcados como obligatorios son necesarios para enviarlo.</Text>

        <Group label="¿Qué tipo de problema es?" required>
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
        </Group>

        <Group label="Prioridad" required>
          <View style={s.priRow} accessibilityRole="radiogroup">
            {PRIORIDADES.map((p) => {
              const on = pri === p.id;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="radio"
                  accessibilityLabel={`Prioridad ${p.label}: ${p.hint}`}
                  accessibilityState={{ checked: on }}
                  onPress={() => setPri(p.id)}
                  style={[s.pri, on && s.priOn]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {on ? <Icon name="check" size={14} color={C.blue} strokeWidth={3} /> : <View style={[s.priDot, { backgroundColor: p.dot }]} />}
                    <Text style={[s.priText, on && { color: C.blue }]}>{p.label}</Text>
                  </View>
                  <Text style={s.priHint}>{p.hint}</Text>
                </Pressable>
              );
            })}
          </View>
        </Group>

        <View onLayout={(e) => (positions.current.addr = e.nativeEvent.layout.y)}>
          <Group label="Ubicación" required>
            <View style={[s.addr, errors.addr ? s.inputErr : null]}>
              <Icon name="pin" size={18} color={errors.addr ? C.danger : C.blueMid} />
              <TextInput
                ref={addrRef}
                value={addr}
                onChangeText={(t) => {
                  setAddr(t);
                  if (t.trim()) setErrors((e) => ({ ...e, addr: undefined }));
                }}
                accessibilityLabel="Ubicación del problema, obligatorio"
                placeholder="Calle, número y colonia"
                placeholderTextColor={C.text3}
                returnKeyType="next"
                onSubmitEditing={() => descRef.current?.focus()}
                style={s.addrInput}
              />
              {addr ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Borrar ubicación" onPress={() => setAddr('')} style={s.clear}>
                  <Icon name="xCircle" size={18} color={C.text2} />
                </Pressable>
              ) : null}
            </View>
            <FieldMessage text={errors.addr} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={locating ? 'Obteniendo tu ubicación' : 'Usar mi ubicación actual'}
              accessibilityState={{ busy: locating, disabled: locating }}
              onPress={useMyLocation}
              disabled={locating}
              style={({ pressed }) => [s.locate, pressed && { backgroundColor: C.blueIcon }]}>
              {locating ? <ActivityIndicator size="small" color={C.blue} /> : <Icon name="locate" size={18} color={C.blue} />}
              <Text style={s.locateText}>{locating ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual'}</Text>
            </Pressable>
          </Group>
        </View>

        <View onLayout={(e) => (positions.current.desc = e.nativeEvent.layout.y)}>
          <Group label="Descripción" required>
            <TextInput
              ref={descRef}
              value={desc}
              onChangeText={(t) => {
                setDesc(t);
                if (t.trim().length >= MIN_DESC) setErrors((e) => ({ ...e, desc: undefined }));
              }}
              accessibilityLabel={`Descripción del problema, obligatorio, mínimo ${MIN_DESC} caracteres`}
              maxLength={MAX}
              multiline
              placeholder="Ej.: La lámpara no enciende desde hace varios días. Está frente al parque."
              placeholderTextColor={C.text3}
              textAlignVertical="top"
              style={[s.desc, errors.desc ? s.inputErr : null]}
            />
            <View style={s.descMeta}>
              <Text style={[s.metaText, descLen >= MIN_DESC && { color: C.success }]}>
                {descLen >= MIN_DESC ? '✓ Suficiente detalle' : `Mínimo ${MIN_DESC} caracteres`}
              </Text>
              <Text style={s.metaText} accessibilityLabel={`${desc.length} de ${MAX} caracteres`}>
                {desc.length}/{MAX}
              </Text>
            </View>
            <FieldMessage text={errors.desc} />
          </Group>
        </View>

        <Group label={`Fotos de evidencia (${photos.length}/${MAX_PHOTOS})`} optional>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {photos.map((uri, i) => (
              <View key={uri} style={s.photo}>
                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`Foto ${i + 1}`} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar foto ${i + 1}`}
                  onPress={() => setPhotos((ps) => ps.filter((x) => x !== uri))}
                  hitSlop={6}
                  style={s.photoX}>
                  <Icon name="x" size={14} color={C.text1} strokeWidth={3} />
                </Pressable>
              </View>
            ))}
          </View>
          {photos.length < MAX_PHOTOS ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <AddTile label="Tomar foto" icon="camera" onPress={() => addPhoto('camera')} />
              <AddTile label="Elegir de galería" icon="image" onPress={() => addPhoto('library')} />
            </View>
          ) : null}
        </Group>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: 12 + insets.bottom }]}>
        <FieldMessage text={errors.send} />
        <FieldMessage text={state === 'sent' ? 'Reporte enviado. Te llevamos a la lista de reportes…' : null} tone="success" />
        <PrimaryButton
          onPress={submit}
          disabled={state === 'sent'}
          loading={state === 'sending'}
          accessibilityLabel="Enviar reporte"
          style={{ marginTop: 6 }}>
          {state === 'sent' ? (
            <>
              <Icon name="check" size={18} color={C.disabledText} strokeWidth={2.6} />
              <Text style={[s.btnText, { color: C.disabledText }]}>Enviado</Text>
            </>
          ) : state === 'sending' ? (
            <Text style={s.btnText}>Enviando…</Text>
          ) : (
            <>
              <Icon name="send" size={16} color="#fff" />
              <Text style={s.btnText}>Enviar reporte</Text>
            </>
          )}
        </PrimaryButton>
        {busy ? null : <Text style={s.footHint}>Modo demostración: el reporte se guarda en este dispositivo.</Text>}
      </View>
    </KeyboardAvoidingView>
  );
}

function Group({ label, required, optional, children }: { label: string; required?: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.groupLabel}>
        {label}
        {required ? <Text style={s.req}> (obligatorio)</Text> : null}
        {optional ? <Text style={s.opt}> (opcional)</Text> : null}
      </Text>
      {children}
    </View>
  );
}

function AddTile({ label, icon, onPress }: { label: string; icon: IconName; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s.tile, pressed && { backgroundColor: C.blueIcon }]}>
      <Icon name={icon} size={22} color={C.blue} />
      <Text style={s.tileText}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 6, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: '#fff' },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FONT.displayXBold, fontSize: 18, color: C.navy },
  body: { padding: 18, gap: 20, paddingBottom: 28 },
  sub: { fontFamily: FONT.sans, fontSize: 14.5, color: C.text2, lineHeight: 20 },
  groupLabel: { fontFamily: FONT.sansBold, fontSize: 15, color: C.navy },
  req: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.danger },
  opt: { fontFamily: FONT.sans, fontSize: 13, color: C.text2 },
  priRow: { flexDirection: 'row', gap: 8 },
  pri: { flex: 1, minHeight: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: C.inputBorder },
  priOn: { backgroundColor: C.blueSoft, borderWidth: 2, borderColor: C.blue },
  priDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: C.blueMid },
  priText: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  priHint: { fontFamily: FONT.sans, fontSize: 11.5, color: C.text2, textAlign: 'center' },
  addr: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 50, paddingLeft: 12, borderRadius: 12, borderWidth: 1, borderColor: C.inputBorder, backgroundColor: '#fff' },
  addrInput: { flex: 1, minWidth: 0, minHeight: 48, fontFamily: FONT.sans, fontSize: 16, color: C.text1, paddingVertical: 0, paddingRight: 12 },
  clear: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  inputErr: { borderColor: C.danger, borderWidth: 1.5, backgroundColor: C.dangerSoft },
  locate: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, borderRadius: 12, borderWidth: 1.5, borderColor: C.blue, backgroundColor: C.blueSoft },
  locateText: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.blue },
  desc: { minHeight: 110, paddingTop: 12, paddingHorizontal: 12, paddingBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: C.inputBorder, fontFamily: FONT.sans, fontSize: 16, lineHeight: 22, color: C.text1, backgroundColor: '#fff' },
  descMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text2 },
  photo: { width: 80, height: 80, borderRadius: 10, overflow: 'hidden', backgroundColor: C.blue },
  photoX: { position: 'absolute', top: 4, right: 4, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' },
  tile: { flex: 1, minWidth: 0, height: 76, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.blueMid, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center', gap: 6 },
  tileText: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.blue, textAlign: 'center' },
  footer: { paddingHorizontal: 18, paddingTop: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border, gap: 4 },
  btnText: { fontFamily: FONT.sansBold, fontSize: 15, color: '#fff' },
  footHint: { fontFamily: FONT.sans, fontSize: 12, color: C.text2, textAlign: 'center', marginTop: 4 },
});
