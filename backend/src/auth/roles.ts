import { User, UserRole } from '../users/entities/user.entity';
import { getDepartmentDef, resolveDepartmentForReport } from './orizaba';

export const STAFF_ROLES = [UserRole.ADMIN, UserRole.MUNICIPAL_OFFICIAL, UserRole.MUNICIPAL_SUPERVISOR];

export const isStaff = (user?: Pick<User, 'role'> | null) => !!user && STAFF_ROLES.includes(user.role);

/** Puede consultar la plantilla de usuarios y gestionar adscripción departamental (Admin y RRHH). */
export function canManageStaff(user?: Pick<User, 'role' | 'department'> | null): boolean {
  if (!user) return false;
  if (user.role === UserRole.ADMIN) return true;
  if (user.role === UserRole.MUNICIPAL_OFFICIAL) {
    return Boolean(getDepartmentDef(user.department)?.managesStaff);
  }
  return false;
}

/** Puede consultar el listado de pagos municipales según su rol y coordinación en Orizaba. */
export function canViewPayments(user?: Pick<User, 'role' | 'department'> | null): boolean {
  if (!user || !isStaff(user)) return false;
  if (user.role === UserRole.ADMIN || user.role === UserRole.MUNICIPAL_SUPERVISOR) return true;
  const dept = getDepartmentDef(user.department);
  if (!dept) return true; // Funcionario sin restricción departamental asignada aún
  return dept.services.length > 0;
}

/** Devuelve los slugs de servicio permitidos (`null` = todos los servicios). */
export function allowedPaymentServices(user?: Pick<User, 'role' | 'department'> | null): string[] | null {
  if (!user) return [];
  if (user.role === UserRole.ADMIN || user.role === UserRole.MUNICIPAL_SUPERVISOR) return null;
  const dept = getDepartmentDef(user.department);
  if (!dept) return null;
  return dept.services;
}

/** Verifica si el usuario puede ejecutar una conciliación manual sobre un servicio dado. */
export function canReconcilePayment(
  user?: Pick<User, 'role' | 'department'> | null,
  serviceSlug?: string,
): boolean {
  if (!user || !isStaff(user)) return false;
  if (user.role === UserRole.ADMIN) return true;
  if (user.role === UserRole.MUNICIPAL_SUPERVISOR) {
    // Contraloría audita pero no fuerza conciliaciones de recaudación
    return user.department !== 'contraloria';
  }
  const dept = getDepartmentDef(user.department);
  if (!dept) return true;
  if (!dept.canReconcile) return false;
  return !serviceSlug || dept.services.includes(serviceSlug as any);
}

/** Verifica si el usuario puede actualizar el estado de un reporte ciudadano. */
export function canManageReport(
  user: Pick<User, 'role' | 'department'> | null | undefined,
  reportCategory: string,
  reportTitle?: string,
  reportDepartment?: string | null,
): boolean {
  if (!user || !isStaff(user)) return false;
  if (user.role === UserRole.ADMIN || user.role === UserRole.MUNICIPAL_SUPERVISOR) return true;
  if (!user.department) return true;
  const dept = getDepartmentDef(user.department);
  if (!dept || dept.reportCategories.length === 0) return false;
  const target = reportDepartment || resolveDepartmentForReport(reportCategory, reportTitle);
  return target === user.department;
}
