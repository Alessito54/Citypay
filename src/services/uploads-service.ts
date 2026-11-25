import { Platform } from 'react-native';

import type { PhotoAttachment } from '@/types';

import { apiClient } from './api-client';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'zqu7gzrq';
const PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'citypay_reports';
const FOLDER = 'citypay/reports';

interface SignedUploadParams {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}

interface BackendUploadResponse {
  secureUrl: string;
  publicId: string;
}

function normalizeMime(mime?: string | null, uri?: string): string {
  if (mime && mime.startsWith('image/')) return mime;
  const ext = /\.(\w+)(?:\?|$)/.exec(uri ?? '')?.[1]?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

async function blobUrlToDataUri(uri: string, fallbackMime: string): Promise<string | null> {
  if (uri.startsWith('data:image/')) return uri;
  if (Platform.OS !== 'web') return null;
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('No se pudo leer la imagen seleccionada.'));
      };
      reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
      reader.readAsDataURL(blob.type ? blob : new Blob([blob], { type: fallbackMime }));
    });
  } catch {
    return null;
  }
}

async function buildDataUri(item: string | PhotoAttachment): Promise<string | null> {
  if (typeof item === 'string') {
    if (item.startsWith('data:image/')) return item;
    return blobUrlToDataUri(item, normalizeMime(undefined, item));
  }
  const mime = normalizeMime(item.mimeType, item.uri);
  if (item.base64) {
    const clean = item.base64.replace(/^data:image\/\w+;base64,/, '');
    return `data:${mime};base64,${clean}`;
  }
  if (item.uri.startsWith('data:image/')) return item.uri;
  return blobUrlToDataUri(item.uri, mime);
}

async function appendFileToForm(form: FormData, item: string | PhotoAttachment, dataUri: string | null) {
  const uri = typeof item === 'string' ? item : item.uri;
  const mime = normalizeMime(typeof item === 'string' ? undefined : item.mimeType, uri);
  const ext = mime.split('/')[1] || 'jpg';
  const name = (typeof item !== 'string' && item.fileName) || `evidencia_${Date.now()}.${ext}`;

  if (Platform.OS === 'web') {
    const src = dataUri || uri;
    const res = await fetch(src);
    const blob = await res.blob();
    form.append('file', blob, name);
  } else {
    form.append('file', { uri, name, type: mime } as unknown as Blob);
  }
}

/**
 * Sube una foto de evidencia de forma compatible con iOS, Android y Web:
 * 1) `POST /uploads` en el backend (usa credenciales firmadas de servidor en Cloudinary).
 * 2) `POST /uploads/sign` + subida firmada directa a Cloudinary.
 * 3) Respaldo con upload_preset en Cloudinary.
 */
export async function uploadPhoto(item: string | PhotoAttachment): Promise<string> {
  const rawUri = typeof item === 'string' ? item : item.uri;
  if (/^https?:\/\//.test(rawUri)) return rawUri;

  const dataUri = await buildDataUri(item);

  // 1. Subida autenticada mediante el backend (/uploads) — funciona en móvil y web sin depender de presets sin firma
  if (dataUri) {
    try {
      const uploaded = await apiClient<BackendUploadResponse>('/uploads', {
        method: 'POST',
        body: { file: dataUri, folder: FOLDER },
      });
      if (uploaded?.secureUrl) return uploaded.secureUrl;
    } catch {
      // Continúa al respaldo firmado directo
    }
  }

  // 2. Subida directa a Cloudinary con firma generada por el backend (/uploads/sign)
  try {
    const signed = await apiClient<SignedUploadParams>('/uploads/sign', {
      method: 'POST',
      body: { folder: FOLDER },
    });
    const form = new FormData();
    await appendFileToForm(form, item, dataUri);
    form.append('api_key', signed.apiKey);
    form.append('timestamp', String(signed.timestamp));
    form.append('signature', signed.signature);
    form.append('folder', signed.folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
    if (res.ok) {
      const json = (await res.json()) as { secure_url?: string };
      if (json.secure_url) return json.secure_url;
    }
  } catch {
    // Continúa al respaldo con preset público
  }

  // 3. Respaldo con preset sin firma en Cloudinary
  if (CLOUD_NAME && PRESET) {
    try {
      const form = new FormData();
      await appendFileToForm(form, item, dataUri);
      form.append('upload_preset', PRESET);
      form.append('folder', FOLDER);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: form,
      });
      if (res.ok) {
        const json = (await res.json()) as { secure_url?: string };
        if (json.secure_url) return json.secure_url;
      }
    } catch {
      // Si falla la red hacia Cloudinary, reporta error claro abajo
    }
  }

  throw new Error('No se pudieron subir las fotos de evidencia. Verifica tu conexión e inténtalo nuevamente.');
}
