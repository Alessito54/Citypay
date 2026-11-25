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

export interface BackendDepartmentDef {
  slug: DepartmentSlug;
  name: string;
  parentArea: string;
  extension: string;
  services: Array<'predial' | 'agua' | 'multas'>;
  canReconcile: boolean;
  reportCategories: string[];
  managesStaff?: boolean;
}

export const MUNICIPAL_DEPARTMENTS: BackendDepartmentDef[] = [
  {
    slug: 'ingresos',
    name: 'Coordinación de Ingresos',
    parentArea: 'Tesorería Municipal',
    extension: '3210',
    services: ['predial', 'agua', 'multas'],
    canReconcile: true,
    reportCategories: [],
  },
  {
    slug: 'egresos',
    name: 'Coordinación de Egresos',
    parentArea: 'Tesorería Municipal',
    extension: '3212',
    services: ['predial', 'agua', 'multas'],
    canReconcile: false,
    reportCategories: [],
  },
  {
    slug: 'catastro',
    name: 'Dirección de Catastro',
    parentArea: 'Desarrollo Urbano y Tesorería',
    extension: '3230',
    services: ['predial'],
    canReconcile: true,
    reportCategories: ['Catastro y predial'],
  },
  {
    slug: 'transito',
    name: 'Coordinación de Tránsito y Vialidad',
    parentArea: 'Seguridad Pública y Movilidad',
    extension: '3260',
    services: ['multas'],
    canReconcile: true,
    reportCategories: ['Tránsito y vialidad'],
  },
  {
    slug: 'agua_potable',
    name: 'Coordinación de Agua Potable y Alcantarillado',
    parentArea: 'Servicios Municipales',
    extension: '3289 / 3295',
    services: ['agua'],
    canReconcile: true,
    reportCategories: ['Agua'],
  },
  {
    slug: 'obras_publicas',
    name: 'Dirección de Obras Públicas y Mantenimiento Urbano',
    parentArea: 'Obras Públicas',
    extension: '3279',
    services: [],
    canReconcile: false,
    reportCategories: ['Vialidad', 'Obras públicas y bacheo'],
  },
  {
    slug: 'alumbrado',
    name: 'Coordinación de Alumbrado Público',
    parentArea: 'Servicios Municipales',
    extension: '3293',
    services: [],
    canReconcile: false,
    reportCategories: ['Alumbrado público'],
  },
  {
    slug: 'limpia_publica',
    name: 'Coordinación de Limpia Pública',
    parentArea: 'Servicios Municipales',
    extension: '3291 / 3296',
    services: [],
    canReconcile: false,
    reportCategories: ['Limpieza y residuos'],
  },
  {
    slug: 'parques_jardines',
    name: 'Coordinación de Parques y Jardines',
    parentArea: 'Servicios Municipales',
    extension: '3295',
    services: [],
    canReconcile: false,
    reportCategories: ['Parques y jardines'],
  },
  {
    slug: 'recursos_humanos',
    name: 'Coordinación de Recursos Humanos',
    parentArea: 'Administración Interna',
    extension: '3220',
    services: [],
    canReconcile: false,
    reportCategories: [],
    managesStaff: true,
  },
  {
    slug: 'contraloria',
    name: 'Contraloría Municipal',
    parentArea: 'Órgano Interno de Control',
    extension: '3215',
    services: ['predial', 'agua', 'multas'],
    canReconcile: false,
    reportCategories: [],
  },
];

export const ORIZABA_DEPARTMENTS = MUNICIPAL_DEPARTMENTS;
export const VALID_DEPARTMENT_SLUGS = MUNICIPAL_DEPARTMENTS.map((d) => d.slug);

export function getDepartmentDef(slug?: string | null): BackendDepartmentDef | null {
  if (!slug) return null;
  return MUNICIPAL_DEPARTMENTS.find((d) => d.slug === slug) ?? null;
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
