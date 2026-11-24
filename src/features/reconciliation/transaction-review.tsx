import { SheetModal } from '@/components/ui';

import { ForceReconcileForm } from './force-reconcile-form';
import { useReconciliation } from './reconciliation-context';
import { TransactionDetailSheet } from './transaction-detail-sheet';

/**
 * Hosts the detail sheet and the force-reconcile sheet in a single Modal
 * (nested Modals are unreliable on iOS). Mounted once inside the tabs layout.
 */
export function TransactionReviewHost() {
  const { selected, phase, close, cancelForce } = useReconciliation();
  if (!selected || phase === 'closed') return null;
  const force = phase === 'force';
  return (
    <SheetModal onDismiss={force ? cancelForce : close} dismissLabel={force ? 'Cancelar y volver al detalle' : 'Cerrar detalle'}>
      {force ? <ForceReconcileForm /> : <TransactionDetailSheet />}
    </SheetModal>
  );
}
