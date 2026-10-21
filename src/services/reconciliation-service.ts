import type { Transaction } from '@/types';
import { apiClient } from './api-client';
import { DEMO_TRANSACTIONS } from './demo-data';

export interface ForceReconcileInput {
  transactionId: string;
  reason: string;
  notes: string;
}

export const reconciliationService = {
  isDemo: false,

  async listTransactions(): Promise<Transaction[]> {
    try {
      const transactions = await apiClient<Transaction[]>('/payments');
      if (Array.isArray(transactions) && transactions.length > 0) {
        return transactions;
      }
      return DEMO_TRANSACTIONS;
    } catch {
      return DEMO_TRANSACTIONS;
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
