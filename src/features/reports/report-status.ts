import { C } from '@/constants/colors';
import type { Report, ReportEstado } from '@/types';

export const ESTADO_STYLE: Record<ReportEstado, { bg: string; fg: string; sym: string }> = {
  Nuevo: { bg: C.blueSoft, fg: C.blue, sym: '●' },
  Asignado: { bg: C.blueChip, fg: C.blueChipText, sym: '→' },
  'En proceso': { bg: '#FEF3C7', fg: '#92400E', sym: '…' },
  Resuelto: { bg: C.successSoft, fg: C.success, sym: '✓' },
};

/** Order of the follow-up steps shown in the detail sheet. */
export const ESTADO_STEPS: ReportEstado[] = ['Nuevo', 'Asignado', 'En proceso', 'Resuelto'];

export const ESTADO_FILTERS = ['Todos', ...ESTADO_STEPS];
export const PRIORIDAD_FILTERS = ['Todas', 'Alta', 'Media', 'Baja'];

export interface ReportFilters {
  q: string;
  categoria: string;
  estado: string;
  prioridad: string;
}

export const NO_FILTERS: ReportFilters = { q: '', categoria: 'Todos', estado: 'Todos', prioridad: 'Todas' };

export function filterReports(reports: Report[], f: ReportFilters) {
  const term = f.q.trim().toLowerCase();
  return reports.filter(
    (r) =>
      (f.categoria === 'Todos' || r.categoria === f.categoria) &&
      (f.estado === 'Todos' || r.estado === f.estado) &&
      (f.prioridad === 'Todas' || r.prioridad === f.prioridad) &&
      (!term || `${r.title} ${r.address} ${r.categoria}`.toLowerCase().includes(term)),
  );
}

export function activeFilterCount(f: ReportFilters) {
  return [f.categoria !== 'Todos', f.estado !== 'Todos', f.prioridad !== 'Todas', f.q.trim() !== ''].filter(Boolean).length;
}
