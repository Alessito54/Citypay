import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import { notifyUser } from '@/lib/alerts';
import type { PhotoAttachment } from '@/types';

import { MAX_PHOTOS } from './report-form';

/** Selector de cámara/archivo nativo en navegadores web cuando `launchCameraAsync` no está soportado. */
function pickWebCameraFile(): Promise<PhotoAttachment | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = typeof reader.result === 'string' ? reader.result : null;
        if (!dataUri) {
          resolve(null);
          return;
        }
        const base64 = dataUri.split(',')[1] ?? null;
        resolve({
          uri: dataUri,
          base64,
          mimeType: file.type || 'image/jpeg',
          fileName: file.name || `foto_${Date.now()}.jpg`,
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

/** Evidencia fotográfica: permisos, cámara / galería en iOS, Android y Web con soporte Base64 y hasta 4 fotos. */
export function usePhotoAttachments() {
  const [photos, setPhotos] = useState<PhotoAttachment[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const add = async (source: 'camera' | 'library') => {
    setPhotoError(null);
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      const msg = `Puedes adjuntar hasta ${MAX_PHOTOS} imágenes de evidencia.`;
      setPhotoError(msg);
      notifyUser('Evidencia', msg);
      return;
    }

    try {
      // En Web, "Tomar foto" abre directamente el input con `capture="environment"` (cámara en celular o archivo en PC)
      if (Platform.OS === 'web' && source === 'camera') {
        const picked = await pickWebCameraFile();
        if (picked) {
          setPhotos((prev) => [...prev, picked].slice(0, MAX_PHOTOS));
          AccessibilityInfo.announceForAccessibility('Foto agregada');
        }
        return;
      }

      if (Platform.OS !== 'web') {
        const perm =
          source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          const msg =
            source === 'camera'
              ? 'Concede permiso a la cámara en los ajustes de tu teléfono para tomar la foto.'
              : 'Concede permiso a tu galería en los ajustes de tu teléfono para elegir imágenes.';
          setPhotoError(msg);
          notifyUser('Permiso requerido', msg);
          return;
        }
      }

      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality: 0.65,
        base64: true,
        allowsMultipleSelection: source === 'library' && remaining > 1,
        selectionLimit: source === 'library' ? remaining : 1,
      };

      const res =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);

      if (!res.canceled && res.assets?.length) {
        const added: PhotoAttachment[] = res.assets.slice(0, remaining).map((asset, i) => ({
          uri: asset.uri,
          base64: asset.base64 ?? null,
          mimeType: asset.mimeType ?? 'image/jpeg',
          fileName: asset.fileName ?? `evidencia_${Date.now()}_${i}.jpg`,
        }));
        setPhotos((prev) => [...prev, ...added].slice(0, MAX_PHOTOS));
        AccessibilityInfo.announceForAccessibility(
          added.length === 1 ? 'Foto agregada' : `${added.length} fotos agregadas`,
        );
      }
    } catch {
      const msg = 'No se pudo abrir el selector de imágenes. Intenta con Elegir de galería.';
      setPhotoError(msg);
      notifyUser('Fotos de evidencia', msg);
    }
  };

  const remove = (uri: string) => {
    setPhotoError(null);
    setPhotos((p) => p.filter((x) => x.uri !== uri));
  };

  return { photos, photoError, add, remove };
}
