import { apiClient } from './api-client';

export interface UserItem {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'citizen' | 'municipal_official' | 'municipal_supervisor';
  phone?: string | null;
  createdAt: string;
  paymentsCount?: number;
  reportsCount?: number;
}

export const usersService = {
  async listUsers(): Promise<{ items: UserItem[]; total: number }> {
    try {
      const res = await apiClient<{ items: UserItem[]; total: number }>('/users');
      return res || { items: [], total: 0 };
    } catch {
      return { items: [], total: 0 };
    }
  },

  async updateUser(id: string, data: { displayName?: string; phone?: string; role?: string }): Promise<UserItem> {
    return apiClient<UserItem>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};
