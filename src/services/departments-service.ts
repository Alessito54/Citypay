import type {
  Department,
  DepartmentDetail,
  DepartmentReport,
  DepartmentStaff,
  ReportEstado,
} from '@/types';

import { apiClient } from './api-client';

/**
 * Municipal departments. Every signed-in account can read the directory; the
 * indicators in `metrics` only come back for municipal staff, so the screens
 * must treat them as optional.
 */
export const departmentsService = {
  async list(): Promise<{ items: Department[]; withMetrics: boolean }> {
    const res = await apiClient<{ items: Department[]; withMetrics: boolean }>('/departments');
    return { items: res?.items ?? [], withMetrics: !!res?.withMetrics };
  },

  async detail(slug: string): Promise<DepartmentDetail> {
    const res = await apiClient<DepartmentDetail>(`/departments/${encodeURIComponent(slug)}`);
    return {
      ...res,
      staff: res?.staff ?? [],
      reports: res?.reports ?? [],
      payments: res?.payments ?? [],
    };
  },

  /** The department of the signed-in official, or null when not attached to one. */
  async mine(): Promise<DepartmentDetail | null> {
    try {
      const res = await apiClient<DepartmentDetail | null>('/departments/mine');
      if (!res) return null;
      return { ...res, staff: res.staff ?? [], reports: res.reports ?? [], payments: res.payments ?? [] };
    } catch {
      return null;
    }
  },

  async reports(
    slug: string,
    filters?: { status?: ReportEstado | 'Todos'; q?: string },
  ): Promise<DepartmentReport[]> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'Todos') params.set('status', filters.status);
    if (filters?.q?.trim()) params.set('q', filters.q.trim());
    const query = params.toString();
    const list = await apiClient<DepartmentReport[]>(
      `/departments/${encodeURIComponent(slug)}/reports${query ? `?${query}` : ''}`,
    );
    return Array.isArray(list) ? list : [];
  },

  async update(id: string, data: Partial<Department>): Promise<Department> {
    return apiClient<Department>(`/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async assignStaff(departmentId: string, userId: string): Promise<DepartmentStaff> {
    return apiClient<DepartmentStaff>(`/departments/${departmentId}/staff`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async removeStaff(userId: string): Promise<DepartmentStaff> {
    return apiClient<DepartmentStaff>(`/departments/staff/${userId}`, { method: 'DELETE' });
  },
};

export const AREA_LABEL: Record<Department['area'], string> = {
  recaudacion: 'Recaudación',
  operacion: 'Operación y servicios',
  control: 'Control y fiscalización',
};

export const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador General',
  municipal_supervisor: 'Supervisor Municipal',
  municipal_official: 'Funcionario Municipal',
  citizen: 'Ciudadano',
};
