import { isDemoId, type Loaded } from '@/lib/data-source';
import type { RigorousReconcilePayload, Transaction } from '@/types';

import { ApiError, apiClient } from './api-client';
import { DEMO_TRANSACTIONS } from './demo-data';
import { uploadPhoto } from './uploads-service';

export interface ForceReconcileInput extends RigorousReconcilePayload {
  transactionId: string;
}

export const reconciliationService = {
  async listTransactions(): Promise<Loaded<Transaction[]>> {
    try {
      return { items: await apiClient<Transaction[]>('/payments'), source: 'api' };
    } catch (err) {
      const reason =
        err instanceof ApiError && err.statusCode === 403
          ? 'Vista previa de demostración: tu cuenta en el servidor está registrada como ciudadano.'
          : err instanceof Error
            ? err.message
            : 'Sin conexión temporal con el servidor.';
      return { items: DEMO_TRANSACTIONS, source: 'demo', reason };
    }
  },

  /**
   * Registra un dictamen riguroso de conciliación bancaria con referencia verificada,
   * monto real en estado de cuenta, folio de póliza/respaldo y observaciones auditables.
   */
  async forceReconcile(input: ForceReconcileInput): Promise<Transaction | null> {
    if (!input.reason) throw new Error('Selecciona el motivo del dictamen.');
    let receiptUrl: string | undefined;
    if (input.receiptPhoto) {
      receiptUrl = await uploadPhoto(input.receiptPhoto);
    }

    if (isDemoId(input.transactionId)) return null;

    const enrichedNotes = [
      `[Ref. verificada: ${input.bankReference.trim().toUpperCase()}]`,
      `[Importe banco: $${input.verifiedBankAmount.toFixed(2)} MXN]`,
      `[Póliza/Acta: ${input.evidenceFolio.trim().toUpperCase()}]`,
      input.notes.trim(),
    ].join(' · ');

    return apiClient<Transaction>(`/payments/${input.transactionId}/reconcile`, {
      method: 'POST',
      body: {
        reason: input.reason,
        bankReference: input.bankReference.trim().toUpperCase(),
        verifiedBankAmount: input.verifiedBankAmount,
        evidenceFolio: input.evidenceFolio.trim().toUpperCase(),
        notes: enrichedNotes,
        receiptUrl,
      },
    });
  },
};
