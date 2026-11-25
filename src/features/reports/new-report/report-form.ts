import { C } from '@/constants/colors';
import type { ReportPrioridad } from '@/types';

/** Reglas del formulario "Nuevo reporte" adaptadas a los servicios del H. Ayuntamiento de Orizaba, Veracruz. */
export const MAX_DESC = 250;
export const MIN_DESC = 10;
export const MAX_PHOTOS = 4;

export const PROBLEMAS: Record<string, string[]> = {
  Vialidad: ['Bache en la calle', 'Banqueta o guarnición dañada', 'Hundimiento en pavimento'],
  'Tránsito y vialidad': ['Semáforo descompuesto', 'Señalización dañada', 'Obstrucción vial / vehículo abandonado'],
  'Alumbrado público': ['Lámpara apagada', 'Poste dañado', 'Cableado expuesto'],
  Agua: ['Fuga de agua', 'Sin suministro', 'Drenaje tapado', 'Alcantarilla sin tapa'],
  'Limpieza y residuos': ['Contenedor lleno', 'Basura acumulada', 'Camión recolector no pasó'],
  'Parques y jardines': ['Juego dañado', 'Árbol caído o en riesgo', 'Pasto sin podar'],
  'Catastro y predial': ['Aclaración de clave catastral', 'Actualización de datos de predio'],
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
