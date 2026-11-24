import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { C, FONT, RADIUS, TOUCH } from '@/constants/colors';

import { MAX_PHOTOS } from './report-form';

export function PhotoSection({
  photos,
  onAdd,
  onRemove,
}: {
  photos: string[];
  onAdd: (source: 'camera' | 'library') => void;
  onRemove: (uri: string) => void;
}) {
  return (
    <>
      <View style={s.grid}>
        {photos.map((uri, i) => (
          <View key={uri} style={s.photo}>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`Foto ${i + 1}`} />
            <Pressable accessibilityRole="button" accessibilityLabel={`Quitar foto ${i + 1}`} onPress={() => onRemove(uri)} style={s.remove}>
              <View style={s.removeBox}>
                <Icon name="x" size={14} color={C.text1} strokeWidth={3} />
              </View>
            </Pressable>
          </View>
        ))}
      </View>
      {photos.length < MAX_PHOTOS ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <AddTile label="Tomar foto" icon="camera" onPress={() => onAdd('camera')} />
          <AddTile label="Elegir de galería" icon="image" onPress={() => onAdd('library')} />
        </View>
      ) : null}
    </>
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
  grid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  photo: { width: 80, height: 80, borderRadius: RADIUS, overflow: 'hidden', backgroundColor: C.blue },
  // The visible box is 28 px, the touch area 44 px.
  remove: { position: 'absolute', top: 0, right: 0, width: TOUCH, height: TOUCH, alignItems: 'flex-end', justifyContent: 'flex-start', padding: 4 },
  removeBox: { width: 28, height: 28, borderRadius: RADIUS, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' },
  tile: { flex: 1, minWidth: 0, height: 76, borderRadius: RADIUS, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.blueMid, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center', gap: 6 },
  tileText: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.blue, textAlign: 'center' },
});
