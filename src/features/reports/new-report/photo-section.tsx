import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { FieldMessage } from '@/components/ui';
import { C, FONT, RADIUS, TOUCH } from '@/constants/colors';
import type { PhotoAttachment } from '@/types';

import { MAX_PHOTOS } from './report-form';

export function PhotoSection({
  photos,
  error,
  onAdd,
  onRemove,
}: {
  photos: PhotoAttachment[];
  error?: string | null;
  onAdd: (source: 'camera' | 'library') => void;
  onRemove: (uri: string) => void;
}) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  return (
    <>
      {photos.length > 0 ? (
        <View style={s.grid}>
          {photos.map((item, i) => (
            <View key={item.uri} style={s.photo}>
              <Pressable
                accessibilityRole="imagebutton"
                accessibilityLabel={`Ampliar foto ${i + 1}`}
                onPress={() => setPreviewUri(item.uri)}
                style={StyleSheet.absoluteFill}>
                <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar foto ${i + 1}`}
                onPress={() => onRemove(item.uri)}
                style={s.remove}>
                <View style={s.removeBox}>
                  <Icon name="x" size={14} color={C.text1} strokeWidth={3} />
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {photos.length < MAX_PHOTOS ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <AddTile label="Tomar foto" icon="camera" onPress={() => onAdd('camera')} />
          <AddTile label="Elegir de galería" icon="image" onPress={() => onAdd('library')} />
        </View>
      ) : null}

      <Text style={s.helper}>
        Puedes tomar o adjuntar hasta {MAX_PHOTOS} fotografías claras del problema (JPG, PNG o WebP).
      </Text>
      <FieldMessage text={error ?? undefined} />

      <Modal visible={!!previewUri} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <Pressable style={s.modalBg} onPress={() => setPreviewUri(null)}>
          {previewUri ? <Image source={{ uri: previewUri }} style={s.modalImg} contentFit="contain" /> : null}
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar vista previa" onPress={() => setPreviewUri(null)} style={s.modalClose}>
            <Icon name="x" size={20} color="#fff" strokeWidth={2.6} />
            <Text style={s.modalCloseText}>Cerrar</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function AddTile({ label, icon, onPress }: { label: string; icon: IconName; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [s.tile, pressed && { backgroundColor: C.blueIcon }]}>
      <Icon name={icon} size={22} color={C.blue} />
      <Text style={s.tileText}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  photo: { width: 88, height: 88, borderRadius: RADIUS, overflow: 'hidden', backgroundColor: C.blueIcon, borderWidth: 1, borderColor: C.border },
  remove: { position: 'absolute', top: 0, right: 0, width: TOUCH, height: TOUCH, alignItems: 'flex-end', justifyContent: 'flex-start', padding: 4 },
  removeBox: { width: 28, height: 28, borderRadius: RADIUS, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' },
  tile: { flex: 1, minWidth: 0, height: 76, borderRadius: RADIUS, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.blueMid, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center', gap: 6 },
  tileText: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.blue, textAlign: 'center' },
  helper: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text2 },
  modalBg: { flex: 1, backgroundColor: 'rgba(11, 23, 54, 0.92)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalImg: { width: '100%', height: '78%' },
  modalClose: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: C.blue, borderRadius: RADIUS, minHeight: TOUCH },
  modalCloseText: { fontFamily: FONT.sansBold, fontSize: 14, color: '#fff' },
});
