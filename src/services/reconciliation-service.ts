import { isDemoId, type Loaded } from '@/lib/data-source';
import type { Transaction } from '@/types';

import { apiClient } from './api-client';
import { DEMO_TRANSACTIONS } from './demo-data';

export interface ForceReconcileInput {
  transactionId: string;
  reason: string;
  notes: string;
}

export const reconciliationService = {
  /** Payments from the API (staff only). Falls back to demo data when the API cannot be used. */
  async listTransactions(): Promise<Loaded<Transaction[]>> {
    try {
      return { items: await apiClient<Transaction[]>('/payments'), source: 'api' };
    } catch (err) {
      return { items: DEMO_TRANSACTIONS, source: 'demo', reason: err instanceof Error ? err.message : undefined };
    }
  },

  /**
   * Records a manual reconciliation in the audit trail. Errors propagate: the previous
   * version swallowed them and showed "conciliado" even when the server had refused it.
   * Demo records only change on this device.
   */
  async forceReconcile(input: ForceReconcileInput): Promise<Transaction | null> {
    if (!input.reason) throw new Error('Selecciona un motivo.');
    if (isDemoId(input.transactionId)) return null;
    return apiClient<Transaction>(`/payments/${input.transactionId}/reconcile`, {
      method: 'POST',
      body: { reason: input.reason, notes: input.notes },
    });
  },
};
