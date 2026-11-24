import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';

import { MAX_PHOTOS } from './report-form';

/** Evidence photos: permissions, camera / gallery and the 4-photo limit. */
export function usePhotoAttachments() {
  const [photos, setPhotos] = useState<string[]>([]);

  const add = async (source: 'camera' | 'library') => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Evidencia', `Puedes adjuntar hasta ${MAX_PHOTOS} imágenes.`);
      return;
    }
    const perm =
      source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Concede el permiso en los ajustes del dispositivo para adjuntar imágenes.');
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    const uri = !res.canceled ? res.assets[0]?.uri : undefined;
    if (uri) {
      setPhotos((p) => [...p, uri].slice(0, MAX_PHOTOS));
      AccessibilityInfo.announceForAccessibility('Foto agregada');
    }
  };

  const remove = (uri: string) => setPhotos((p) => p.filter((x) => x !== uri));

  return { photos, add, remove };
}
