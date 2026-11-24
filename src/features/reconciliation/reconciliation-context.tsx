import { AccessibilityInfo } from 'react-native';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { DataSource, Loaded } from '@/lib/data-source';
import { useSessionData } from '@/lib/use-session-data';
import { reconciliationService } from '@/services/reconciliation-service';
import type { Transaction } from '@/types';

import { useAuth } from '../auth/auth-context';

type Phase = 'closed' | 'detail' | 'force';

interface ReconciliationValue {
  transactions: Transaction[];
  source: DataSource;
  loading: boolean;
  /** ids reconciled manually during this session (to show the confirmation). */
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
const EMPTY: Transaction[] = [];
const NONE = async (): Promise<Loaded<Transaction[]>> => ({ items: EMPTY, source: 'api' });

export function ReconciliationProvider({ children }: { children: ReactNode }) {
  const { session, staff } = useAuth();
  // Citizens never request /payments (the API answers 403 and demo payments appeared instead).
  const data = useSessionData(session?.uid ?? null, staff ? reconciliationService.listTransactions : NONE, EMPTY);
  const { update } = data;
  const [resolvedIds, setResolvedIds] = useState<ReadonlySet<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('closed');

  // Derived from the list, so the sheet always shows the latest state of the payment.
  const selected = useMemo(() => data.items.find((t) => t.id === selectedId) ?? null, [data.items, selectedId]);

  const open = useCallback((tx: Transaction) => {
    setSelectedId(tx.id);
    setPhase('detail');
  }, []);

  const close = useCallback(() => {
    setPhase('closed');
    setSelectedId(null);
  }, []);

  const startForce = useCallback(() => setPhase('force'), []);
  const cancelForce = useCallback(() => setPhase('detail'), []);

  const confirmForce = useCallback(
    async (reason: string, notes: string) => {
      if (!selected) return;
      const saved = await reconciliationService.forceReconcile({ transactionId: selected.id, reason, notes });
      const next: Transaction = saved ?? { ...selected, estado: 'conciliado', montoBanco: selected.montoSistema };
      update((prev) => prev.map((t) => (t.id === next.id ? next : t)));
      setResolvedIds((prev) => new Set(prev).add(next.id));
      // Back to the detail sheet so the user sees the confirmation.
      setPhase('detail');
      AccessibilityInfo.announceForAccessibility('Pago conciliado manualmente.');
    },
    [selected, update],
  );

  const value = useMemo(
    () => ({
      transactions: data.items,
      source: data.source,
      loading: data.loading,
      resolvedIds,
      selected,
      phase,
      refreshTransactions: data.refresh,
      open,
      close,
      startForce,
      cancelForce,
      confirmForce,
    }),
    [data.items, data.source, data.loading, data.refresh, resolvedIds, selected, phase, open, close, startForce, cancelForce, confirmForce],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReconciliation() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useReconciliation must be used inside ReconciliationProvider');
  return ctx;
}
