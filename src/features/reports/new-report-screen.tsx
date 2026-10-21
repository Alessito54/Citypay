import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useState } from 'react';
import {
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
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

import { HeaderLogo } from '@/components/brand';
import { Icon, type IconName } from '@/components/icon';
import { PrimaryButton, SelectField } from '@/components/ui';
import { C, FONT } from '@/constants/colors';
import type { NewReportInput } from '@/types';

import { useReports } from './reports-context';

const MAX = 250;
const MAX_PHOTOS = 4;

const PROBLEMAS: Record<string, string[]> = {
  'Alumbrado público': ['Lámpara apagada', 'Poste dañado', 'Cableado expuesto'],
  Vialidad: ['Bache en la calle', 'Semáforo descompuesto', 'Señalización dañada'],
  Agua: ['Fuga de agua', 'Sin suministro', 'Drenaje tapado'],
  'Limpieza y residuos': ['Contenedor lleno', 'Basura acumulada'],
  'Parques y jardines': ['Juego dañado', 'Árbol caído', 'Pasto sin podar'],
};
const PRIORIDADES: { id: NewReportInput['prioridad']; dot: string }[] = [
  { id: 'Bajo', dot: C.blueIcon },
  { id: 'Media', dot: C.blueMid },
  { id: 'Alta', dot: C.blue },
];

type SendState = 'idle' | 'sending' | 'sent' | 'error';

export function NewReportScreen({ onBack, onSent }: { onBack: () => void; onSent: () => void }) {
  const insets = useSafeAreaInsets();
  const { submitReport } = useReports();
  const [cat, setCat] = useState('Alumbrado público');
  const [prob, setProb] = useState('Lámpara apagada');
  const [pri, setPri] = useState<NewReportInput['prioridad']>('Alta');
  const [addr, setAddr] = useState('');
  const [desc, setDesc] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [state, setState] = useState<SendState>('idle');
  const [errors, setErrors] = useState<{ addr?: string; desc?: string; send?: string }>({});
  const [locating, setLocating] = useState(false);

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
    if (!res.canceled && res.assets[0]) setPhotos((p) => [...p, res.assets[0].uri].slice(0, MAX_PHOTOS));
  };

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Concede acceso a la ubicación para usar esta opción.');
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
    } catch {
      Alert.alert('Ubicación', 'No se pudo obtener tu ubicación actual.');
    } finally {
      setLocating(false);
    }
  };

  const submit = async () => {
    const e: typeof errors = {};
    if (!addr.trim()) e.addr = 'Indica la ubicación del problema.';
    if (desc.trim().length < 10) e.desc = 'Describe el problema (mínimo 10 caracteres).';
    setErrors(e);
    if (e.addr || e.desc) return;

    setState('sending');
    try {
      await submitReport({ categoria: cat, problema: prob, prioridad: pri, direccion: addr.trim(), descripcion: desc.trim(), fotos: photos });
      setState('sent');
      setTimeout(onSent, 1400);
    } catch {
      setState('error');
      setErrors({ send: 'No se pudo enviar el reporte. Inténtalo de nuevo.' });
    }
  };

  const busy = state === 'sending' || state === 'sent';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable accessibilityLabel="Volver" onPress={onBack} hitSlop={8}>
          <Icon name="chevronLeft" size={22} color={C.text1} />
        </Pressable>
        <HeaderLogo />
        <View style={s.headerRight}>
          <Icon name="bell" size={22} color={C.text1} />
          <View style={s.avatar}>
            <Icon name="user" size={16} color={C.blue} />
          </View>
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
        <View>
          <Text style={s.h1}>Nuevo reporte</Text>
          <Text style={s.sub}>Ayúdanos a mantener una mejor ciudad.</Text>
        </View>

        <Group label="Categoría">
          <SelectField
            variant="row"
            leftIcon={'bulb' as IconName}
            value={cat}
            options={Object.keys(PROBLEMAS)}
            onChange={(v) => {
              setCat(v);
              setProb(PROBLEMAS[v][0]);
            }}
          />
        </Group>
        <Group label="Problema">
          <SelectField variant="row" leftIcon="warn" rightIcon="chevronRight" value={prob} options={PROBLEMAS[cat]} onChange={setProb} />
        </Group>

        <Group label="Prioridad">
          <View style={s.priRow} accessibilityRole="radiogroup">
            {PRIORIDADES.map((p) => {
              const on = pri === p.id;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => setPri(p.id)}
                  style={[s.pri, on && s.priOn]}>
                  <View style={[s.priDot, { backgroundColor: p.dot }]} />
                  <Text style={[s.priText, on && { color: C.blue }]}>{p.id}</Text>
                </Pressable>
              );
            })}
          </View>
        </Group>

        <Group label="Ubicación">
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={[s.addr, errors.addr ? s.inputErr : null]}>
              <Icon name="pin" size={16} color={C.blueMid} />
              <TextInput
                value={addr}
                onChangeText={(t) => {
                  setAddr(t);
                  if (t.trim()) setErrors((e) => ({ ...e, addr: undefined }));
                }}
                placeholder="Calle, número y colonia"
                placeholderTextColor={C.text3}
                style={s.addrInput}
              />
              {addr ? (
                <Pressable accessibilityLabel="Borrar" onPress={() => setAddr('')} hitSlop={8}>
                  <Icon name="xCircle" size={14} color={C.text3} />
                </Pressable>
              ) : null}
            </View>
            <Pressable accessibilityLabel="Usar mi ubicación" onPress={useMyLocation} disabled={locating} style={[s.locate, locating && { opacity: 0.5 }]}>
              <Icon name="locate" size={18} color={C.blueMid} />
            </Pressable>
          </View>
          {errors.addr ? <Text style={s.err}>{errors.addr}</Text> : null}
          <MapPreview />
        </Group>

        <Group label="Descripción">
          <View>
            <TextInput
              value={desc}
              onChangeText={(t) => {
                setDesc(t);
                if (t.trim().length >= 10) setErrors((e) => ({ ...e, desc: undefined }));
              }}
              maxLength={MAX}
              multiline
              placeholder="La lámpara no enciende desde hace varios días. Se encuentra frente al parque."
              placeholderTextColor={C.text3}
              textAlignVertical="top"
              style={[s.desc, errors.desc ? s.inputErr : null]}
            />
            <Text style={s.counter}>{desc.length}/{MAX}</Text>
          </View>
          {errors.desc ? <Text style={s.err}>{errors.desc}</Text> : null}
        </Group>

        <Group label="Evidencia (opcional)">
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {photos.map((uri) => (
              <View key={uri} style={s.photo}>
                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                <Pressable accessibilityLabel="Quitar foto" onPress={() => setPhotos((ps) => ps.filter((x) => x !== uri))} style={s.photoX}>
                  <Icon name="x" size={10} color={C.text1} strokeWidth={3} />
                </Pressable>
              </View>
            ))}
            <AddTile label="Tomar foto" icon="camera" onPress={() => addPhoto('camera')} />
            <AddTile label="Agregar imagen" icon="image" onPress={() => addPhoto('library')} />
          </View>
        </Group>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: 12 + insets.bottom }]}>
        {errors.send ? <Text style={[s.err, { marginBottom: 6 }]}>{errors.send}</Text> : null}
        <PrimaryButton onPress={submit} disabled={busy}>
          {state === 'sent' ? (
            <Text style={s.btnText}>✓ Reporte guardado (demo, sin backend)</Text>
          ) : (
            <>
              <Icon name="send" size={16} color="#fff" />
              <Text style={s.btnText}>{state === 'sending' ? 'Enviando…' : 'Enviar reporte'}</Text>
            </>
          )}
        </PrimaryButton>
      </View>
    </KeyboardAvoidingView>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.groupLabel}>{label}</Text>
      {children}
    </View>
  );
}

function AddTile({ label, icon, onPress }: { label: string; icon: IconName; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={s.tile}>
      <Icon name={icon} size={20} color={C.blue} />
      <Text style={s.tileText}>{label}</Text>
    </Pressable>
  );
}

function MapPreview() {
  return (
    <View style={s.map}>
      <Svg width="100%" height="100%" viewBox="0 0 320 108" preserveAspectRatio="xMidYMid slice">
        <Rect width={320} height={108} fill={C.blueSoft} />
        <Rect x={190} y={0} width={130} height={50} fill={C.blueIcon} opacity={0.7} />
        <G stroke="#fff" strokeWidth={10} strokeLinecap="round">
          <Line x1={-10} y1={70} x2={330} y2={30} />
          <Line x1={120} y1={-10} x2={170} y2={120} />
          <Line x1={250} y1={-10} x2={230} y2={120} strokeWidth={7} />
        </G>
        <G stroke="#C3D6F5" strokeWidth={1.5}>
          <Line x1={-10} y1={95} x2={330} y2={85} />
          <Line x1={40} y1={-10} x2={60} y2={120} />
        </G>
      </Svg>
      <Svg width={26} height={32} viewBox="0 0 24 30" style={{ position: 'absolute', left: '46%', top: '30%' }}>
        <Path d="M12 0a9 9 0 0 0-9 9c0 7 9 19 9 19s9-12 9-19a9 9 0 0 0-9-9z" fill={C.blue} />
        <Circle cx={12} cy={9} r={3.5} fill="#fff" />
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.border },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 18, gap: 14 },
  h1: { fontFamily: FONT.displayXBold, fontSize: 26, color: C.navy },
  sub: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text2, marginTop: 3 },
  groupLabel: { fontFamily: FONT.sansBold, fontSize: 12, color: C.navy },
  priRow: { flexDirection: 'row', gap: 8 },
  pri: { flex: 1, height: 40, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border },
  priOn: { backgroundColor: C.blueSoft, borderWidth: 1.5, borderColor: C.blue },
  priDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1, borderColor: C.blueMid },
  priText: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text1 },
  addr: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  addrInput: { flex: 1, minWidth: 0, fontFamily: FONT.sans, fontSize: 12, color: C.text1, paddingVertical: 0 },
  inputErr: { borderColor: C.danger },
  locate: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  err: { fontFamily: FONT.sansSemi, fontSize: 11, color: C.danger },
  map: { height: 108, borderRadius: 10, overflow: 'hidden', backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  desc: { minHeight: 82, paddingTop: 10, paddingHorizontal: 12, paddingBottom: 22, borderRadius: 10, borderWidth: 1, borderColor: C.border, fontFamily: FONT.sans, fontSize: 12, lineHeight: 17, color: C.text1 },
  counter: { position: 'absolute', right: 10, bottom: 7, fontFamily: FONT.sans, fontSize: 9.5, color: C.text3 },
  photo: { width: 74, height: 74, borderRadius: 10, overflow: 'hidden', backgroundColor: C.blue },
  photoX: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  tile: { flex: 1, minWidth: 0, height: 74, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.blueMid, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center', gap: 5 },
  tileText: { fontFamily: FONT.sansSemi, fontSize: 10, color: C.blue, textAlign: 'center' },
  footer: { paddingHorizontal: 18, paddingTop: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border },
  btnText: { fontFamily: FONT.sansBold, fontSize: 14, color: '#fff' },
});
