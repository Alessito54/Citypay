import { AccessibilityInfo, AppState, Platform } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { DataSource, Loaded } from '@/lib/data-source';
import { filterTransactionsForSession } from '@/lib/roles';
import { useSessionData } from '@/lib/use-session-data';
import { subscribeRealtimeEvents } from '@/services/realtime-service';
import { reconciliationService } from '@/services/reconciliation-service';
import type { RigorousReconcilePayload, Transaction } from '@/types';

import { useAuth } from '../auth/auth-context';

type Phase = 'closed' | 'detail' | 'force';

interface ReconciliationValue {
  transactions: Transaction[];
  source: DataSource;
  sourceReason?: string;
  loading: boolean;
  resolvedIds: ReadonlySet<string>;
  selected: Transaction | null;
  phase: Phase;
  refreshTransactions: () => Promise<void>;
  open: (tx: Transaction) => void;
  close: () => void;
  startForce: () => void;
  cancelForce: () => void;
  confirmForce: (payload: RigorousReconcilePayload) => Promise<void>;
}

const Ctx = createContext<ReconciliationValue | null>(null);
const EMPTY: Transaction[] = [];
const NONE = async (): Promise<Loaded<Transaction[]>> => ({ items: EMPTY, source: 'api' });

export function ReconciliationProvider({ children }: { children: ReactNode }) {
  const { session, permissions } = useAuth();
  const canLoadPayments = Boolean(session && permissions.canViewPayments);
  const sessionKey = session ? `${session.uid}:${session.role}:${session.department ?? 'all'}` : null;

  const data = useSessionData(
    sessionKey,
    canLoadPayments ? reconciliationService.listTransactions : NONE,
    EMPTY,
  );
  const { update } = data;
  const [resolvedIds, setResolvedIds] = useState<ReadonlySet<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('closed');

  const scopedTransactions = useMemo(
    () => filterTransactionsForSession(data.items, session),
    [data.items, session],
  );

  const selected = useMemo(
    () => scopedTransactions.find((t) => t.id === selectedId) ?? null,
    [scopedTransactions, selectedId],
  );

  useEffect(() => {
    if (!canLoadPayments) return;
    const unsub = subscribeRealtimeEvents((msg) => {
      if (msg.type === 'payment.created') {
        const tx = msg.data as Transaction;
        if (tx?.id) update((prev) => (prev.some((x) => x.id === tx.id) ? prev : [tx, ...prev]));
      } else if (msg.type === 'payment.reconciled') {
        const tx = msg.data as Transaction;
        if (tx?.id) update((prev) => prev.map((x) => (x.id === tx.id ? { ...x, ...tx } : x)));
      }
    });

    const interval = setInterval(async () => {
      if (Platform.OS === 'web' && typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      if (Platform.OS !== 'web' && AppState.currentState !== 'active') return;
      try {
        const res = await reconciliationService.listTransactions();
        if (res.source === 'api') update(() => res.items, 'api');
      } catch {
        // Silencioso
      }
    }, 6_000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [canLoadPayments, update]);

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
    async (payload: RigorousReconcilePayload) => {
      if (!selected) return;
      const saved = await reconciliationService.forceReconcile({
        transactionId: selected.id,
        ...payload,
      });
      const next: Transaction = saved ?? {
        ...selected,
        estado: 'conciliado',
        referenciaBancaria: payload.bankReference.trim().toUpperCase(),
        montoBanco: payload.verifiedBankAmount,
        reconciliationReason: `${payload.reason} [Póliza: ${payload.evidenceFolio.trim().toUpperCase()}]`,
        reconciliationNotes: payload.notes.trim(),
      };
      update((prev) => prev.map((t) => (t.id === next.id ? next : t)));
      setResolvedIds((prev) => new Set(prev).add(next.id));
      setPhase('detail');
      AccessibilityInfo.announceForAccessibility('Dictamen de conciliación registrado exitosamente.');
    },
    [selected, update],
  );

  const value = useMemo(
    () => ({
      transactions: scopedTransactions,
      source: data.source,
      sourceReason: data.reason,
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
    [
      scopedTransactions,
      data.source,
      data.reason,
      data.loading,
      data.refresh,
      resolvedIds,
      selected,
      phase,
      open,
      close,
      startForce,
      cancelForce,
      confirmForce,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReconciliation() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useReconciliation must be used inside ReconciliationProvider');
  return ctx;
}
