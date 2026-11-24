import { C } from '@/constants/colors';
import type { ReportPrioridad } from '@/types';

/** Rules of the "Nuevo reporte" form, kept apart from the UI so they can be tested alone. */
export const MAX_DESC = 250;
export const MIN_DESC = 10;
export const MAX_PHOTOS = 4;

export const PROBLEMAS: Record<string, string[]> = {
  'Alumbrado público': ['Lámpara apagada', 'Poste dañado', 'Cableado expuesto'],
  Vialidad: ['Bache en la calle', 'Semáforo descompuesto', 'Señalización dañada'],
  Agua: ['Fuga de agua', 'Sin suministro', 'Drenaje tapado'],
  'Limpieza y residuos': ['Contenedor lleno', 'Basura acumulada'],
  'Parques y jardines': ['Juego dañado', 'Árbol caído', 'Pasto sin podar'],
};

export const PRIORIDADES: { id: ReportPrioridad; hint: string; mark: string }[] = [
  { id: 'Baja', hint: 'Puede esperar', mark: C.blueIcon },
  { id: 'Media', hint: 'Afecta a vecinos', mark: C.blueMid },
  { id: 'Alta', hint: 'Riesgo o urgencia', mark: C.blue },
];

export type FormErrors = { addr?: string; desc?: string; send?: string };

export function validateReport(addr: string, desc: string): FormErrors {
  const e: FormErrors = {};
  if (!addr.trim()) e.addr = 'Indica dónde está el problema: escribe la dirección o usa tu ubicación.';
  if (desc.trim().length < MIN_DESC) e.desc = `Describe el problema con al menos ${MIN_DESC} caracteres.`;
  return e;
}
