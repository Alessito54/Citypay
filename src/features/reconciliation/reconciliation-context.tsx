import { AccessibilityInfo } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEMO_TRANSACTIONS } from '@/services/demo-data';
import { reconciliationService } from '@/services/reconciliation-service';
import type { Transaction } from '@/types';

type Phase = 'closed' | 'detail' | 'force';

interface ReconciliationValue {
  transactions: Transaction[];
  /** ids marked as manually reconciled on this device or backend. */
  resolvedIds: ReadonlySet<string>;
  selected: Transaction | null;
  phase: Phase;
  refreshTransactions: () => Promise<void>;
  open: (tx: Transaction) => void;
  close: () => void;
  startForce: () => void;
  cancelForce: () => void;
  confirmForce: (reason: string, notes: string) => Promise<void>;
}

const Ctx = createContext<ReconciliationValue | null>(null);

export function ReconciliationProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(DEMO_TRANSACTIONS);
  const [resolvedIds, setResolvedIds] = useState<ReadonlySet<string>>(new Set());
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [phase, setPhase] = useState<Phase>('closed');

  const refreshTransactions = useCallback(async () => {
    try {
      const list = await reconciliationService.listTransactions();
      setTransactions(list);
    } catch {
      // Keep existing transactions
    }
  }, []);

  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  const open = useCallback((tx: Transaction) => {
    setSelected(tx);
    setPhase('detail');
  }, []);

  const close = useCallback(() => {
    setPhase('closed');
    setSelected(null);
  }, []);

  const startForce = useCallback(() => setPhase('force'), []);
  const cancelForce = useCallback(() => setPhase('detail'), []);

  const confirmForce = useCallback(
    async (reason: string, notes: string) => {
      if (!selected) return;
      await reconciliationService.forceReconcile({ transactionId: selected.id, reason, notes });
      setResolvedIds((prev) => new Set(prev).add(selected.id));
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === selected.id ? { ...t, estado: 'conciliado', montoBanco: t.montoSistema } : t,
        ),
      );
      // Return to the detail sheet so the user sees the "conciliado" confirmation
      // instead of the sheet silently disappearing.
      setPhase('detail');
      AccessibilityInfo.announceForAccessibility('Pago conciliado manualmente.');
    },
    [selected],
  );

  const value = useMemo(
    () => ({
      transactions,
      resolvedIds,
      selected,
      phase,
      refreshTransactions,
      open,
      close,
      startForce,
      cancelForce,
      confirmForce,
    }),
    [transactions, resolvedIds, selected, phase, refreshTransactions, open, close, startForce, cancelForce, confirmForce],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReconciliation() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useReconciliation must be used inside ReconciliationProvider');
  return ctx;
}
