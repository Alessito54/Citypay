import type { Transaction } from '@/types';

/** Pure calculations over the payment list, shared by the home and payments screens. */
export function summarize(transactions: Transaction[]) {
  const by = (estado: Transaction['estado']) => transactions.filter((t) => t.estado === estado);
  const diferencias = by('discrepancia');
  return {
    total: transactions.length,
    cuadrados: by('conciliado').length,
    pendientes: by('pendiente').length,
    diferencias,
    totalSistema: transactions.reduce((a, t) => a + t.montoSistema, 0),
    /** Sum of the absolute differences of open discrepancies (pending bank credits excluded). */
    descuadre: diferencias.reduce((a, t) => a + Math.abs(t.montoBanco - t.montoSistema), 0),
  };
}

export function searchText(t: Transaction, serviceLabel: string) {
  return `${t.folio} ${t.concepto} ${t.ciudadano} ${t.banco} ${t.referenciaBancaria} ${serviceLabel}`.toLowerCase();
}
