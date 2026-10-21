import type { NewReportInput, Report } from '@/types';
import { apiClient } from './api-client';
import { DEMO_REPORTS } from './demo-data';

const ICONS: Record<string, string> = {
  'Alumbrado público': '💡',
  Vialidad: '🚧',
  Agua: '💧',
  'Limpieza y residuos': '🗑️',
  'Parques y jardines': '🛝',
};

/**
 * Uploads a local photo to Cloudinary using either the backend upload endpoint
 * or direct unsigned/signed Cloudinary upload
 */
async function uploadPhotoToCloudinary(uri: string): Promise<string> {
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  // Cloudinary upload: send multipart to backend /uploads
  // or fetch blob and convert to base64
  try {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'zqu7gzrq';
    const preset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'citypay_reports';

    const formData = new FormData();
    const filename = uri.split('/').pop() || `photo_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri,
      name: filename,
      type,
    } as any);
    formData.append('upload_preset', preset);
    formData.append('folder', 'citypay/reports');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return data.secure_url;
    }
  } catch {
    // If client direct upload fails, fallback to passing local uri or placeholder
  }

  return uri;
}

export const reportsService = {
  isDemo: false,

  async list(): Promise<Report[]> {
    try {
      const reports = await apiClient<Report[]>('/reports');
      return reports;
    } catch {
      // Graceful fallback to demo reports if offline or unauthenticated
      return DEMO_REPORTS;
    }
  },

  async submit(input: NewReportInput): Promise<Report> {
    // Upload photos if any
    const uploadedUrls: string[] = [];
    if (input.fotos && input.fotos.length > 0) {
      for (const photoUri of input.fotos) {
        const url = await uploadPhotoToCloudinary(photoUri);
        uploadedUrls.push(url);
      }
    }

    try {
      const created = await apiClient<Report>('/reports', {
        method: 'POST',
        body: JSON.stringify({
          title: input.problema,
          category: input.categoria,
          priority: input.prioridad === 'Bajo' ? 'Baja' : input.prioridad,
          address: input.direccion,
          description: input.descripcion,
          images: uploadedUrls,
        }),
      });

      return created;
    } catch (err: any) {
      // If backend request fails, return local record with error explanation
      return {
        id: `local-${Date.now()}`,
        title: input.problema,
        address: input.direccion,
        date: new Date()
          .toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
          .replace(/\./g, ''),
        estado: 'Nuevo',
        categoria: input.categoria,
        prioridad: input.prioridad === 'Bajo' ? 'Baja' : (input.prioridad as any),
        icon: ICONS[input.categoria] ?? '📋',
        localOnly: true,
      };
    }
  },
};
