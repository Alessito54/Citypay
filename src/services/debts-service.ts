import { apiClient } from './api-client';

export interface DebtItem {
  id: string;
  folio: string;
  concept: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  service?: {
    slug: string;
    name: string;
    icon: string;
  };
}

export const debtsService = {
  async getMyDebts(): Promise<DebtItem[]> {
    try {
      const debts = await apiClient<DebtItem[]>('/debts/me');
      return Array.isArray(debts) ? debts : [];
    } catch {
      return [];
    }
  },

  async getDebtsByUser(userId: string): Promise<DebtItem[]> {
    try {
      const debts = await apiClient<DebtItem[]>(`/debts/user/${userId}`);
      return Array.isArray(debts) ? debts : [];
    } catch {
      return [];
    }
  },
};
