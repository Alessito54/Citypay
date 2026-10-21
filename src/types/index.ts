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
}

export interface NewReportInput {
  categoria: string;
  problema: string;
  prioridad: 'Bajo' | 'Media' | 'Alta';
  direccion: string;
  descripcion: string;
  fotos: string[];
}

export interface Session {
  email: string;
  displayName: string;
  /** true while no real authentication backend is connected. */
  demo: boolean;
  role?: string;
  uid?: string;
}

