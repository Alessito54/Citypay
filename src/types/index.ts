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
  reconciledAt?: string | null;
  reconciliationReason?: string | null;
  reconciliationNotes?: string | null;
}

export interface RigorousReconcilePayload {
  reason: string;
  bankReference: string;
  verifiedBankAmount: number;
  evidenceFolio: string;
  notes: string;
  receiptPhoto?: string | PhotoAttachment | null;
}

export type DebtStatus = 'pending' | 'paid' | 'overdue';

export interface CitizenDebt {
  id: string;
  folio: string;
  concept: string;
  amount: number;
  dueDate: string;
  status: DebtStatus;
  serviceSlug: Servicio;
  serviceName: string;
}

export interface MunicipalCitizenData {
  cadastralKey?: string;
  propertyAddress?: string;
  propertyType?: 'Urbano' | 'Rústico';
  waterAccount?: string;
  vehiclePlates?: string;
  driverLicense?: string;
}

export type ReportEstado = 'Nuevo' | 'En proceso' | 'Asignado' | 'Resuelto';
export type ReportPrioridad = 'Alta' | 'Media' | 'Baja';

export interface PhotoAttachment {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
}

export interface ReportHistoryEntry {
  id: string;
  previousStatus: string;
  newStatus: string;
  notes?: string | null;
  date: string;
  changedBy: string;
}

export interface Report {
  id: string;
  title: string;
  address: string;
  date: string;
  estado: ReportEstado;
  categoria: string;
  department?: string | null;
  departamentoNombre?: string | null;
  prioridad: ReportPrioridad;
  icon: string;
  description?: string;
  fotos?: string[];
  latitude?: number | null;
  longitude?: number | null;
  createdAt?: string;
  user?: {
    id: string;
    displayName: string;
    email: string;
  } | null;
  history?: ReportHistoryEntry[];
}

export interface NewReportInput {
  categoria: string;
  problema: string;
  prioridad: ReportPrioridad;
  direccion: string;
  descripcion: string;
  fotos: (string | PhotoAttachment)[];
  latitude?: number;
  longitude?: number;
}

export interface Session {
  email: string;
  displayName: string;
  role: string;
  department?: string | null;
  municipalData?: MunicipalCitizenData | null;
  uid: string;
}

export interface ManagedUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  department?: string | null;
  phone?: string | null;
  createdAt?: string;
}
