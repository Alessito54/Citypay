import {
  getDepartment,
  MUNICIPAL_DEPARTMENTS,
  resolveDepartmentForReport,
  type DepartmentSlug,
} from './orizaba';
import type { Report, Servicio, Session, Transaction } from '@/types';

export type Role = 'citizen' | 'municipal_official' | 'municipal_supervisor' | 'admin';

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administración General',
  municipal_supervisor: 'Supervisión / Contraloría',
  municipal_official: 'Personal de Área Municipal',
  citizen: 'Cuenta Ciudadana',
};

export const ROLE_SHORT_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  municipal_supervisor: 'Supervisor',
  municipal_official: 'Personal de área',
  citizen: 'Ciudadano',
};

export interface RolePermissions {
  isStaff: boolean;
  canViewDashboard: boolean;
  canViewPayments: boolean;
  allowedPaymentServices: Servicio[] | null;
  canReconcilePayments: boolean;
  canCreateReport: boolean;
  canViewAllReports: boolean;
  departmentCategories: string[] | null;
  canManageReportStatus: boolean;
  canManageStaff: boolean;
  canAssignAdmin: boolean;
}

export const isStaff = (role?: string | null) =>
  role === 'admin' || role === 'municipal_official' || role === 'municipal_supervisor';

export const roleLabel = (role?: string | null, department?: string | null) => {
  const r = (role ?? 'citizen') as Role;
  const base = ROLE_SHORT_LABEL[r] ?? role ?? ROLE_SHORT_LABEL.citizen;
  const dept = getDepartment(department);
  if ((r === 'municipal_official' || r === 'municipal_supervisor') && dept) {
    return `${base} · ${dept.shortName}`;
  }
  return base;
};

export function getPermissions(session?: Pick<Session, 'role' | 'department'> | null): RolePermissions {
  const role = (session?.role ?? 'citizen') as Role;
  const dept = getDepartment(session?.department);

  if (role === 'admin') {
    return {
      isStaff: true,
      canViewDashboard: true,
      canViewPayments: true,
      allowedPaymentServices: null,
      canReconcilePayments: true,
      canCreateReport: true,
      canViewAllReports: true,
      departmentCategories: null,
      canManageReportStatus: true,
      canManageStaff: true,
      canAssignAdmin: true,
    };
  }

  if (role === 'municipal_supervisor') {
    const isContraloria = dept?.slug === 'contraloria';
    return {
      isStaff: true,
      canViewDashboard: true,
      canViewPayments: true,
      allowedPaymentServices: null,
      canReconcilePayments: !isContraloria,
      canCreateReport: true,
      canViewAllReports: true,
      departmentCategories: dept && dept.reportCategories.length > 0 ? dept.reportCategories : null,
      canManageReportStatus: true,
      canManageStaff: false,
      canAssignAdmin: false,
    };
  }

  if (role === 'municipal_official') {
    if (!dept) {
      return {
        isStaff: true,
        canViewDashboard: true,
        canViewPayments: true,
        allowedPaymentServices: null,
        canReconcilePayments: true,
        canCreateReport: true,
        canViewAllReports: true,
        departmentCategories: null,
        canManageReportStatus: true,
        canManageStaff: false,
        canAssignAdmin: false,
      };
    }

    const hasServices = dept.services.length > 0;
    const hasReports = dept.reportCategories.length > 0;

    return {
      isStaff: true,
      canViewDashboard: true,
      canViewPayments: hasServices,
      allowedPaymentServices: hasServices ? dept.services : [],
      canReconcilePayments: dept.canReconcile,
      canCreateReport: true,
      canViewAllReports: hasReports || dept.slug === 'contraloria',
      departmentCategories: hasReports ? dept.reportCategories : null,
      canManageReportStatus: hasReports,
      canManageStaff: Boolean(dept.managesStaff),
      canAssignAdmin: false,
    };
  }

  return {
    isStaff: false,
    canViewDashboard: false,
    canViewPayments: false,
    allowedPaymentServices: [],
    canReconcilePayments: false,
    canCreateReport: true,
    canViewAllReports: false,
    departmentCategories: null,
    canManageReportStatus: false,
    canManageStaff: false,
    canAssignAdmin: false,
  };
}

export function filterTransactionsForSession(
  txs: Transaction[],
  session?: Pick<Session, 'role' | 'department'> | null,
): Transaction[] {
  const perms = getPermissions(session);
  if (!perms.canViewPayments) return [];
  if (!perms.allowedPaymentServices) return txs;
  return txs.filter((tx) => perms.allowedPaymentServices!.includes(tx.servicio));
}

export function canUserHandleReport(report: Report, session?: Pick<Session, 'role' | 'department'> | null): boolean {
  const perms = getPermissions(session);
  if (!perms.canManageReportStatus) return false;
  if (session?.role === 'admin' || session?.role === 'municipal_supervisor' || !session?.department) return true;
  const targetDept: DepartmentSlug =
    (report.department as DepartmentSlug | undefined) ?? resolveDepartmentForReport(report.categoria, report.title);
  return targetDept === session.department;
}

export { MUNICIPAL_DEPARTMENTS };
