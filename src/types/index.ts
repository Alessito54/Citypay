export type Status = 'conciliado' | 'discrepancia' | 'pendiente';
export type Servicio = 'predial' | 'agua' | 'multas';

export interface Transaction {
  id: string;
  folio: string;
  referenciaBancaria: string;
  concepto: string;
  servicio: Servicio;
  fecha: string;
  montoSistema: number;
  montoBanco: number;
  estado: Status;
  ciudadano: string;
  metodoPago: string;
  banco: string;
}

export type ReportEstado = 'Nuevo' | 'En proceso' | 'Asignado' | 'Resuelto';
export type ReportPrioridad = 'Alta' | 'Media' | 'Baja';

export interface Report {
  id: string;
  title: string;
  address: string;
  date: string;
  estado: ReportEstado;
  categoria: string;
  prioridad: ReportPrioridad;
  icon: string;
  /** true when the record only exists on this device (no backend). */
  localOnly?: boolean;
  /** Pin chosen on the map, when the citizen marked one. */
  latitude?: number;
  longitude?: number;
  /** Department the incident was routed to, as resolved by the backend. */
  departmentId?: string | null;
  departamento?: string | null;
  departamentoSlug?: string | null;
}

export interface NewReportInput {
  categoria: string;
  problema: string;
  prioridad: 'Bajo' | 'Media' | 'Alta';
  direccion: string;
  descripcion: string;
  fotos: string[];
  /** Optional pin from the map (OpenStreetMap). The backend DTO already accepts these fields. */
  latitude?: number;
  longitude?: number;
}

export interface Session {
  email: string;
  displayName: string;
  /** true while no real authentication backend is connected. */
  demo: boolean;
  role?: string;
  uid?: string;
  /** Municipal department the account is attached to (staff accounts only). */
  departmentId?: string | null;
  departamento?: string | null;
  departamentoSlug?: string | null;
}

/** Roles that work inside the municipal administration, as opposed to citizens. */
export const STAFF_ROLES = ['admin', 'municipal_supervisor', 'municipal_official'] as const;

export function isStaffRole(role?: string | null): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

export type DepartmentArea = 'recaudacion' | 'operacion' | 'control';

export interface DepartmentMetrics {
  totalSistema: number;
  recaudado: number;
  descuadre: number;
  pagosTotal: number;
  pagosConciliados: number;
  pagosDiscrepancia: number;
  pagosPendientes: number;
  carteraPendiente: number;
  carteraVencida: number;
  adeudosCount: number;
  reportesTotal: number;
  reportesNuevos: number;
  reportesAsignados: number;
  reportesProceso: number;
  reportesResueltos: number;
  reportesVencidos: number;
  tasaResolucion: number;
  diasPromedioResolucion: number | null;
  equipo: number;
}

export interface Department {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  area: DepartmentArea;
  serviceSlugs: string[];
  reportCategories: string[];
  headName: string;
  contactEmail: string;
  contactPhone: string;
  office: string;
  scheduleLabel: string;
  slaDays: number;
  isConsolidator: boolean;
  isActive: boolean;
  /** Only present for municipal staff; the citizen directory omits it. */
  metrics?: DepartmentMetrics | null;
}

export interface DepartmentStaff {
  id: string;
  email: string;
  displayName: string;
  role: string;
  phone?: string | null;
  departmentId?: string | null;
}

export interface DepartmentReport extends Report {
  departmentId?: string | null;
  description?: string;
  ciudadano?: string | null;
  asignadoA?: string | null;
}

export interface DepartmentDetail extends Department {
  metrics: DepartmentMetrics | null;
  staff: DepartmentStaff[];
  reports: DepartmentReport[];
  payments: Transaction[];
}

/* ----------------------------- Centro de Informes ----------------------------- */

export type InformeType = 'recaudacion' | 'conciliacion' | 'cartera' | 'desempeno' | 'reportes';

export type InformeGroupBy =
  | 'department'
  | 'service'
  | 'method'
  | 'bank'
  | 'status'
  | 'category'
  | 'priority'
  | 'month';

export interface InformeColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'money' | 'percent' | 'days';
}

export type InformeRow = Record<string, string | number | null>;

export interface Informe {
  type: InformeType;
  title: string;
  subtitle: string;
  groupBy: InformeGroupBy;
  periodLabel: string;
  from: string | null;
  to: string | null;
  columns: InformeColumn[];
  rows: InformeRow[];
  totals: InformeRow | null;
  highlights: { label: string; value: string }[];
  generatedAt: string;
}

export interface AnalyticsOverview {
  periodLabel: string;
  from: string | null;
  to: string | null;
  recaudado: number;
  totalSistema: number;
  totalBanco: number;
  descuadre: number;
  pagosTotal: number;
  pagosConciliados: number;
  pagosDiscrepancia: number;
  pagosPendientes: number;
  tasaConciliacion: number;
  carteraVigente: number;
  carteraVencida: number;
  adeudosCount: number;
  reportesTotal: number;
  reportesResueltos: number;
  reportesAbiertos: number;
  departamentosActivos: number;
  generatedAt: string;
}

