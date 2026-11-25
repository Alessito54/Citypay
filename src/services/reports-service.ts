import { isDemoId, type Loaded } from '@/lib/data-source';
import { getDepartment, resolveDepartmentForReport } from '@/lib/orizaba';
import type { NewReportInput, Report, ReportEstado } from '@/types';

import { ApiError, apiClient } from './api-client';
import { DEMO_REPORTS } from './demo-data';
import { uploadPhoto } from './uploads-service';

function enrichDepartment(r: Report): Report {
  const slug = r.department || resolveDepartmentForReport(r.categoria, r.title);
  const dept = getDepartment(slug);
  return {
    ...r,
    department: slug,
    departamentoNombre: r.departamentoNombre || dept?.name || null,
  };
}

export const reportsService = {
  /**
   * Lista reportes desde la API.
   * Si `onlyMine` es `true` (ciudadano), pide `/reports?mine=true`; el personal pide `/reports`.
   */
  async list(onlyMine = false): Promise<Loaded<Report[]>> {
    try {
      const endpoint = onlyMine ? '/reports?mine=true' : '/reports';
      const items = await apiClient<Report[]>(endpoint);
      return { items: items.map(enrichDepartment), source: 'api' };
    } catch (err) {
      const reason =
        err instanceof ApiError && err.statusCode === 403
          ? 'Vista previa de demostración: tu cuenta en el servidor está registrada como ciudadano.'
          : err instanceof Error
            ? err.message
            : 'Sin conexión temporal con el servidor.';
      return {
        items: DEMO_REPORTS.map(enrichDepartment),
        source: 'demo',
        reason,
      };
    }
  },

  /** Registro completo (coordenadas, fotos, historial y descripción) para la hoja de detalle. */
  async get(id: string): Promise<Report | null> {
    if (isDemoId(id)) return null;
    const item = await apiClient<Report>(`/reports/${id}`);
    return enrichDepartment(item);
  },

  /** Crea un reporte ciudadano con fotos de evidencia subidas a Cloudinary. */
  async submit(input: NewReportInput): Promise<Report> {
    const images = input.fotos.length > 0 ? await Promise.all(input.fotos.map(uploadPhoto)) : [];
    try {
      const created = await apiClient<Report>('/reports', {
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
      return enrichDepartment({
        ...created,
        fotos: created.fotos?.length ? created.fotos : images,
      });
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 0) {
        throw new Error('No se pudo enviar el reporte: no hay conexión con el servidor. Inténtalo de nuevo.');
      }
      throw err;
    }
  },

  /** Actualiza el estado o coordinación de un reporte ciudadano (solo personal autorizado). */
  async updateStatus(
    id: string,
    payload: { status: ReportEstado; notes?: string; department?: string },
  ): Promise<Report> {
    if (isDemoId(id)) {
      const found = DEMO_REPORTS.find((r) => r.id === id);
      if (!found) throw new Error('Reporte de demostración no encontrado.');
      return enrichDepartment({
        ...found,
        estado: payload.status,
        department: payload.department ?? found.department,
      });
    }
    const updated = await apiClient<Report>(`/reports/${id}/status`, {
      method: 'PATCH',
      body: payload,
    });
    return enrichDepartment(updated);
  },
};
