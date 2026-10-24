import type { Transaction } from '@/types';
import { apiClient } from './api-client';

export interface ForceReconcileInput {
  transactionId: string;
  reason: string;
  notes: string;
}

export const reconciliationService = {
  isDemo: false,

  async listTransactions(isAdmin = false): Promise<Transaction[]> {
    try {
      const endpoint = isAdmin ? '/payments' : '/payments/me';
      const transactions = await apiClient<Transaction[]>(endpoint);
      return Array.isArray(transactions) ? transactions : [];
    } catch {
      return [];
    }
  },

  async getAnalytics(): Promise<{
    totalSistema: number;
    totalBanco: number;
    cuadrados: number;
    discrepancias: number;
    pendientes: number;
    totalCount: number;
  }> {
    try {
      return await apiClient('/payments/analytics');
    } catch {
      return { totalSistema: 0, totalBanco: 0, cuadrados: 0, discrepancias: 0, pendientes: 0, totalCount: 0 };
    }
  },

  async forceReconcile(input: ForceReconcileInput): Promise<void> {
    if (!input.reason) throw new Error('Selecciona un motivo.');

    try {
      await apiClient(`/payments/${input.transactionId}/reconcile`, {
        method: 'POST',
        body: JSON.stringify({
          reason: input.reason,
          notes: input.notes,
        }),
      });
    } catch {
      // If endpoint fails or local ID, caller will record locally
    }
  },
};
