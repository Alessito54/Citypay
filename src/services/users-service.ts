import type { ManagedUser } from '@/types';

import { apiClient } from './api-client';

export const usersService = {
  async list(): Promise<ManagedUser[]> {
    const res = await apiClient<{ items: ManagedUser[]; total: number }>('/users?limit=100');
    return res.items ?? [];
  },

  async updateRoleAndDepartment(
    userId: string,
    payload: { role?: string; department?: string | null },
  ): Promise<ManagedUser> {
    return apiClient<ManagedUser>(`/users/${userId}/role`, {
      method: 'PATCH',
      body: payload,
    });
  },

  async updateMyPreviewRole(payload: { role: string; department?: string | null }): Promise<ManagedUser> {
    return apiClient<ManagedUser>('/users/me/role-preview', {
      method: 'PATCH',
      body: payload,
    });
  },
};
