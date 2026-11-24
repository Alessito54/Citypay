import { isDemoId, type Loaded } from '@/lib/data-source';
import type { NewReportInput, Report } from '@/types';

import { ApiError, apiClient } from './api-client';
import { DEMO_REPORTS } from './demo-data';
import { uploadPhoto } from './uploads-service';

export const reportsService = {
  /** Reports from the API. Falls back to demo data only when the API cannot be reached. */
  async list(): Promise<Loaded<Report[]>> {
    try {
      return { items: await apiClient<Report[]>('/reports'), source: 'api' };
    } catch (err) {
      return { items: DEMO_REPORTS, source: 'demo', reason: err instanceof Error ? err.message : undefined };
    }
  },

  /** Full record (coordinates, photos, description) for the detail sheet. */
  async get(id: string): Promise<Report | null> {
    if (isDemoId(id)) return null;
    return apiClient<Report>(`/reports/${id}`);
  },

  /** Creates the report. Errors reach the form: a failed send is never shown as "sent". */
  async submit(input: NewReportInput): Promise<Report> {
    const images = await Promise.all(input.fotos.map(uploadPhoto));
    try {
      return await apiClient<Report>('/reports', {
        method: 'POST',
        body: {
          title: input.problema,
          category: input.categoria,
          priority: input.prioridad,
          address: input.direccion,
          description: input.descripcion,
          images,
          latitude: input.latitude,
          longitude: input.longitude,
        },
      });
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 0) {
        throw new Error('No se pudo enviar el reporte: no hay conexión con el servidor. Inténtalo de nuevo.');
      }
      throw err;
    }
  },
};
