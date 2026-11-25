import type { Servicio } from '@/types';

/**
 * Catálogo de áreas y coordinaciones municipales para canalizar trámites, pagos y reportes.
 */
export type DepartmentSlug =
  | 'ingresos'
  | 'egresos'
  | 'catastro'
  | 'transito'
  | 'agua_potable'
  | 'obras_publicas'
  | 'alumbrado'
  | 'limpia_publica'
  | 'parques_jardines'
  | 'recursos_humanos'
  | 'contraloria';

export interface MunicipalDepartment {
  slug: DepartmentSlug;
  name: string;
  shortName: string;
  parentArea: string;
  extension: string;
  description: string;
  citizenGuidance: string;
  services: Servicio[];
  canReconcile: boolean;
  reportCategories: string[];
  managesStaff?: boolean;
}

export const MUNICIPIO_INFO = {
  nombre: 'Atención y Servicios Municipales',
  subtitulo: 'Trámites, pagos en línea y reportes ciudadanos en un solo lugar',
  telefono: '072 / Atención Ciudadana',
  center: { latitude: 18.8505, longitude: -97.1036 },
} as const;

export const MUNICIPAL_DEPARTMENTS: MunicipalDepartment[] = [
  {
    slug: 'ingresos',
    name: 'Coordinación de Ingresos',
    shortName: 'Ingresos',
    parentArea: 'Tesorería Municipal',
    extension: '3210',
    description: 'Recaudación de impuestos, derechos y aprovechamientos; conciliación bancaria de pagos.',
    citizenGuidance: 'Acude o consulta aquí aclaraciones sobre recibos pagados, referencias SPEI y comprobantes fiscales.',
    services: ['predial', 'agua', 'multas'],
    canReconcile: true,
    reportCategories: [],
  },
  {
    slug: 'egresos',
    name: 'Coordinación de Egresos',
    shortName: 'Egresos',
    parentArea: 'Tesorería Municipal',
    extension: '3212',
    description: 'Control presupuestal, dispersión de pagos y revisión contable de movimientos bancarios.',
    citizenGuidance: 'Atiende trámites administrativos de proveedores, devoluciones autorizadas y control presupuestal.',
    services: ['predial', 'agua', 'multas'],
    canReconcile: false,
    reportCategories: [],
  },
  {
    slug: 'catastro',
    name: 'Dirección de Catastro',
    shortName: 'Catastro',
    parentArea: 'Desarrollo Urbano y Tesorería',
    extension: '3230',
    description: 'Padrón de predios urbanos y rústicos, claves catastrales, avalúos y cobro de Impuesto Predial.',
    citizenGuidance: 'Dirígete aquí para actualizar datos de tu propiedad, consultar tu clave catastral o pagar tu Predial.',
    services: ['predial'],
    canReconcile: true,
    reportCategories: ['Catastro y predial'],
  },
  {
    slug: 'transito',
    name: 'Coordinación de Tránsito y Vialidad',
    shortName: 'Tránsito y Vialidad',
    parentArea: 'Seguridad Pública y Movilidad',
    extension: '3260',
    description: 'Orden vial, semáforos, señalética urbana y gestión/cobro de boletas de infracción.',
    citizenGuidance: 'Consulta y paga infracciones viales por placa o folio, o reporta semáforos y señales dañadas.',
    services: ['multas'],
    canReconcile: true,
    reportCategories: ['Tránsito y vialidad'],
  },
  {
    slug: 'agua_potable',
    name: 'Coordinación de Agua Potable y Drenaje',
    shortName: 'Agua Potable',
    parentArea: 'Servicios Municipales',
    extension: '3289 / 3295',
    description: 'Suministro de agua potable, contratos domiciliarios, red de drenaje y reparación de fugas.',
    citizenGuidance: 'Paga tu recibo mensual con tu número de contrato o reporta fugas de agua, falta de servicio y drenajes tapados.',
    services: ['agua'],
    canReconcile: true,
    reportCategories: ['Agua'],
  },
  {
    slug: 'obras_publicas',
    name: 'Dirección de Obras Públicas y Bacheo',
    shortName: 'Obras Públicas',
    parentArea: 'Obras Públicas',
    extension: '3279',
    description: 'Bacheo de calles, pavimentación, reparación de banquetas, guarniciones e infraestructura urbana.',
    citizenGuidance: 'Reporta aquí baches, hundimientos en el pavimento o banquetas dañadas adjuntando foto y ubicación.',
    services: [],
    canReconcile: false,
    reportCategories: ['Vialidad', 'Obras públicas y bacheo'],
  },
  {
    slug: 'alumbrado',
    name: 'Coordinación de Alumbrado Público',
    shortName: 'Alumbrado Público',
    parentArea: 'Servicios Municipales',
    extension: '3293',
    description: 'Mantenimiento de luminarias, postes y cableado eléctrico en calles y espacios públicos.',
    citizenGuidance: 'Reporta lámparas apagadas, intermitentes o postes en mal estado en tu calle o colonia.',
    services: [],
    canReconcile: false,
    reportCategories: ['Alumbrado público'],
  },
  {
    slug: 'limpia_publica',
    name: 'Coordinación de Limpia Pública',
    shortName: 'Limpia Pública',
    parentArea: 'Servicios Municipales',
    extension: '3291 / 3296',
    description: 'Recolección de residuos sólidos, contenedores comunitarios y limpieza de espacios urbanos.',
    citizenGuidance: 'Reporta contenedores llenos, basura acumulada en vía pública o atrasos en la ruta recolectora.',
    services: [],
    canReconcile: false,
    reportCategories: ['Limpieza y residuos'],
  },
  {
    slug: 'parques_jardines',
    name: 'Coordinación de Parques y Jardines',
    shortName: 'Parques y Jardines',
    parentArea: 'Servicios Municipales',
    extension: '3295',
    description: 'Conservación de parques, áreas verdes, juegos infantiles, poda preventiva y arbolado.',
    citizenGuidance: 'Solicita mantenimiento de juegos infantiles, poda de pasto o atención por árboles caídos o en riesgo.',
    services: [],
    canReconcile: false,
    reportCategories: ['Parques y jardines'],
  },
  {
    slug: 'recursos_humanos',
    name: 'Coordinación de Recursos Humanos',
    shortName: 'Recursos Humanos',
    parentArea: 'Administración Interna',
    extension: '3220',
    description: 'Administración de plantilla laboral y asignación de personal operativo a cada coordinación.',
    citizenGuidance: 'Área administrativa interna encargada de organizar y asignar al personal de atención.',
    services: [],
    canReconcile: false,
    reportCategories: [],
    managesStaff: true,
  },
  {
    slug: 'contraloria',
    name: 'Contraloría Municipal',
    shortName: 'Contraloría',
    parentArea: 'Órgano Interno de Control',
    extension: '3215',
    description: 'Supervisión del servicio público, auditoría de conciliaciones y seguimiento a tiempos de respuesta.',
    citizenGuidance: 'Supervisa que tus reportes y pagos se atiendan con transparencia y en tiempo.',
    services: ['predial', 'agua', 'multas'],
    canReconcile: false,
    reportCategories: [],
  },
];

// Alias para mantener compatibilidad con imports existentes
export const ORIZABA_DEPARTMENTS = MUNICIPAL_DEPARTMENTS;

export const DEPARTMENT_BY_SLUG: Record<DepartmentSlug, MunicipalDepartment> = Object.fromEntries(
  MUNICIPAL_DEPARTMENTS.map((d) => [d.slug, d]),
) as Record<DepartmentSlug, MunicipalDepartment>;

export function getDepartment(slug?: string | null): MunicipalDepartment | null {
  if (!slug) return null;
  return DEPARTMENT_BY_SLUG[slug as DepartmentSlug] ?? null;
}

export function departmentLabel(slug?: string | null): string {
  return getDepartment(slug)?.name ?? 'Atención General';
}

export function resolveDepartmentForReport(category: string, problemTitle?: string): DepartmentSlug {
  const title = (problemTitle ?? '').toLowerCase();
  if (category === 'Tránsito y vialidad') return 'transito';
  if (category === 'Vialidad' || category === 'Obras públicas y bacheo') {
    if (title.includes('semáforo') || title.includes('señal') || title.includes('vial') || title.includes('vehículo')) {
      return 'transito';
    }
    return 'obras_publicas';
  }
  if (category === 'Alumbrado público') return 'alumbrado';
  if (category === 'Agua') return 'agua_potable';
  if (category === 'Limpieza y residuos') return 'limpia_publica';
  if (category === 'Parques y jardines') return 'parques_jardines';
  if (category === 'Catastro y predial') return 'catastro';
  return 'obras_publicas';
}
