/** Roles defined by the backend (users.entity.ts → UserRole). */
export type Role = 'citizen' | 'municipal_official' | 'municipal_supervisor' | 'admin';

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador general',
  municipal_official: 'Funcionario municipal',
  municipal_supervisor: 'Supervisor municipal',
  citizen: 'Ciudadano',
};

/** Staff can see and reconcile payments; citizens only create and follow reports. */
export const isStaff = (role?: string | null) =>
  role === 'admin' || role === 'municipal_official' || role === 'municipal_supervisor';

export const roleLabel = (role?: string | null) => ROLE_LABEL[(role ?? 'citizen') as Role] ?? role ?? ROLE_LABEL.citizen;
